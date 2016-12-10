'use strict';

// Load modules
const Amqp = require('amqplib/callback_api');

const Items = require('items');
const Uri = require('./uri');
const Schema = require('./schema');

// Declare internals
const internals = {};

exports = module.exports = class Connection {

    constructor(uriOptions, socketOptions) {

        this._uri = new Uri(uriOptions);

        this.connection = null;
        this._channels = {};
        this._socket = Schema.apply('socket', socketOptions);
    }

    channelCount() {

        return Object.keys(this._channels).length;
    };

    open(done) {

        if (this._connection) {
            done(new Error('Connection already intialized.'));
        }

        Amqp.connect(this._uri.full, this._socket, (err, conn) => {

            if (err) {
                return done(err);
            }

            this._connection = conn;
            done();
        });
    };

    close(done) {

        if (!this._connection) {
            return done(new Error('No active connection.  Cannot close.'));
        }

        //  First close all the active channels.
        const items = Object.keys(this._channels).map((key) => this._channels[key]);

        const each = (channel, next) => channel.close(next);
        Items.parallel(items, each, (err) => {

            if (err) {
                return done(err);
            }

            this._channels = {};

            // Now close the connection
            this._connection.close((err) => {

                if (err) {
                    return done(err);
                }

                this._connection = null;
                done();
            });
        });
    };


    createChannel(done) {

        if (!this._connection) {
            return done(new Error('No active connection.  Cannot create a channel.'));
        }

        this._connection.createChannel((err, ch) => {

            if (err) {
                return done(err);
            }

            const key = this._getKey(Object.keys(this._channels));
            this._channels[key] = ch;

            ch.on('close', this.channelClose.bind(this, key));

            done(null, ch);
        });
    };

    _getKey(items) {

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


    channelClose(key, err) {

        delete this._channels[key];
    };

};
