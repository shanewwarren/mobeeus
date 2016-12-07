'use strict';

const Register = require('./register');
const Dispatcher = require('./dispatcher');
const Queue = require('./queue');
const JobQueue = require('./jobQueue');
const TaskSchema = require('./taskSchema');
const Agenda = require('./agenda');

const RabbitMQ = require('./rabbitmq');
const Connection = RabbitMQ.Connection;
const UriSchema = RabbitMQ.Schemas.Uri;
const SocketSchema = RabbitMQ.Schemas.Socket;

const Co = require('co');
const Joi = require('joi');

// Declare internals
const internals = {};

internals.pluginSchema = Joi.object().keys({
    register: Joi.alternatives().try(
                    Joi.func().arity(1),
                    Joi.array().items(Joi.func().arity(1))
                ),
    context: Joi.func().optional(),
    uriOptions: UriSchema,
    socketOptions: SocketSchema,
    mongoOptions: {
        host: Joi.string().default('127.0.0.1'),
        port: Joi.number().integer().default(27017)
    }
});

internals.jobQueue = 'jobs';

exports = module.exports = class Mobeeus {

    constructor(isWorker) {

        this._isWorker = isWorker || false;
        this._queues = {};
        this._connection = null;
        this._jobTasks = {};
        this._agenda = null;
        this._dispatcher = new Dispatcher(this);
    }

    get dispatcher() {

        return this._dispatcher;
    }

    initialize(options) {

        return Co(function *() {

            const result = Joi.validate(options, internals.pluginSchema);
            if (result.error) {
                throw new Error(result.error);
            }

            const config = result.value;
            this._agenda = new Agenda(config.mongoOptions);

            // Get the context
            this._context = {};
            if (config.context) {
                this._context = yield config.context();
            }
            this._context.dispatcher = this.dispatcher;

            // Add default queue for 'jobs'.
            this.addQueue({ name: internals.jobQueue });

            // Register all of the tasks/jobs
            const register = new Register(this);
            if (typeof config.register === 'function') {
                config.register(register);
            }
            else {
                config.register.forEach((registerItem) => registerItem(register));
            }

        }.bind(this));
    }

    _validate(value, schema, name) {

        const result = Joi.validate(value, schema);

        if (result.error) {
            throw new Error(`Invalid ${name} options.  ${result.error}`);
        }

        return result.value;
    }

    addJob(interval, name, type, data) {

        if (!this._jobTasks.hasOwnProperty(name)) {
            throw new Error(`Job '${name}' is not defined.`);
        }

        let schema = null;
        if (this._jobTasks[name].config &&
            this._jobTasks[name].config.validate &&
            this._jobTasks[name].config.validate.payload) {
            schema = this._jobTasks[name].config.validate.payload;
        }

        if (schema) {
            const result = Joi.validate(data, schema);
            if (result.error) {
                throw new Error(`Job '${name}' payload validation failed.  ${result.error}`);
            }
        }

        const agenda = this._agenda.agenda;

        // Cancel any existing instances of this job.
        agenda.cancel({ name }, (err, numRemoved) => {

            console.log(err, numRemoved);
            if (type === 'schedule') {
                agenda.schedule(interval, name, data);
            }
            else if (type === 'every') {
                agenda.every(interval, name, data);
            }
            else {
                agenda.now(name, data);
            }
        });
    }

    addJobSchema(options) {

        const agenda = this._agenda.agenda;

        const handler = options.handler.bind(null, this._context);
        agenda.define(options.name, handler);

        if (this._jobTasks.hasOwnProperty(options.name)) {
            throw new Error(`Job '${options.name}' is already defined.`);
        }

        this._jobTasks[options.name] = options;
    }

    addQueue(options) {

        let queue = null;
        if (options.name === internals.jobQueue) {
            queue = new JobQueue(options, this._isWorker, this._context);
        }
        else {
            queue = new Queue(options, this._isWorker, this._context);
        }

        if (this.doesQueueExist(queue.name)) {
            throw new Error(`Queue with name '${queue.name}' has already been defined.`);
        }

        this._queues[queue.name] = queue;
    }

    addSchema(options, type) {

        if (type === 'job') {
            options.queue = internals.jobQueue;
        }

        let taskSchema = null;
        if (type === 'task' || type === 'job') {
            taskSchema = new TaskSchema(options);
        }
        else if (type === 'serverTask') {
            taskSchema = new TaskSchema(options, true);
        }

        if (!this.doesQueueExist(taskSchema.queue)) {
            throw new Error(`Queue with name '${queue.name}' has not been defined.`);
        }

        const queue = this._queues[taskSchema.queue];
        queue.addTaskSchema(taskSchema);
    }

    addTask(name, payload) {

        let found = null;

        const keys = Object.keys(this._queues);
        for (const key of keys) {

            const queue = this._queues[key];
            if (queue.hasTask(name)) {
                found = queue;
                break;
            }
        }

        if (!found) {
            throw new Error(`Task '${name}' has not been registered.`);
        }

        found.addTask(name, payload);
    }

    start() {

        return Co(function *() {

            yield this._agenda.connect();
            yield this._agenda.start();

            this._connection = new Connection();
            yield this._connection.open();

            const keys = Object.keys(this._queues);
            for (const key of keys) {
                yield this._queues[key].start(this._connection);
            }

        }.bind(this));

    }

    stop() {

        return Co(function *() {

            yield this._agenda.disconnect();

            const keys = Object.keys(this._queues);
            for (const key of keys) {
                yield this._queues[key].stop();
            }

            this._queues = {};

            if (this._connection) {
                yield this._connection.close();
                this._connection = null;
            }

        }.bind(this));

    }

    doesQueueExist(queueName) {

        return this._queues.hasOwnProperty(queueName);
    }


};
