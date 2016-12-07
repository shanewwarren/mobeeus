'use strict';

// Load modules
const Package = require('../../package.json');


// Declare internals
const internals = {};

exports.register = function (server, options, next) {

    const rootState = internals.state(server.root);

    if (!rootState.setup) {

        rootState.collector = {
            connection: null,
            models: {},
            defaults: {}
        };


        server.decorate('server', 'consumer', internals.producer((ctx) => ctx, 'realm'));
        server.decorate('server', 'producer', internals.producer((ctx) => ctx, 'realm'));
        server.decorate('request', 'producer', internals.producer((ctx) => ctx.server, 'route.realm'));


        // 'onPreStart' - called before the connection listeners are started.
        server.ext('onPreStart', internals.initialize);

        // 'onPostStop' - called after the connection listeners are stopped.
        server.ext('onPostStop', internals.stop);

        rootState.setup = true;
    };

    // Collect defaults
    const collector = rootState.collector;
    const defaults = options.defaults || {};

    Object.keys(defaults).forEach((key) => {

        Hoek.assert(!collector.defaults[key], `Default for "${key}" has already been set.`);
        collector.defaults[key] = defaults[key];
    });

    const config = internals.registrationConfig(options);
    server.root.dogwater(config);

    next();
};


exports.register.attributes = {
    pkg: Package,
    multiple: true
};

internals.initialize = function (server, next) {

    const waterline = server.waterline;
    const collector = internals.state(server.root).collector;

    // Hand the models to waterline
    Object.keys(collector.models).forEach((id) => {

        const model = collector.models[id];
        const modelExtended = Waterline.Collection.extend(model);
        waterline.loadCollection(modelExtended);
    });

    const config = {
        adapters: collector.adapters,
        connections: collector.connections,
        defaults: collector.defaults
    };

    // Finally init waterline and carry on
    waterline.initialize(config, next);
};


internals.stop = function (server, next) {

    const collector = internals.state(server.root).collector;

    // Do not teardown if specifically ask not to
    if (collector.teardownOnStop === false) {
        return next();
    }

    return server.waterline.teardown(next);
};


internals.state = (srv) => {

    const state = srv.realm.plugins.slowmobius = srv.realm.plugins.slowmobius || {};
    return state;
};

