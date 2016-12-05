'use strict';

// Load modules
const Joi = require('joi');

exports = module.exports = Joi.object({

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
