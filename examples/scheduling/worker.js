'use strict';

// Load modules
const Reports = require('./queues/reports');
const Api = require('./api');

exports = module.exports = {

    register: Reports,
    state: (done) => {

        return done(null, { api: new Api() });
    }
};
