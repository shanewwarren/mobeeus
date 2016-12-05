'use strict';

// Load modules
const Connection = require('./connection');
const Co = require('co');
const Joi = require('joi');

// Schema Definitions
const QueueSchema = require('./schemas').Queue;
const ConsumerSchema = require('./schemas').Consumer;

// Declare internals
const internals = {};

// Consumer
exports = module.exports = class Consumer {

    constructor() {

        this._close = this._onClose.bind(this);
        this._error = this._onError.bind(this);
        this._return = this._onReturn.bind(this);
        this._drain = this._onDrain.bind(this);
    }

    connect(connection, options) {

        return Co(function *() {

            // Check that a channel hasn't already been created.
            if (this._channel) {
                return Promise.reject(new Error('Channel already connected, disconnect the channel first.'));
            }

            // Verify that the connection has a value.
            if (!connection) {
                return Promise.reject(new Error('Connection is not initialized'));
            }

            // Verify that it actually is a Connection instance
            if (!(connection instanceof Connection)) {
                return Promise.reject(new Error('Connection is not a instance of Connection'));
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

            // Set prefetch to one.  Basically the worker should
            // only deal with one item at a time.
            yield this._channel.prefetch(1);

        }.bind(this));

    };

    receiveTasks(taskHandler, options) {

        if (!this._channel) {
            throw new Error('Channel is not initialized, cannot receive any tasks.');
        }

        if (this._taskHandler) {
            throw new Error('Already registered to receive tasks.  Create a new worker or disconnect and reconnect the existing worker.');
        }

        this._taskHandler = taskHandler;


        const result = Joi.validate(options, ConsumerSchema);
        if (result.error) {
            throw new Error(result.error);
        }

        const consumeOptions = result.value;

        // Wrap the taskHandler so we can automatically parse the JSON string.
        const onTaskConsumed = (task) => {

            const obj = JSON.parse(task.content.toString());
            taskHandler(task, obj, this._channel);
        };

        this._channel.consume(this._queueOptions.name,
            onTaskConsumed,
            consumeOptions);

    };

    disconnect() {

        return Co(function *() {

            if (!this._channel) {
                throw new Error('Channel is not initialized, cannot disconnect.');
            }

            yield this._channel.close();

            this._cleanUp();

        }.bind(this));
    };


    _createChannel(connection) {

        // Create the channel
        return connection.createChannel().then((channel) => {

            // Subscribe to all of the channel events.
            channel.on('close', this._close);
            channel.on('error', this._error);
            channel.on('return', this._return);
            channel.on('drain', this._drain);

            return channel;
        });

    };

    _disposeChannel() {


        if (this._channel) {
            this._channel.removeListener('close', this._close);
            this._channel.removeListener('error', this._error);
            this._channel.removeListener('return', this._return);
            this._channel.removeListener('drain', this._drain);
        }

        this._channel = null;

    };

    _cleanUp() {

        // Channel has been closed
        if (this._channel) {

            // Unsubscribe from all of the channel events.
            this._channel.removeListener('close', this._close);
            this._channel.removeListener('error', this._error);
            this._channel.removeListener('return', this._return);
            this._channel.removeListener('drain', this._drain);
            this._channel = null;
        }

        this._taskHandler = null;
    };

    _onClose() {

        // if (this._closeHandler) {
        //     this._closeHandler();
        // }

        this._cleanUp();
    };

    _onError(err) {

        console.log('[ERROR]', err);

        // if (this._closeHandler) {
        //     this._closeHandler(err);
        // }

        this._cleanUp();
    };

    _onReturn(msg) {

        console.log('[RETURN]', msg);
    };

    _onDrain() {

        console.log('[DRAIN]');
    };

};
