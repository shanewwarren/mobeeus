'use strict';

// Load modules
const Amqp = require('amqplib');
const Co = require('co');
const Joi = require('joi');

const Uri = require('./uri');
const SocketSchema = require('./schemas').Socket;

// Declare internals
const internals = {};

internals.getKey = function (items) {

    let counter = 1;
    items = items.map((item) => parseInt(item));
    items.sort();
    for (const item of items) {

        if (item !== counter) {
            return counter;
        }

        counter++;
    }

    return counter;
};

exports = module.exports = class Connection {

    constructor(uriOptions, socketOptions) {

        this._uri = new Uri(uriOptions);

        const result = Joi.validate(socketOptions, SocketSchema);
        if (result.error) {
            throw new Error(result.error);
        }

        this._socketOptions = result.value;

        this._connection = null;
        this._activeChannels = {};
    }

    get connection() {

        return this._connection;
    }

    get channelCount() {

        const keys = Object.keys(this._activeChannels);
        return keys.length;
    }

    /**
     * Connects to an instance of RabbitMQ
     *
     * @throws If it fails to connect with uri provided.
     */
    open() {

        if (this._connection) {
            throw new Error('Connection already intialized.');
        }

        return Amqp.connect(this._uri, this._socketOptions)
                   .then((connection) => {

                       this._connection = connection;
                   });
    }

    /**
     * Closes active connection to RabbitMQ
     *
     * @returns Promise(err) Successful if the err value is not defined.
     * @throws If there is no active connection.
     */
    close() {

        if (!this._connection) {
            return Promise.reject(new Error('No active connection.  Cannot close.'));
        }

        return Co(function *() {

            //  First close all the active channels.
            const closeChannels = [];

            const keys = Object.keys(this._activeChannels);
            keys.forEach((key) => {

                const channel = this._activeChannels[key];
                closeChannels.push(channel.close());
            });

            yield Promise.all(closeChannels);

            this._activeChannels = [];

            // Now close the connection
            yield this._connection.close();

            this._connection = null;

        }.bind(this));

    }


    createChannel() {

        if (!this._connection) {
            return Promise.reject(new Error('No active connection.  Cannot create a channel.'));
        }

        return this._connection.createChannel().then((channel) => {

            // Push to our active channels.
            const key = internals.getKey(Object.keys(this._activeChannels));

            this._activeChannels[key] = channel;
            channel.on('close', this.channelClose.bind(this, key));
            return channel;
        });
    }

    channelClose(key, err) {

        delete this._activeChannels[key];
    }
};
