'use strict';

// Load modules

const QueryString = require('querystring');
const Schema = require('./schema');

// Declare internals

const internals = {};

exports = module.exports =  class Uri {

    constructor(uriOptions) {

        this._uri = Schema.apply('uri', uriOptions);
    }

    get full() {

        const uriParts = ['amqp://'];
        if (this._uri.username && this._uri.password) {
            uriParts.push(this._uri.username);
            uriParts.push(`:${this._uri.password}@`);
        }
        else if (this._uri.username) {
            uriParts.push(`${this._uri.username}@`);
        }

        uriParts.push(this._uri.host);

        if (this._uri.port) {
            uriParts.push(`:${this._uri.port}`);
        }

        if (this._uri.vhost) {
            uriParts.push(`/${QueryString.escape(this._uri.vhost)}`);
        }

        if (this._uri.frameMax || this._uri.channelMax || this._uri.heartbeat || this._uri.locale) {
            uriParts.push('?');
        }

        if (this._uri.frameMax) {
            uriParts.push(`frameMax=${this._uri.frameMax}&`);
        }

        if (this._uri.channelMax) {
            uriParts.push(`channelMax=${this._uri.channelMax}&`);
        }

        if (this._uri.heartbeat) {
            uriParts.push(`heartbeat=${this._uri.heartbeat}&`);
        }

        if (this._uri.locale) {
            uriParts.push(`locale=${this._uri.locale}`);
        }

        let uri = uriParts.join('');

        if (uri[uri.length - 1] === '&') {
            uri = uri.slice(0, uri.length - 1);
            return uri;
        }

        return uri;
    };

};
