'use strict';

// Load modules
const Hapi = require('hapi');
const Hoek = require('hoek');
const Mobeeus = require('../../lib');

const Reports = require('./queues/reports');

const server = new Hapi.Server();
server.connection({ port: 3000 });

const mobeeus = {
    register: Mobeeus,
    options: {
        register: Reports
    }
};

server.register(mobeeus, (err) => {

    Hoek.assert(!err, err);

    server.start((err) => {

        Hoek.assert(!err, err);

        server.dispatcher.agenda.cancel({ name: 'five-second-report' }, (err, numRemoved) => {

            Hoek.assert(!err, err);

            server.dispatcher.every('five seconds', 'five-second-report', {}, (err) => {

                Hoek.assert(!err, err);

                setTimeout(() => {

                    server.stop((err) => {

                        Hoek.assert(!err, err);
                    });
                }, 20000);
            });

        });
    });
});
