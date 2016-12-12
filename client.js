#!/usr/bin/env node

'use strict';

// Load modules

const Mobeeus = require('./lib/mobeeus');
const Process = require('process');
const Path = require('path');
const Bossy = require('bossy');

// Declare internals

const internals = {};
internals.mobeeus = null;

internals.options = function (next) {

    const definition = {
        options: {
            alias: 'f',
            type: 'string',
            description: 'Options path',
            require: true
        },
        keepAlive: {
            alias: 'a',
            type: 'number',
            description: 'How long to keep alive (default: forever)',
            require: false,
            default: -1
        },
        watch: {
            alias: 'w',
            type: 'boolean',
            description: 'Watch the process using nodemon.',
            require: false,
            default: -1
        }
    };

    const argv = Bossy.parse(definition);

    if (argv instanceof Error) {

        const error = Bossy.usage(definition, 'worker [options]');
        next(error);
    }

    return internals.readOptions(argv.options, (err, options) => {

        if (err) {
            return next(err);
        }

        return next(null, options, argv.keepAlive);
    });
};

internals.start = function (options, next) {

    const settings = Object.assign({}, options, { worker: true });

    internals.mobeeus = new Mobeeus(settings);
    internals.mobeeus.init((err) => {

        if (err) {
            return next(err);
        }

        internals.mobeeus.start(next);
    });
};

internals.stop = function () {

    internals.mobeeus.stop((err) => {

        if (err) {
            console.log(err);
        }

        internals.mobeeus = null;
    });
};

internals.readOptions = function (path, next) {

    const fullPath = Path.join(Process.cwd(), path);

    try {
        const options = require(fullPath);
        return next(null, options);
    }
    catch (err) {
        return next(err);
    }
};

if (require.main === module) {

    // process arguments
    Process.on('SIGINT', internals.stop);
    Process.on('SIGTERM', internals.stop);

    internals.options((err, options, keepAlive) => {

        if (err) {
            console.log(err);
            Process.exit(1);
        }

        if (keepAlive >= 0) {
            setTimeout(() => {

                internals.stop();

            }, keepAlive);
        }

        internals.start(options, (err) => {

            if (err) {
                console.log(err);
                Process.exit(1);
            }

            console.log('Mobeeus client running.');
        });
    });
}
else {

    exports = module.exports = function (options) {

        const settings = Object.assign({}, options, { worker: true });
        return new Mobeeus(settings);
    };
}
