'use strict';

// Load modules

const Joi = require('joi');
const Hoek = require('hoek');


// Declare internals

const internals = {};


exports.apply = function (type, options, message) {

    const result = Joi.validate(options || {}, internals[type]);
    Hoek.assert(!result.error, 'Invalid', type, 'options', message ? '(' + message + ')' : '', result.error && result.error.annotate());
    return result.value;
};

exports.applySchema = function (schema, options, message) {

    const result = Joi.validate(options || {}, schema);
    Hoek.assert(!result.error, 'Invalid options', message ? '(' + message + ')' : '', result.error && result.error.annotate());
    return result.value;
};

internals.consumer = Joi.object({
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

internals.publisher = Joi.object({

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

internals.queue = Joi.object({

    /**
     * Name of the queue
     */
    name: Joi.string().required(),

    /**
     * If true, the queue will survive broker restarts, modulo
     * the effects of exclusive and autoDelete; this defaults
     * to true if not supplied, unlike the others
     */
    durable: Joi.boolean().default(true).optional(),

    /**
     *  If true, scopes the queue to the connection (defaults to false)
     */
    exclusive: Joi.boolean().optional(),

    /**
     *  If true, the queue will be deleted when the number of
     *  consumers drops to zero (defaults to false).
     */
    autoDelete: Joi.boolean().optional(),

    /**
      Additional arguments, usually parameters for some
      kind of broker-specific extension e.g., high availability, TTL.
     */
    arguments: Joi.object({

        /**
         * Expires messages arriving in the queue after n milliseconds
         */
        messageTtl: Joi.number().integer().min(0).max((Math.pow(2,32) - 1)).optional(),

        /**
         * The queue will be destroyed after n milliseconds of disuse,
         * where use means having consumers, being declared (asserted or
         * checked, in this API), or being polled with a #get.
         */
        expires: Joi.number().integer().min(0).max((Math.pow(2,32) - 1)).optional(),

        /**
         * An exchange to which messages discarded from the queue will be resent.
         * Use deadLetterRoutingKey to set a routing key for discarded messages;
         * otherwise, the message's routing key (and CC and BCC, if present)
         * will be preserved. A message is discarded when it expires or is rejected
         * or nacked, or the queue limit is reached.
         */
        deadLetterExchange: Joi.string().optional(),

        /**
         * Sets a maximum number of messages the queue will hold.
         * Old messages will be discarded (dead-lettered if that's set) to make
         * way for new messages.
         */
        maxLength: Joi.number().integer().optional(),

        /**
         * Makes the queue a priority queue.
         */
        maxPriority: Joi.number().integer().optional()

    }).optional()

});

internals.socket = Joi.object({

    /**
     *  Client certificate as a buffer
     */
    cert: Joi.binary().optional(),

    /**
     *  Client key as a buffer
     */
    key: Joi.binary().optional(),

    /**
     * Passphrase for key
     */
    passphrase: Joi.string().optional(),

    /**
     * Array of trusted CA certs as buffers
     */
    ca: Joi.array().items(Joi.binary()),

    /**
     * If the value is true, this sets TCP_NODELAY on the underlying socket.
     */
    noDelay: Joi.boolean().optional()

});

internals.uri = Joi.object({

    /**
     * The host to which the underlying TCP connection is made.
     */
    host: Joi.string().default('localhost').optional(),

    /**
     * The port number to which the underlying TCP connection is made.
     */
    port: Joi.number().integer().default(5672).optional(),


    username: Joi.string().optional(),

    password: Joi.string().optional(),

    /**
     * Virtual-host field
     */
    vhost: Joi.string().optional(),

    /**
     * The size in bytes of the maximum frame allowed over the connection.
     * 0 means no limit (but since frames have a size field which is an unsigned
     * 32 bit integer, it's perforce 2^32 - 1); I default it to 0x1000,
     * i.e. 4kb, which is the allowed minimum, will fit many purposes, and
     * not chug through Node.JS's buffer pooling.
     */
    frameMax: Joi.alternatives().try(
                Joi.string().hex(),
                Joi.number().integer().valid(0)
                ).optional(),
    /**
     * The maximum number of channels allowed.
     * Default is 0, meaning 2^16 - 1.
     */
    channelMax: Joi.number().integer().default(0, 'Meaning 2^16 - 1 of channels possible.').optional(),

    /**
     * The period of the connection heartbeat, in seconds.
     * Defaults to 0, meaning no heartbeat. OMG no heartbeat!
     */
    heartbeat: Joi.number().integer().default(0, 'No heartbeat.').optional(),

    /**
     * The desired locale for error messages, I suppose.
     * RabbitMQ only ever uses en_US; which, happily, is the default.
     */
    locale: Joi.string().optional()
});


internals.task = Joi.object().keys({
    queue: Joi.string().required(),
    name: Joi.string().required(),
    handler: Joi.func().required(),
    config: Joi.object().keys({
        validate: Joi.object().keys({
            payload: Joi.object()
        }),
        publish: internals.publisher.optional(),
        consumer: internals.consumer.optional()
    }).optional()
});


internals.job = Joi.object().keys({
    name: Joi.string().required(),
    handler: Joi.func().required(),
    config: Joi.object().keys({
        validate: Joi.object().keys({
            payload: Joi.object()
        }),
        publish: internals.publisher.optional(),
        consumer: internals.consumer.optional()
    })
});


internals.runJob = Joi.object().keys({
    name: Joi.string().required(),
    interval: Joi.alternatives().when('type', { is: 'every', then: Joi.string().required() })
                                .when('type', { is: 'schedule', then: Joi.string().required() })
                                .when('type', { is: 'now', then: Joi.string().optional() }),
    type: Joi.string().valid(['every', 'now', 'schedule']).required(),
    payload: Joi.object()
});


internals.uri = Joi.object({

    /**
     * The host to which the underlying TCP connection is made.
     */
    host: Joi.string().default('localhost').optional(),

    /**
     * The port number to which the underlying TCP connection is made.
     */
    port: Joi.number().integer(),

    username: Joi.string().optional(),

    password: Joi.string().optional(),

    /**
     * Virtual-host field
     */
    vhost: Joi.string().optional(),

    /**
     * The size in bytes of the maximum frame allowed over the connection.
     * 0 means no limit (but since frames have a size field which is an unsigned
     * 32 bit integer, it's perforce 2^32 - 1); I default it to 0x1000,
     * i.e. 4kb, which is the allowed minimum, will fit many purposes, and
     * not chug through Node.JS's buffer pooling.
     */
    frameMax: Joi.alternatives().try(
                Joi.string().hex(),
                Joi.number().integer().valid(0)
                ).optional(),
    /**
     * The maximum number of channels allowed.
     * Default is 0, meaning 2^16 - 1.
     */
    channelMax: Joi.number().integer().default(0, 'Meaning 2^16 - 1 of channels possible.').optional(),

    /**
     * The period of the connection heartbeat, in seconds.
     * Defaults to 0, meaning no heartbeat. OMG no heartbeat!
     */
    heartbeat: Joi.number().integer().default(0, 'No heartbeat.').optional(),

    /**
     * The desired locale for error messages, I suppose.
     * RabbitMQ only ever uses en_US; which, happily, is the default.
     */
    locale: Joi.string().optional()
});

internals.socket = Joi.object({

    /**
     *  Client certificate as a buffer
     */
    cert: Joi.binary().optional(),

    /**
     *  Client key as a buffer
     */
    key: Joi.binary().optional(),

    /**
     * Passphrase for key
     */
    passphrase: Joi.string().optional(),

    /**
     * Array of trusted CA certs as buffers
     */
    ca: Joi.array().items(Joi.binary()),

    /**
     * If the value is true, this sets TCP_NODELAY on the underlying socket.
     */
    noDelay: Joi.boolean().optional()

});

internals.plugin = Joi.object().keys({
    register: Joi.alternatives().try(
                    Joi.func().arity(1),
                    Joi.array().items(Joi.func().arity(1))
                ).required(),
    state: Joi.alternatives().try(
                    Joi.func().arity(1),
                    Joi.object()
                ).default({}),
    rabbitmq: Joi.object().keys({
        uri: internals.uri.optional(),
        socket: internals.socket.optional()
    }),
    mongodb: Joi.object().keys({
        host: Joi.string().default('127.0.0.1'),
        port: Joi.number().integer().default(27017)
    }),
    worker: Joi.bool().default(false)
});

internals.agenda = {
    host: Joi.string().default('127.0.0.1'),
    port: Joi.number().default(27017)
};
