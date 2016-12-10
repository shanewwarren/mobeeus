'use strict';

exports = module.exports = function (agenda, worker, state) {

    return {
        queue: (options) => {

            worker.addQueue(options, false);
        },

        serverQueue: (options) => {

            worker.addQueue(options, true);
        },

        task: (options) => {

            if (options.handler) {
                options.handler = options.handler.bind(null, state);
            }

            worker.registerTask(options);
        },

        job: (options) => {

            if (options.handler) {
                options.handler = options.handler.bind(null, state);
            }

            agenda.defineJob(options);
        }
    };


};
