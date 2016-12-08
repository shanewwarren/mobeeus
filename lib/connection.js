'use strict';

// Load modules
const Amqp = require('amqplib/callback_api');

const Items = require('items');
const Uri = require('./uri');
const Schema = require('./schema');

// Declare internals
const internals = {};

exports = module.exports = internals.Connection = function (uriOptions, socketOptions) {

    this._uri = new Uri(uriOptions);

    this.connection = null;
    this._channels = [];
    this._socket = Schema.apply('socket', socketOptions);
};

internals.Connection.prototype.channelCount = function () {

    return this._channels.length;
};


internals.Connection.prototype.open = function (done) {

    if (this._connection) {
        done('Connection already intialized.');
    }

    const url = this._uri.full();
    Amqp.connect(url, this._socket, (err, conn) => {

        if (err) {
            return done(err);
        }

        this._connection = conn;
        done();
    });
};

internals.Connection.prototype.close = function (done) {

    if (!this._connection) {
        return done('No active connection.  Cannot close.');
    }

    //  First close all the active channels.
    const each = (channel, next) => channel.close(next);
    Items.parallel(this._channels, each, (err) => {

        if (err) {
            return done(err);
        }

        this._channels = [];

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


internals.Connection.prototype.createChannel = function (done) {

    if (!this._connection) {
        return new Error('No active connection.  Cannot create a channel.');
    }

    this._connection.createChannel((err, ch) => {

        if (err) {
            return done(err);
        }

        this._channels.push(ch);
        ch.on('close', this.channelClose.bind(this, this._channels.length - 1));

        done(null, ch);
    });
};

internals.Connection.prototype.channelClose = function (index, err) {

    delete this._channels.splice(index, 1);
};

