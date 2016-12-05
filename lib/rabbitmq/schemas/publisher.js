'use strict';

// Load modules
const Joi = require('joi');

exports = module.exports = Joi.object({

    /**
     * A MIME type for the message content
     */
    contentType: Joi.string().optional(),

    /**
     * A MIME encoding for the message content
     */
    contentEncoding: Joi.string().optional(),

    /**
     * Application specific headers to be carried along with the message content.
     * The value as sent may be augmented by extension-specific fields if
     * they are given in the parameters, for example, 'CC', since these are
     * encoded as message headers; the supplied value won't be mutated
     */
    headers: Joi.object().optional(),

    /**
     * Usually used to match replies to requests, or similar
     */
    correlationId: Joi.string().optional(),

    /**
     * Often used to name a queue to which the receiving application
     * must send replies, in an RPC scenario (many libraries assume this pattern)
     */
    replyTo: Joi.string().optional(),

    /**
     *  Arbitrary application-specific identifier for the message
     */
    messageId: Joi.string().optional(),

    /**
     * A timestamp for the message
     */
    timestamp: Joi.number().optional(),

    /**
     * An arbitrary application-specific type for the message
     */
    type: Joi.string().optional(),

    /**
     * An arbitrary identifier for the originating application
     */
    appId: Joi.string().optional(),

    /**
     * If truthy, the message will survive broker restarts provided
     * it's in a queue that also survives restarts. Corresponds to,
     * and overrides, the property
     */
    persistent: Joi.boolean().default(true).valid(true).optional(),

    /**
     * A priority for the message; ignored by versions of RabbitMQ
     * older than 3.5.0, or if the queue is not a priority queue
     * (see maxPriority above).
     */
    priority: Joi.number().integer().optional(),

    /**
     * If supplied, the message will be discarded from a queue
     * once it's been there longer than the given number of
     * milliseconds. In the specification this is a string; numbers
     * supplied here will be coerced to strings for transit.
     */
    expiration: Joi.string().optional(),

    /**
     * If supplied, RabbitMQ will compare it to the username
     * supplied when opening the connection, and reject messages
     * for which it does not match.
     */
    userId: Joi.string().optional(),

    /**
     * An array of routing keys as strings; messages will be routed
     * to these routing keys in addition to that given as the
     * routingKey parameter. A string will be implicitly treated as
     * an array containing just that string. This will override any
     * value given for CC in the headers parameter. NB The property
     * names CC and BCC are case-sensitive.
     */
    cc: Joi.array().items(Joi.string()).optional()
});
