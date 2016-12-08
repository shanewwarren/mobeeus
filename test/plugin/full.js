'use strict';

// Load modules
const expect = require('chai').expect;
const Hapi = require('hapi');
const Joi = require('joi');
const Co = require('co');
const Mobeeus = require('../../lib');

// Declare internals
const internals = {};

internals.wait = (milliseconds) => {

    return new Promise((resolve, reject) => {

        setTimeout(() => {

            resolve();
        }, milliseconds);
    });
};

internals.getServer = (options) => {

    return new Co(function *() {

        const server = new Hapi.Server();
        server.connection({ port: 3000 });

        yield server.register([{
            register: Mobeeus,
            options
        }]);

        return server;
    });
};


// Tests
describe('Full', function () {

    this.timeout(200000);

    it('should register successfully, and run a simple task.', () => {

        return Co(function *() {

            let received = null;
            const register = (mobeeus) => {

                mobeeus.queue({
                    name: 'simple-queue'
                });

                mobeeus.task({
                    queue: 'simple-queue',
                    name: 'simple-task',
                    handler: (context, payload, done) => {

                        // this will run on the worker.
                        received = payload.greeting;
                        return Promise.resolve(null);
                    },
                    config: {
                        validate: {
                            payload: {
                                greeting: Joi.string().required()
                            }
                        }
                    }
                });
            };

            const server = yield internals.getServer({
                register
            });

            yield server.start();

            expect(server.dispatcher).to.not.exist;

            server.dispatcher.task('simple-task', {
                greeting: 'Hello, World'
            });

            yield internals.wait(250);

            expect(received).to.equal('Hello, World');

            server.dispatcher.task('simple-task', {
                greeting: 'Goodbye, World'
            });

            yield internals.wait(250);

            expect(received).to.equal('Goodbye, World');

            yield server.stop();
        });
    });


    it('should handle three different queues', () => {

        return Co(function *() {

            let receivedOne = null;
            let receivedTwo = null;
            let receivedThree = null;

            const register = (mobeeus) => {

                mobeeus.queue({
                    name: 'simple-queue-one'
                });

                mobeeus.queue({
                    name: 'simple-queue-two'
                });

                mobeeus.queue({
                    name: 'simple-queue-three'
                });


                mobeeus.task({
                    queue: 'simple-queue-one',
                    name: 'simple-task-one',
                    handler: (context, payload, done) => {

                        // this will run on the worker.
                        receivedOne = payload.greeting;
                        return Promise.resolve(null);
                    },
                    config: {
                        validate: {
                            payload: {
                                greeting: Joi.string().required()
                            }
                        }
                    }
                });

                mobeeus.task({
                    queue: 'simple-queue-two',
                    name: 'simple-task-two',
                    handler: (context, payload, done) => {

                        // this will run on the worker.
                        receivedTwo = payload.greeting;
                        return Promise.resolve(null);
                    },
                    config: {
                        validate: {
                            payload: {
                                greeting: Joi.string().required()
                            }
                        }
                    }
                });

                mobeeus.task({
                    queue: 'simple-queue-three',
                    name: 'simple-task-three',
                    handler: (context, payload, done) => {

                        // this will run on the worker.
                        receivedThree = payload.greeting;
                        return Promise.resolve(null);
                    },
                    config: {
                        validate: {
                            payload: {
                                greeting: Joi.string().required()
                            }
                        }
                    }
                });
            };

            const server = yield internals.getServer({
                register
            });

            yield server.start();

            expect(server.dispatcher).to.not.exist;

            server.dispatcher.task('simple-task-one', {
                greeting: 'Hello'
            });

            server.dispatcher.task('simple-task-two', {
                greeting: 'Hola'
            });

            server.dispatcher.task('simple-task-three', {
                greeting: 'Bonjour'
            });

            yield internals.wait(250);

            expect(receivedOne).to.equal('Hello');
            expect(receivedTwo).to.equal('Hola');
            expect(receivedThree).to.equal('Bonjour');

            yield server.stop();
        });
    });


    it('should run a scheduled job three times', () => {

        return Co(function *() {

            let counter = 0;
            const register = (mobeeus) => {

                mobeeus.job({
                    name: 'every 1s job',
                    handler: (context, job, done) => {

                        counter++;
                        if (counter >= 3) {
                            job.remove();
                        }
                        done();
                    }
                });
            };

            const server = yield internals.getServer({
                register
            });

            yield server.start();

            server.dispatcher.every('one second', 'every 1s job');

            yield internals.wait(8000);

            expect(counter).to.be.above(2);

            yield server.stop();
        });
    });

});
