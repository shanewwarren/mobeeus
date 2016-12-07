'use strict';

exports = module.exports = function (parent) {

    return {
        task: (name, payload) => {

            parent.addTask(name, payload);
        },
        every: (interval, name, data) => {

            parent.addJob(interval, name, 'every', data);
        },
        schedule: (when, name, data) => {

            parent.addJob(when, name, 'schedule', data);
        },
        now: (name, data) => {

            parent.addJob(null, name, 'now', data);
        }
    };

};
