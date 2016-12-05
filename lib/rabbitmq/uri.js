'use strict';

// Load modules
const Joi = require('joi');
const UriSchema = require('./schemas').Uri;
const QueryString = require('querystring');

exports = module.exports = class Uri {


    constructor(uriOptions) {

        const result = Joi.validate(uriOptions, UriSchema);
        if (result.error) {
            throw new Error(result.error);
        }

        this.config = result.value;
    }

    get full() {

        const uriParts = ['amqp://'];
        if (this.config.username && this.config.password) {
            uriParts.push(this.config.username);
            uriParts.push(`:${this.config.password}@`);
        }
        else if (this.config.username) {
            uriParts.push(`${this.config.username}@`);
        }

        uriParts.push(this.config.host);

        if (this.config.port) {
            uriParts.push(`:${this.config.port}`);
        }

        if (this.config.vhost) {
            uriParts.push(`/${QueryString.escape(this.config.vhost)}`);
        }

        if (this.config.frameMax || this.config.channelMax || this.config.heartbeat || this.config.locale) {
            uriParts.push('?');
        }

        if (this.config.frameMax) {
            uriParts.push(`frameMax=${this.config.frameMax}&`);
        }

        if (this.config.channelMax) {
            uriParts.push(`channelMax=${this.config.channelMax}&`);
        }

        if (this.config.heartbeat) {
            uriParts.push(`heartbeat=${this.config.heartbeat}&`);
        }

        if (this.config.locale) {
            uriParts.push(`locale=${this.config.locale}`);
        }

        let uri = uriParts.join('');

        if (uri[uri.length - 1] === '&') {
            uri = uri.slice(0, uri.length - 1);
            return uri;
        }

        return uri;
    }
};
