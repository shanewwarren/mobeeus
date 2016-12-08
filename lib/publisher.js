'use strict';

// Load modules

const Connection = require('./connection');
const Schema = require('./schema');

// Declare internals

const internals = {};

// Publisher
exports = module.exports = internals.Publisher = function () {

    this._close = this._onClose.bind(this);
    this._error = this._onError.bind(this);
    this._return = this._onReturn.bind(this);
    this._drain = this._onDrain.bind(this);
};

internals.Publisher.prototype.connect = function (connection, options, done) {

    // Check that a channel hasn't already been created.
    if (this._channel) {
        return done('Channel is already connected, disconnect the channel first.');
    }

    // Verify that the connection has a value.
    if (!connection) {
        return done('Connection is not initialized');
    }

    // Verify that it actually is a Connection instance
    if (!(connection instanceof Connection)) {
        return done('Connection is not a instance of Connection.');
    }

    // Validate the queue options
    this._queue = Schema.apply('queue', options);

    // Create the channel
    this._createChannel(connection, (err, ch) => {

        if (err) {
            return done(err);
        }

        this._channel =  ch;

        // Create the queue if it does not exist.
        this._channel.assertQueue(this._queue.name, this._queue, done);
    });

};

internals.Publisher.prototype.addTask = function (task, options, done) {



    if (!this._channel) {
        return done('Channel is not initialized, cannot add task to queue.');
    }

    const publisher = Schema.apply('publisher', options);

    this._channel.sendToQueue(this._queue.name, new Buffer(JSON.stringify(task)), publisher, done);
};

internals.Publisher.prototype.disconnect = function (done) {

    if (!this._channel) {
        return done('Channel is not initialized, cannot disconnect.');
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

internals.Publisher.prototype._createChannel = function (connection, done) {

    // Create the channel
    return connection.createChannel((err, ch) => {

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

internals.Publisher.prototype._disposeChannel = function () {

    // Channel has been closed
    if (this._channel) {

        // Unsubscribe from all of the channel events.
        this._channel.removeListener('close', this._close);
        this._channel.removeListener('error', this._error);
        this._channel.removeListener('return', this._return);
        this._channel.removeListener('drain', this._drain);
    }

    this._channel = null;

};

internals.Publisher.prototype._onClose = function () {

    this._disposeChannel();
};

internals.Publisher.prototype._onError = function (err) {

    console.log('[ERROR]', err);

    this._disposeChannel();
};

internals.Publisher.prototype._onReturn = function (msg) {

    console.log('[RETURN]', msg);
};

internals.Publisher.prototype._onDrain = function () {

    console.log('[DRAIN]');
};


