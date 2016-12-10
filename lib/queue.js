'use strict';

const Co = require('co');
const Items = require('items');
const Schema = require('./schema');

const Consumer = require('./consumer');
const Publisher = require('./publisher');

exports = module.exports = class Queue {

    constructor(options, worker) {

        const config = Schema.apply('queue', options);

        this.worker = worker || false;
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

        let server = 0;
        let nonServer = 0;

        const keys = Object.keys(this.tasks);
        keys.forEach((key) => {

            if (this.tasks[key].isServer) {
                server++;
            }
            else {
                nonServer++;
            }
        });

        if (server === 0 && nonServer === 0) {
            return next();
        }

        if (this.worker) {
            this.consumer = new Consumer({ name: this.name });
            this.publisher = new Publisher({ name: this.name });
        }
        else {
            if (server > 0) {
                this.consumer = new Consumer({ name: this.name });
            }
            if (nonServer > 0) {
                this.publisher = new Publisher({ name: this.name });
            }
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
                // do something...
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
