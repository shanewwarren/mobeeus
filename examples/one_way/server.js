'use strict';

// Load modules
const Hapi = require('hapi');
const Hoek = require('hoek');
const Promise = require('bluebird');


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

const sendTasks = (srv) => {

    const items = [...Array(100).keys()].map((number) => {

        return { left: 5, right: number + 1, operator: '*' };
    });

    return Promise.each(items, (item) => {

        return srv.dispatcher.task('math-task', item);
    });
};

const timeout = (ms) => {

    return new Promise((ok) => {

        setTimeout(ok, ms);
    });
};

server.register(mobeeus)
      .then(() => server.start())
      .then(() => sendTasks(server))
      .then(() => timeout(5000))
      .then(() => server.stop())
      .catch((err) => {

          console.log(err);
          Hoek.assert(!err, err);
      });
