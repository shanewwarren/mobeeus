'use strict';

// Load modules

const Joi = require('joi');
const Process = require('process');

exports = module.exports = function (mobeeus) {

    mobeeus.queue({
        name: 'simple-queue'
    });

    mobeeus.task({
        queue: 'simple-queue',
        name: 'simple-task',
        handler: (context, payload, done) => {

            // this will run on the worker.
            console.log(`[${Process.pid}] ${payload.greeting} ${context.subject}.`);

            // dispatch the task to the server.
            context.dispatcher.task('server-task', payload, done);

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

