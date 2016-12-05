'use strict';

// Load modules
const Joi = require('joi');

exports = module.exports = Joi.object({

    /**
     * A name which the server will use to distinguish message
     * deliveries for the consumer; mustn't be already in use on the
     * channel. It's usually easier to omit this, in which case the
     * server will create a random name and supply it in the reply.
     */
    consumerTag: Joi.string().optional(),

    /**
     * In theory, if true then the broker won't deliver messages to the
     * consumer if they were also published on this connection; RabbitMQ
     * doesn't implement it though, and will ignore it. Defaults to false.
     */
    noLocal: Joi.boolean().optional(),

    /**
     * if true, the broker won't expect an acknowledgement of messages
     * delivered to this consumer; i.e., it will dequeue messages as soon
     * as they've been sent down the wire. Defaults to false (i.e., you will
     * be expected to acknowledge messages).
     */
    noAck: Joi.boolean().optional().valid(false).default(false),

    /**
     * If true, the broker won't let anyone else consume from this queue;
     * if there already is a consumer, there goes your channel (so usually
     * only useful if you've made a 'private' queue by letting the server
     * choose its name).
     */
    exclusive: Joi.boolean().optional(),

    /**
     * Gives a priority to the consumer; higher priority consumers get
     * messages in preference to lower priority consumers. See this
     * RabbitMQ extension's documentation.
     */
    priority: Joi.number().integer(),

    /**
     * Arbitrary arguments. Go to town.
     */
    arguments: Joi.object().optional()
});
