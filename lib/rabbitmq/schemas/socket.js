'use strict';

// Load modules
const Joi = require('joi');

exports = module.exports = Joi.object({

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
