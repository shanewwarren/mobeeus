'use strict';

// Load modules

const Joi = require('joi');
const Process = require('process');

exports = module.exports = function (mobeeus) {

    mobeeus.serverQueue({
        name: 'server-queue'
    });

    mobeeus.task({
        queue: 'server-queue',
        name: 'server-task',
        handler: (context, payload, done) => {

            // this will run on the server.
            console.log(`[${Process.pid}] ${payload.greeting} ${context.subject}.`);
            done();
        },
        config: {
            validate: {
                payload: {
                    greeting: Joi.string().required()
                }
            }
        }
    });
};

