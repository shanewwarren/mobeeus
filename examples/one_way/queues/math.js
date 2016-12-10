'use strict';

// Load modules

const Joi = require('joi');
const Process = require('process');

exports = module.exports = function (mobeeus) {

    mobeeus.queue({
        name: 'math-queue'
    });


    mobeeus.task({
        queue: 'math-queue',
        name: 'math-task',
        handler: (context, payload, done) => {

            let total = 0;
            switch (payload.operator) {
                case '+':
                    total = payload.left + payload.right;
                    break;
                case '-':
                    total = payload.left - payload.right;
                    break;
                case '*':
                    total = payload.left * payload.right;
                    break;
                case '/':
                    total = payload.left / payload.right;
                    break;
            }

            // this will run on the worker.
            console.log(`[${Process.pid}] ${payload.left} ${payload.operator} ${payload.right} = ${total}.`);
            done();
        },
        config: {
            validate: {
                payload: {
                    left: Joi.number().required(),
                    right: Joi.number().required(),
                    operator: Joi.string().valid(['+', '-', '/', '*']).required()
                }
            }
        }
    });
};

