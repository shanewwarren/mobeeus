'use strict';

// Load modules

const Package = require('../package.json');
const Mobeeus = require('./mobeeus');

// Declare internals

const internals = {};

exports.register = function (server, options, next) {

    const rootState = internals.state(server.root);
    if (!rootState.setup) {

        rootState.mobeeus = new Mobeeus(options);

        // 'onPreStart' - called before the connection listeners are started.
        server.ext('onPreStart', internals.init);

        // 'onPostStop' - called after the connection listeners are stopped.
        server.ext('onPostStop', internals.stop);

        rootState.setup = true;
    };

    next();
};

exports.register.attributes = {
    pkg: Package
};

internals.init = function (server, next) {


    const state = internals.state(server.root);
    const mobeeus = state.mobeeus;

    mobeeus.init((err) => {

        if (err) {
            return next(err);
        }


        server.decorate('server', 'dispatcher', mobeeus.dispatcher);
        server.decorate('request', 'dispatcher', mobeeus.dispatcher);
        mobeeus.start(next);
    });
};


internals.stop = function (server, next) {

    const mobeeus = internals.state(server.root).mobeeus;
    mobeeus.stop(next);
};

internals.state = (srv) => {

    const state = srv.realm.plugins.mobeeus = srv.realm.plugins.mobeeus || {};
    return state;
};
