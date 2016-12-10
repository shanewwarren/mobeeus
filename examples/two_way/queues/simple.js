'use strict';

// Load modules

const Joi = require('joi');
const Process = require('process');

exports = module.exports = function (mobeeus) {

    // Define the queue.
    mobeeus.queue({
        name: 'simple-queue'
    });

    // Define a task that uses the queue.
    mobeeus.task({
        queue: 'simple-queue',
        name: 'simple-task',
        handler: (context, payload, done) => {

            // this will run on the worker.
            console.log(`[${Process.pid}] ${payload.greeting} ${context.subject}.`);

            // dispatch a task to the server.
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

