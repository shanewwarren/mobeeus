'use strict';

const Schema = require('./schema');

// Declare internals
const internals = {};


exports = module.exports = class Job {

    constructor(options, isServer) {

        const config = Schema.apply('job', options);

        this.isServer = isServer || false;
        this.name =  config.name;
        this.handler = config.handler;
        this.payloadSchema = null;

        if (config.config &&
            config.config.validate &&
            config.config.validate.payload) {
            this.payloadSchema = config.config.validate.payload;
        }
    }

    validate(payload) {

        if (!this.payloadSchema) {
            return payload;
        }

        return Schema.applySchema( this.payloadSchema, payload);
    }
};
