'use strict';

// Load modules
const Hapi = require('hapi');
const Hoek = require('hoek');
const Items = require('items');

const Mobeeus = require('../../lib');

const Math = require('./queues/math');

const server = new Hapi.Server();
server.connection({ port: 3000 });

const mobeeus = {
    register: Mobeeus,
    options: {
        register: Math,
        state: (done) => {

            return done(null, { subject: 'Server' });
        }
    }
};

const items = [...Array(100).keys()].map((number) => {

    return { left: 5, right: number + 1, operator: '*' };
});

server.register(mobeeus, (err) => {

    Hoek.assert(!err, err);

    server.start((err) => {

        Hoek.assert(!err, err);

        const each = (item, next) => server.dispatcher.task('math-task', item, next);

        Items.serial(items, each, (err) => {

            Hoek.assert(!err, err);

            setTimeout(() => {

                server.stop((err) => {

                    Hoek.assert(!err, err);
                });
            }, 5000);
        });
    });
});
