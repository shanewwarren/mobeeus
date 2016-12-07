'use strict';

const Co = require('co');
const Joi = require('joi');

const RabbitMQ = require('./rabbitmq');
const QueueSchema = RabbitMQ.Schemas.Queue;
const Consumer = RabbitMQ.Consumer;
const Publisher = RabbitMQ.Publisher;

// Declare internals
const internals = {};

internals.queue = Joi.object().keys({
    name: Joi.string().required(),
    options: Joi.object().keys({
        queue: QueueSchema
    }).optional()
});

exports = module.exports = class Queue {

    constructor(options, isWorker, context) {

        const result = Joi.validate(options, internals.queue);
        if (result.error) {
            throw new Error(`Invalid queue options.  ${result.error}`);
        }

        this.isWorker = isWorker || false;
        this.context = context;

        this.name =  result.value.name;
        this.options = result.value.options;
        this.tasks = {};

        this.publisher = null;
        this.consumer = null;
    }

    get serverTasks() {

        const serverTasks = [];

        const keys = Object.keys(this.tasks);
        for (const key of keys) {
            if (this.tasks[key].isServer) {
                serverTasks.push(this.tasks[key]);
            }
        }

        return serverTasks;
    }

    get nonServerTasks() {

        const nonServerTasks = [];

        const keys = Object.keys(this.tasks);
        for (const key of keys) {
            if (!this.tasks[key].isServer) {
                nonServerTasks.push(this.tasks[key]);
            }
        }

        return nonServerTasks;
    }

    addTaskSchema(task) {

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

        const errors = taskSchema.valid(payload);
        if (errors) {
            throw new Error(`Task '${name}' payload validation failed.  ${errors}`);
        }

        this.publisher.addTask({
            task: name,
            message: payload
        });
    }

    start(connection) {

        return Co(function *() {

            const server = this.serverTasks;
            const nonServer = this.nonServerTasks;

            if (server.length === 0 && nonServer.length === 0) {
                return;
            }

            if (nonServer.length > 0) {
                this.consumer = new Consumer();
                this.publisher = new Publisher();
            }
            else if (server.length > 0 && this.isWorker) {
                this.publisher = new Publisher();
            }
            else {
                this.consumer = new Consumer();
            }

            if (this.consumer) {

                yield this.consumer.connect(connection, { name: this.name });
                this.consumer.receiveTasks(this.handleTask.bind(this)); //consumerOptions ||
            }

            if (this.publisher) {

                yield this.publisher.connect(connection, { name: this.name });
            }

        }.bind(this));
    }

    hasTask(name) {

        return this.tasks.hasOwnProperty(name);
    }

    handleTask(item, content, channel) {

        return Co(function *() {

            const task = this.tasks[content.task];

            try {
                yield task.handler(this.context, content.message);

                // Now signal we are done with this task.
                channel.ack(item);
            }
            catch (err) {
                throw new Error(`Task ${task.name} on queue ${task.queue} failed: ${err}`);
            }

        }.bind(this));
    }

    stop() {

        return Co(function *() {

            if (this.publisher) {
                yield this.publisher.disconnect();
                this.publisher = null;
            }

            if (this.consumer) {
                yield this.consumer.disconnect();
                this.consumer = null;
            }

        }.bind(this));
    }
};
