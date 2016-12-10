'use strict';

// Load modules
const Hapi = require('hapi');
const Hoek = require('hoek');
const Mobeeus = require('../../lib');

const Simple = require('./queues/simple');
const Server = require('./queues/server');

const server = new Hapi.Server();
server.connection({ port: 3000 });

const mobeeus = {
    register: Mobeeus,
    options: {
        register: [Simple, Server],
        state: (done) => {

            return done(null, { subject: 'Server' });
        }
    }
};

server.register(mobeeus, (err) => {

    Hoek.assert(!err, err);

    server.start((err) => {

        Hoek.assert(!err, err);
        server.dispatcher.task('simple-task', { greeting: 'Hello from the' }, (err) => {

            Hoek.assert(!err, err);

            setTimeout(() => {

                server.stop((err) => {

                    Hoek.assert(!err, err);
                });
            }, 500);
        });
    });
});
