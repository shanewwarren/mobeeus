'use strict';

// Load modules
const Package = require('../package.json');
const Mobeeus = require('./mobeeus');
const Co = require('co');

// Declare internals
const internals = {};

exports.register = function (server, options, next) {

    const rootState = internals.state(server.root);
    if (!rootState.setup) {

        rootState.mobeeus = new Mobeeus(true);
        rootState.options = options;

        server.decorate('server', 'dispatcher', rootState.mobeeus.dispatcher);
        server.decorate('request', 'dispatcher', rootState.mobeeus.dispatcher);

        // 'onPreStart' - called before the connection listeners are started.
        server.ext('onPreStart', internals.initialize);

        // 'onPostStop' - called after the connection listeners are stopped.
        server.ext('onPostStop', internals.stop);

        rootState.setup = true;
    };

    next();
};

exports.register.attributes = {
    pkg: Package
};

internals.initialize = function (server, next) {

    const promise = Co(function *() {

        const state = internals.state(server.root);
        const mobeeus = state.mobeeus;
        const options = state.options;


        yield mobeeus.initialize(options);
        yield mobeeus.start();
    });

    return promise.then(next)
                  .catch(next);
};


internals.stop = function (server, next) {

    const mobeeus = internals.state(server.root).mobeeus;
    return mobeeus.stop()
                  .then(next)
                  .catch(next);
};

internals.state = (srv) => {

    const state = srv.realm.plugins.mobeeus = srv.realm.plugins.mobeeus || {};
    return state;
};
