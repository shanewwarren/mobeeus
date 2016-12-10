'use strict';

// Load modules

const Schema = require('./schema');

exports = module.exports = class Task {

    constructor(options, isServer) {

        this.publisher = null;
        this.consumer = null;
        this.payloadSchema = null;
        this.isServer = isServer || false;

        const result = Schema.apply('task', options);
        this.name =  result.name;
        this.queue = result.queue;
        this.handler = result.handler;

        if (result.config && result.config.publish) {
            this.publisher = result.config.publish;
        }

        if (result.config && result.config.publish) {
            this.consumer = result.config.consumer;
        }

        if (result.config &&
            result.config.validate &&
            result.config.validate.payload) {
            this.payloadSchema = result.config.validate.payload;
        }
    }

    validate(payload) {

        if (!this.payloadSchema) {
            return payload;
        }

        return Schema.applySchema(this.payloadSchema, payload || {});
    }
};
