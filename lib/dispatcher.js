'use strict';

// Load modules

const Promises = require('./promises');

exports = module.exports = function (agenda, worker) {

    return {

        task: function (name, payload, next) {

            if (!next) {
                return Promises.wrap(this, this.task, [name, payload]);
            }

            worker.addTask(name, payload, next);
        },
        every: function (interval, name, payload, next) {

            if (!next) {
                return Promises.wrap(this, this.every, [interval, name, payload]);
            }

            if (typeof payload === 'function' && !next) {
                next = payload;
                payload = {};
            }

            const options = {
                name,
                interval,
                payload,
                type: 'every'
            };

            agenda.runJob(options, next);
        },
        schedule: function (when, name, payload, next) {

            if (!next) {
                return Promises.wrap(this, this.schedule, [when, name, payload]);
            }

            if (typeof payload === 'function' && !next) {
                next = payload;
                payload = {};
            }

            const options = {
                name,
                interval: when,
                payload,
                type: 'schedule'
            };

            agenda.runJob(options, next);
        },
        now: function (name, payload, next) {

            if (!next) {
                return Promises.wrap(this, this.now, [name, payload]);
            }

            if (typeof payload === 'function' && !next) {
                next = payload;
                payload = {};
            }

            const options = {
                name,
                payload,
                type: 'now'
            };

            agenda.runJob(options, next);
        },

        agenda: agenda.agenda

    };

};
