'use strict';

// Load modules
const Joi = require('joi');
const RabbitMQ = require('./rabbitmq');

const UriSchema = RabbitMQ.Schemas.Uri;
const SocketSchema = RabbitMQ.Schemas.Socket;

internals.basePlugin = Joi.object().keys({

    register: Joi.alternatives().try(
                    Joi.func().arity(1),
                    Joi.array().items(Joi.func().arity(1))
                ),
    uriOptions: UriSchema,
    socketOptions: SocketSchema

});

exports = module.exports = {

    plugin: internals.basePlugin,
    client: internals.basePlugin

};
