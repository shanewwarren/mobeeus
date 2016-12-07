'use strict';

exports = module.exports = function (parent) {

    return {
        queue:(options) => {

            parent.addQueue(options);
        },
        job: (options) => {

            parent.addJobSchema(options);
        },
        task: (options) => {

            parent.addSchema(options, 'task');
        },
        serverTask: (options) => {

            parent.addSchema(options, 'serverTask');
        }
    };

};
