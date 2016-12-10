'use strict';

exports = module.exports = function (agenda, worker) {

    return {

        task: (name, payload, next) => {

            worker.addTask(name, payload, next);
        },
        every: (interval, name, payload, next) => {

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
        schedule: (when, name, payload, next) => {

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
        now: (name, payload, next) => {

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
