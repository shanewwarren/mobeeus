'use strict';

const Co = require('co');
const Joi = require('joi');
const Queue = require('./queue');

const RabbitMQ = require('./rabbitmq');
const QueueSchema = RabbitMQ.Schemas.Queue;

// Declare internals
const internals = {};

internals.queue = Joi.object().keys({
    name: Joi.string().required(),
    options: Joi.object().keys({
        queue: QueueSchema
    }).optional()
});

exports = module.exports = class JobQueue extends Queue {

    constructor(options, isWorker, context) {

        super(options, isWorker, context);
    }

    addTaskSchema(task) {

        const handler = task.handler.bind(null, this.context);
        this.context.agenda.agenda.define(task.name, handler);
        this.tasks[task.name] = task;
    }

    addTask(name, payload) {

        if (!this.publisher) {
            throw new Error(`Cannot run task ${name}, this task cannot be written to`);
        }

        const taskSchema = this.tasks[name];
        if (!taskSchema) {
            throw new Error(`Queue '${this.queue}' is not configured to run task '${name}'`);
        }

        const errors = taskSchema.valid(payload.data);
        if (errors) {
            throw new Error(`Task '${name}' payload validation failed.  ${errors}`);
        }

        this.publisher.addTask({
            task: name,
            message: payload
        });
    }

    handleTask(item, content, channel) {

        if (content.message.type === 'schedule') {

            this.context.agenda.agenda.schedule(
                content.message.interval,
                content.task,
                content.message.data
            );
        }
        else if (content.message.type === 'every') {

            this.context.agenda.agenda.every(
                content.message.interval,
                content.task,
                content.message.data
            );
        }
        else {

            this.context.agenda.agenda.now(
                content.task,
                content.message.data
            );
        }

        channel.ack(item);
    }

};
