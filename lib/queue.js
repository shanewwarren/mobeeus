'use strict';

// Load modules

const Items = require('items');
const Schema = require('./schema');
const Consumer = require('./consumer');
const Publisher = require('./publisher');


exports = module.exports = class Queue {

    constructor(options, worker, serverQueue) {

        const config = Schema.apply('queue', options);

        this.worker = worker || false;
        this.serverQueue = serverQueue || false;
        this.name =  config.name;
        this.options = config.options;

        this.tasks = {};

        this.publisher = null;
        this.consumer = null;
    }

    registerTask(task) {

        this.tasks[task.name] = task;
    }

    addTask(name, payload, next) {

        if (!this.publisher) {
            return next(new Error(`Cannot run task ${name}, this task cannot be written to`));
        }

        const taskSchema = this.tasks[name];
        if (!taskSchema) {
            return next(new Error(`Queue '${this.queue}' is not configured to run task '${name}'`));
        }

        try {
            payload = taskSchema.validate(payload);
        }
        catch (err) {
            return next(new Error(`Task '${name}' payload validation failed.  ${err}`));
        }

        this.publisher.addTask({
            task: name,
            message: payload
        }, next);
    }

    start(connection, next) {

        const keys = Object.keys(this.tasks);
        if (keys.length === 0) {
            return next();
        }

        if (this.worker) {
            if (!this.serverQueue) {
                this.consumer = new Consumer({ name: this.name });
            }
            this.publisher = new Publisher({ name: this.name });
        }
        else {
            if (this.serverQueue) {
                this.consumer = new Consumer({ name: this.name });
            }
            this.publisher = new Publisher({ name: this.name });
        }

        const each = (item, done) => {

            if (!item) {
                return done();
            }

            item.connect(connection, done);
        };

        Items.parallel([this.consumer, this.publisher], each, (err) => {

            if (err || !this.consumer) {
                return next(err);
            }

            this.consumer.receiveTasks(this.handleTask.bind(this), next);
        });
    }

    hasTask(name) {

        return this.tasks.hasOwnProperty(name);
    }

    handleTask(item, content, channel, next) {

        const task = this.tasks[content.task];

        task.handler(content.message, (err) => {

            if (err) {
                // Requeue to try again later.
                channel.nack(item, false, true);
                return;
            }

            // Now signal we are done with this task.
            channel.ack(item);
        });
    }

    stop(next) {

        const each = (item, done) => {

            if (item) {
                return item.disconnect(done);
            }

            done();
        };

        Items.parallel([this.publisher, this.consumer], each, (err) => {

            if (err) {
                return next(err);
            }

            this.publisher = null;
            this.consumer = null;
            return next();
        });
    }
};
