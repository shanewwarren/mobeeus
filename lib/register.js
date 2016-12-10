'use strict';

exports = module.exports = function (agenda, worker, state) {

    return {
        queue: (options) => {

            worker.addQueue(options);
        },

        task: (options) => {

            if (options.handler) {
                options.handler = options.handler.bind(null, state);
            }

            worker.registerTask(options, 'task');
        },

        serverTask: (options) => {

            if (options.handler) {
                options.handler = options.handler.bind(null, state);
            }

            worker.registerTask(options, 'serverTask');
        },

        job: (options) => {

            if (options.handler) {
                options.handler = options.handler.bind(null, state);
            }

            agenda.defineJob(options);
        }
    };


};
