'use strict';

// Load modules

const Channel = require('./channel');
const Schema = require('./schema');

// Declare internals

const internals = {};

// Publisher
exports = module.exports = class Publisher extends Channel {

    constructor(options) {

        super(options);

        // Validate the queue options
        this.queue = Schema.apply('queue', options);
    }

    channelCreated(channel, done) {

        // Create the queue if it does not exist.
        channel.assertQueue(this.queue.name, this.queue, done);
    };

    addTask(task, options, done) {

        if (arguments.length === 2 && typeof options === 'function') {
            done = options;
            options = {};
        }

        if (!this.channel) {
            return done(new Error('Channel is not initialized, cannot add task to queue.'));
        }

        const publisher = Schema.apply('publisher', options);

        this.channel.sendToQueue(this.queue.name, new Buffer(JSON.stringify(task)), publisher);

        return done();
    };

};
