'use strict';

// Load modules
const Simple = require('./queues/simple');
const Server = require('./queues/server');

exports = module.exports = {

    register: [Simple, Server],
    state: (done) => {

        return done(null, { subject: 'Worker' });
    }
};
