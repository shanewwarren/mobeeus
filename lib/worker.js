'use strict';

// Load modules

const Items = require('items');
const Queue = require('./queue');
const Task = require('./task');
const Connection = require('./connection');

exports = module.exports = class Worker {

    constructor(uriOptions, socketOptions, worker) {

        this._uriOptions = uriOptions;
        this._socketOptions = socketOptions;
        this._connection = null;
        this._queues = [];
        this._worker = worker;
    }

    start(next) {

        this._connection = new Connection(this._uriOptions, this._socketOptions);
        this._connection.open((err) => {

            if (err) {
                return next(err);
            }

            const each = (item, done) => item.start(this._connection, done);
            Items.parallel(this._queues, each, next);
        });
    }

    stop(next) {

        const each = (item, done) => item.stop(done);
        Items.parallel(this._queues, each, (err) => {

            if (err) {
                return next(err);
            }

            this._connection.close(next);
        });
    }

    addQueue(options, serverQueue) {

        const queue = new Queue(options, this._worker, serverQueue);
        if (this.doesQueueExist(queue.name)) {
            throw new Error(`Queue with name '${queue.name}' has already been defined.`);
        }

        this._queues.push(queue);
    }

    registerTask(options) {

        const task = new Task(options);

        let queue = null;
        if (!(queue = this.getQueue(task.queue))) {
            throw new Error(`Queue with name '${task.name}' has not been defined.`);
        }

        queue.registerTask(task);
    }

    addTask(name, payload, next) {

        let found = null;

        for (const queue of this._queues) {
            if (queue.hasTask(name)) {
                found = queue;
                break;
            }
        }

        if (!found) {
            return next(new Error(`Task '${name}' has not been registered.`));
        }

        found.addTask(name, payload, next);
    }

    doesQueueExist(name) {

        return (this._queues.indexOf((queue) => queue.name === name) >= 0);
    }

    getQueue(name) {

        return this._queues.find((queue) => queue.name === name);
    }
};
