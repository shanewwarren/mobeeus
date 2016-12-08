'use strict';

// Load modules

const Util = require('util');
const Connection = require('./connection');
const Schema = require('./schema');

// Declare internals

const internals = {};

// Channel
exports = module.exports = class Channel {

    constructor() {

        this._close = this._onClose.bind(this);
        this._error = this._onError.bind(this);
        this._return = this._onReturn.bind(this);
        this._drain = this._onDrain.bind(this);
    }


    channelCreated(channel, done) {

    };

    get channel() {

        return this._channel;
    }

    connect(connection, done) {

        // Check that a channel hasn't already been created.
        if (this._channel) {
            return done(new Error('Channel already connected, disconnect the channel first.'));
        }

        // Verify that the connection has a value.
        if (!connection) {
            return done(new Error('Connection is not initialized'));
        }

        // Verify that it actually is a Connection instance
        if (!(connection instanceof Connection)) {
            return done(new Error('Connection is not a instance of Connection'));
        }

        // Create the channel
        this._createChannel(connection, (err, ch) => {

            if (err) {
                return done(err);
            }

            this._channel = ch;
            this.channelCreated(ch, done);
        });
    };

    disconnect(done) {

        if (!this._channel) {
            return done(new Error('Channel is not initialized, cannot disconnect.'));
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

    _createChannel(connection, done) {

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

    _disposeChannel() {

        if (this._channel) {
            this._channel.removeListener('close', this._close);
            this._channel.removeListener('error', this._error);
            this._channel.removeListener('return', this._return);
            this._channel.removeListener('drain', this._drain);
        }

        this._channel = null;
    };

    _disposeChannel() {

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

        this._disposeChannel();
    };

    _onError(err) {

        console.log('[ERROR]', err);

        this._disposeChannel();
    };

    _onReturn(msg) {

        console.log('[RETURN]', msg);
    };

    _onDrain() {

        console.log('[DRAIN]');
    };

};
