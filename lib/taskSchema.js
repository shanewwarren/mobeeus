'use strict';

const RabbitMQ = require('./rabbitmq');
const PublisherSchema = RabbitMQ.Schemas.Publisher;
const ConsumerSchema = RabbitMQ.Schemas.Consumer;

const Joi = require('joi');

// Declare internals
const internals = {};

internals.task = Joi.object().keys({
    queue: Joi.string().required(),
    name: Joi.string().required(),
    handler: Joi.func().arity(3),
    config: Joi.object().keys({
        validate: Joi.object().keys({
            payload: Joi.object()
        }),
        publish: PublisherSchema.optional(),
        consumer: ConsumerSchema.optional()
    })
});

exports = module.exports = class TaskSchema {

    constructor(options, isServer) {

        const result = Joi.validate(options, internals.task);
        if (result.error) {
            throw new Error(`Invalid task options.  ${result.error}`);
        }

        this.isServer = isServer || false;
        this.name =  result.value.name;
        this.queue = result.value.queue;
        this.handler = result.value.handler;

        this.publisher = null;
        this.consumer = null;
        this.payloadSchema = null;

        if (result.value.config && result.value.config.publish) {
            this.publisher = result.value.config.publish;
        }

        if (result.value.config && result.value.config.publish) {
            this.consumer = result.value.config.consumer;
        }

        if (result.value.config &&
            result.value.config.validate &&
            result.value.config.validate.payload) {
            this.payloadSchema = result.value.config.validate.payload;
        }
    }

    valid(payload) {

        if (!this.payloadSchema) {
            return null;
        }

        const result = Joi.validate(payload, this.payloadSchema);
        return result.error;
    }
};
