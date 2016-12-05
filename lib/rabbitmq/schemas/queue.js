'use strict';

// Load modules
const Joi = require('joi');

exports = module.exports =  Joi.object({

    /**
     * Name of the queue
     */
    name: Joi.string().required(),

    /**
     * If true, the queue will survive broker restarts, modulo
     * the effects of exclusive and autoDelete; this defaults
     * to true if not supplied, unlike the others
     */
    durable: Joi.boolean().default(true).valid(true).optional(),

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
     * Additional arguments, usually parameters for some
     * kind of broker-specific extension e.g., high availability, TTL.
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
