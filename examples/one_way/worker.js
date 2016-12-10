'use strict';

// Load modules
const Math = require('./queues/math');

exports = module.exports = {

    register: Math,
    state: (done) => {

        return done(null, { subject: 'Worker' });
    }
};
