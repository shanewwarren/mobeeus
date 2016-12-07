'use strict';

// Load modules
const AgendaLib = require('agenda');
const Co = require('co');

// Declare internals
const internals = {};

internals.defaults = {
    mongoHost: '127.0.0.1',
    mongoPort: 27017
};

exports = module.exports = class Agenda {

    constructor(options) {

        const config = Object.assign({}, internals.defaults, options || {});
        const address = `mongodb://${config.mongoHost}:${config.mongoPort}/agenda`;

        // connect to an instance of agenda.
        this._agenda = new AgendaLib();
        this._agenda.database(address);
    }

    get agenda() {

        return this._agenda;
    }

    connect() {

        return new Promise((resolve, reject) => {

            this._agenda.once('ready', () => {

                this._agenda.on('error', this.onError.bind(this));
                return resolve();
            });

            // Attach a single event handler to signal connection failed
            this._agenda.once('error', (err) => {

                return reject(err);
            });

        });
    };

    disconnect() {

        return new Promise((resolve, reject) => {

            this._agenda.stop(() => {

                this._agenda._mdb.close(false, (err) => {

                    this._agenda = null;
                    return resolve();
                });

            });
        });
    };

    start() {

        return Co(function *() {

            if (this._agenda) {

                // Specifies the max number jobs that can be locked at any given moment.
                this._agenda.lockLimit(1);

                // Specifies the default number of a specific job that can be locked at any given moment.
                this._agenda.defaultLockLimit(1);

                // Specifies the default lock lifetime in milliseconds.
                // By default it is 10 minutes.
                // This can be overridden by specifying the lockLifetime option to a defined job.
                this._agenda.defaultLockLifetime(1000);

                this._agenda.start();

            }

        }.bind(this));
    };

    onError(err) {

        // TODO: log error
        console.log(err);
    };

};

