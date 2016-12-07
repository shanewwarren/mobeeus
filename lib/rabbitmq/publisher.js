'use strict';

// Load modules
const Connection = require('./connection');
const Co = require('co');
const Joi = require('joi');

// Schema Definitions
const QueueSchema = require('./schemas').Queue;
const PublisherSchema = require('./schemas').Publisher;

// Declare internals
const internals = {};

// Publisher
exports = module.exports = class Publisher {

    constructor() {

    }

    connect(connection, options) {

        return Co(function *() {

            // Check that a channel hasn't already been created.
            if (this._channel) {
                return Promise.reject(new Error('Channel is already connected, disconnect the channel first.'));
            }

            // Verify that the connection has a value.
            if (!connection) {
                return Promise.reject(new Error('Connection is not initialized'));
            }

            // Verify that it actually is a Connection instance
            if (!(connection instanceof Connection)) {
                return Promise.reject(new Error('Connection is not a instance of Connection.'));
            }

            // Validate the queue options
            const result = Joi.validate(options, QueueSchema);
            if (result.error) {
                throw new Error(result.error);
            }

            this._queueOptions = result.value;

            // Create the channel
            this._channel = yield this._createChannel(connection);

            // Create the queue if it does not exist.
            yield this._channel.assertQueue(this._queueOptions.name, this._queueOptions);

        }.bind(this));
    }

    addTask(task, options) {

        if (!this._channel) {
            throw new Error('Channel is not initialized, cannot add task to queue.');
        }

        const result = Joi.validate(options, PublisherSchema);
        if (result.error) {
            throw new Error(result.error);
        }

        const addTaskOptions = result.value;

        const json = JSON.stringify(task);

        this._channel.sendToQueue(this._queueOptions.name,
            new Buffer(json),
            addTaskOptions);

    };

    disconnect() {

        return Co(function *() {

            if (!this._channel) {
                throw new Error('Channel is not initialized, cannot disconnect.');
            }

            yield this._channel.close();

            this._disposeChannel();

        }.bind(this));
    }


    _createChannel(connection) {

        // Create the channel
        return connection.createChannel().then((channel) => {

            // Subscribe to all of the channel events.
            channel.on('close', this._onClose);
            channel.on('error', this._onError);
            channel.on('return', this._onReturn);
            channel.on('drain', this._onDrain);

            return channel;
        });

    };

    _disposeChannel() {

        // Unsubscribe from all of the channel events.
        this._channel.removeListener('close', this._onClose);
        this._channel.removeListener('error', this._onError);
        this._channel.removeListener('return', this._onReturn);
        this._channel.removeListener('drain', this._onDrain);

        this._channel = null;

    };

    _onClose() {

        // Channel has been closed
        if (this._channel) {
            this._disposeChannel();
        }
    };

    _onError(err) {

        console.log('[ERROR]', err);
    };

    _onReturn(msg) {

        console.log('[RETURN]', msg);
    };

    _onDrain() {

        console.log('[DRAIN]');
    };

};
