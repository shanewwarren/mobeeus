'use strict';

// Load modules
const AgendaLib = require('agenda');
const Schema = require('./schema');
const Job = require('./job');

// Declare internals
const internals = {};


exports = module.exports = class Agenda {

    constructor(options, isWorker) {

        const config = Schema.apply('agenda', options || {});
        const address = `mongodb://${config.mongoHost}:${config.mongoPort}/agenda`;

        // connect to an instance of agenda.
        this._agenda = new AgendaLib();
        this._agenda.database(address);

        this.jobTasks = {};
    }

    get agenda() {

        return this._agenda;
    }

    stop(next) {

        this._agenda.stop(() => {

            this._agenda._mdb.close(false, (err) => {

                this._agenda = null;
                next(err);
            });

        });
    };

    start(next) {

        if (!this._agenda) {
            return next(new Error('Agenda has been stopped.'));
        }

        this._agenda.once('ready', () => {

            this._agenda.on('error', this.onError.bind(this));

            // Specifies the max number jobs that can be locked at any given moment.
            this._agenda.lockLimit(1);

            // Specifies the default number of a specific job that can be locked at any given moment.
            this._agenda.defaultLockLimit(1);

            // Specifies the default lock lifetime in milliseconds.
            // By default it is 10 minutes.
            // This can be overridden by specifying the lockLifetime option to a defined job.
            this._agenda.defaultLockLifetime(1000);

            this._agenda.start();

            return next();
        });

        // Attach a single event handler to signal connection failed
        this._agenda.once('error', (err) => {

            return next(err);
        });
    };

    defineJob(options) {

        if (!this._agenda) {
            return next(new Error('Agenda has been stopped.'));
        }

        if (this._jobExists(options.name)) {
            throw new Error(`Job '${options.name}' is already defined.`);
        }

        const job = new Job(options);
        this.jobTasks[options.name] = job;

        this._agenda.define(options.name, job.handler);
    }

    runJob(options, next) {

        if (!this._agenda) {
            return next(new Error('Agenda has been stopped.'));
        }

        let config = null;
        try {
            config = Schema.apply('runJob', options);
        }
        catch (err) {
            return next(err);
        }

        if (!this._jobExists(options.name)) {
            return next(new Error(`Job '${options.name}' is not defined.`));
        }

        let payload = null;
        try {
            payload = this.jobTasks[config.name].validate(config.payload);
        }
        catch (err) {
            return next(err);
        }

        if (config.type === 'schedule') {
            this._agenda.schedule(config.interval, config.name, payload, next);
        }
        else if (config.type === 'every') {
            this._agenda.every(config.interval, config.name, payload, next);
        }
        else {
            this._agenda.now(config.name, payload, next);
        }
    }

    _jobExists(name) {

        return this.jobTasks.hasOwnProperty(name);
    }

    onError(err) {

        // TODO: log error
        console.log(err);
    };

};

