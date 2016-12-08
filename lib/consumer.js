'use strict';

// Load modules

const Channel = require('./channel');
const Schema = require('./schema');

// Declare internals

const internals = {};

// Consumer
exports = module.exports = class Consumer extends Channel {

    constructor(options) {

        super(options);

        // Validate the queue options
        this.queue = Schema.apply('queue', options);
    }

    channelCreated(channel, done) {

        // Create the queue if it does not exist.
        channel.assertQueue(this.queue.name, this.queue, (err, ok) => {

            if (err) {
                return done(err);
            }

            // Set prefetch to one.  Basically the worker should
            // only deal with one item at a time.
            channel.prefetch(1, false, done);
        });
    };

    receiveTasks(handler, options, done) {

        if (arguments.length === 2 && typeof options === 'function') {
            done = options;
            options = {};
        }

        if (!this.channel) {
            return done(new Error('Channel is not initialized, cannot receive any tasks.'));
        }

        if (this._handler) {
            return done(new Error('Already registered to receive tasks.  Create a new worker or disconnect and reconnect the existing worker.'));
        }

        const consumer = Schema.apply('consumer', options);

        this._handler = handler;

        this.channel.consume(this.queue.name, this.onTaskConsumed.bind(this), consumer, done);
    };

    onTaskConsumed(task) {

        const payload = JSON.parse(task.content.toString());
        this._handler(task, payload, this.channel);
    };

};
