'use strict';

// Load modules

const Mobeeus = require('./mobeeus');
const Process = require('process');
const Fs = require('fs');
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
        }
    };

    const argv = Bossy.parse(definition);

    if (argv instanceof Error) {

        let error = Bossy.usage(definition, 'worker [options]');
        error = error + '\n' + argv.message;
        next(new Error(error));
    }

    return internals.readOptions(argv.options, next);
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

internals.stop = function (next) {

    internals.mobeeus.stop((err) => {

        if (err) {
            return next(err);
        }

        internals.mobeeus = null;
        return next();
    });
};

internals.readOptions = function (path, next) {

    Fs.access(argv.options, (err) => {

        if (err) {
            return next(new Error(`Options file '${argv.options}' does not exist.`));
        }

        try {
            options = require(argv.options);
            return next(null, options);
        }
        catch (err) {
            return next(new Error(`Options file '${argv.options}' is not valid json.`));
        }
    });
};

if (require.main === module) {

    // process arguments

    Process.on('SIGINT', internals.stop);
    Process.on('SIGTERM', internals.stop);

    internals.options((err, options) => {

        if (err) {
            console.log(err);
            Process.exit(1);
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
