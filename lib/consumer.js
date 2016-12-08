'use strict';

// Load modules

const Connection = require('./connection');
const Schema = require('./schema');

// Declare internals

const internals = {};

// Consumer
exports = module.exports = internals.Consumer = function () {

    this._close = this._onClose.bind(this);
    this._error = this._onError.bind(this);
    this._return = this._onReturn.bind(this);
    this._drain = this._onDrain.bind(this);
};

internals.Consumer.prototype.connect = function (connection, options, done) {

    // Check that a channel hasn't already been created.
    if (this._channel) {
        return done('Channel already connected, disconnect the channel first.');
    }

    // Verify that the connection has a value.
    if (!connection) {
        return done('Connection is not initialized');
    }

    // Verify that it actually is a Connection instance
    if (!(connection instanceof Connection)) {
        return done('Connection is not a instance of Connection');
    }

    // Validate the queue options
    this._queue = Schema.apply('queue', options);

    // Create the channel
    this._createChannel(connection, (err, ch) => {

        if (err) {
            return done(err);
        }

        this._channel = ch;

        // Create the queue if it does not exist.
        this._channel.assertQueue(this._queue.name, this._queue, (err, ok) => {

            if (err) {
                return done(err);
            }

            // Set prefetch to one.  Basically the worker should
            // only deal with one item at a time.
            this._channel.prefetch(1, false, done);
        });
    });
};

internals.Consumer.prototype.receiveTasks = function (taskHandler, options, done) {

    if (!this._channel) {
        return done('Channel is not initialized, cannot receive any tasks.');
    }

    if (this._taskHandler) {
        return done('Already registered to receive tasks.  Create a new worker or disconnect and reconnect the existing worker.');
    }

    const consumer = Schema.apply('consumer', options);

    this._taskHandler = taskHandler;

    this._channel.consume(this._queue.name, onTaskConsumed.bind(this), consumer, done);
};

internals.Consumer.prototype.onTaskConsumed = function (task) {

    const payload = JSON.parse(task.content.toString());
    this._taskHandler(task, payload, this._channel);
};

internals.Consumer.prototype.disconnect = function (done) {

    if (!this._channel) {
        throw new Error('Channel is not initialized, cannot disconnect.');
    }

    this._channel.close((err) => {

        if (err) {
            return done(err);
        }

        setImmediate(() => {

            this._disposeChannel();
            done();
        });
    });

};

internals.Consumer.prototype._createChannel = function (connection, done) {

    // Create the channel
    connection.createChannel((err, ch) => {

        if (err) {
            return done(err);
        }

         // Subscribe to all of the channel events.
        ch.on('close', this._close);
        ch.on('error', this._error);
        ch.on('return', this._return);
        ch.on('drain', this._drain);

        done(null, ch);
    });
};

internals.Consumer.prototype._disposeChannel = function () {

    if (this._channel) {
        this._channel.removeListener('close', this._close);
        this._channel.removeListener('error', this._error);
        this._channel.removeListener('return', this._return);
        this._channel.removeListener('drain', this._drain);
    }

    this._channel = null;
};

internals.Consumer.prototype._disposeChannel = function () {

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

internals.Consumer.prototype._onClose = function () {

    this._disposeChannel();
};

internals.Consumer.prototype._onError = function (err) {

    console.log('[ERROR]', err);

    this._disposeChannel();
};

internals.Consumer.prototype._onReturn = function (msg) {

    console.log('[RETURN]', msg);
};

internals.Consumer.prototype._onDrain = function () {

    console.log('[DRAIN]');
};


