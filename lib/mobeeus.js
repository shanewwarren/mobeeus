'use strict';

const Register = require('./register');
const Dispatcher = require('./dispatcher');
const Schema = require('./schema');
const Worker = require('./worker');
const Agenda = require('./agenda');
const Items = require('items');

// Declare internals
const internals = {};


internals.jobQueue = 'jobs';

exports = module.exports = class Mobeeus {

    constructor(options) {

        this._dispatcher = null;
        this._register = null;
        this._agenda = null;
        this._worker = null;

        this.settings = Schema.apply('plugin', options);
    }

    get dispatcher() {

        return this._dispatcher;
    }

    init(next) {

        this._agenda = new Agenda(
            this.settings.mongoOptions,
            this.settings.worker
        );

        this._worker = new Worker(
            this.settings.uriOptions,
            this.settings.socketOptions,
            this.settings.worker
        );

        this._dispatcher = Dispatcher(this._agenda, this._worker);

        // Get the state that will be provided
        // to each task and job.
        let cb = null;
        if (typeof this.settings.state === 'function') {
            cb = this.settings.state;
        }
        else {
            cb = (done) => done(null, this.settings.state);
        }

        // Get the jobs and tasks to register.
        let items = null;
        if (typeof this.settings.register === 'function') {
            items = [this.settings.register];
        }
        else {
            items = this.settings.register;
        }

        return cb((err, state) => {

            if (err) {
                return next(err);
            }

            // Expose the dispatcher to the state.
            state.dispatcher = this._dispatcher;

            // Register all the items.
            this._register = new Register(this._agenda, this._worker, state);
            try {
                items.forEach((item) => item(this._register));
            }
            catch (err) {
                return next(err);
            }

            return next();
        });
    }


    start(next) {

        const each = (item, done) => item.start(done);
        Items.parallel([this._agenda, this._worker], each, next);
    }

    stop(next) {

        const each = (item, done) => item.stop(done);
        Items.parallel([this._agenda, this._worker], each, next);
    }

};
