'use strict';

// Load modules
const expect = require('chai').expect;
const Hapi = require('hapi');
const Joi = require('joi');
const Items = require('items');
const MobeeusClient = require('../client');
const Mobeeus = require('../lib');

// Declare internals
const internals = {};

internals.getServer = (options, cb) => {

    const server = new Hapi.Server();
    server.connection({ port: 3000 });

    server.register([{
        register: Mobeeus,
        options
    }], (err) => {

        cb(err, server);
    });
};


// Tests
describe('client', function () {

    this.timeout(200000);

    it('should queue a task', (finished) => {

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
                    done();
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

        let mobeeus = null;
        try {
            mobeeus = new MobeeusClient({
                register,
                state: (done) => {

                    return done(null, {
                        message: 'Initial Message'
                    });
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist;
        }

        internals.getServer({ register }, (err, server) => {

            expect(err).to.not.exist;

            const each = (item, next) => item(next);
            Items.serial([server.start.bind(server), mobeeus.init.bind(mobeeus), mobeeus.start.bind(mobeeus)], each, (err) => {

                expect(err).to.not.exist;
                expect(server.dispatcher).to.exist;
                server.dispatcher.task('simple-task', { greeting: 'Hello, World' }, (err) => {

                    expect(err).to.not.exist;

                    setTimeout(() => {

                        expect(received).to.exist;
                        Items.serial([server.stop.bind(server), mobeeus.stop.bind(mobeeus)], each, (err) => {

                            expect(err).to.not.exist;
                            finished();
                        });

                    }, 25);
                });
            });
        });

    });

    it('should retry a task after it\'s failed.', (finished) => {

        let received = null;
        let failed = false;
        const register = (mobeeus) => {

            mobeeus.queue({
                name: 'simple-queue'
            });

            mobeeus.task({
                queue: 'simple-queue',
                name: 'simple-task',
                handler: (context, payload, done) => {

                    // this will run on the worker.
                    if (!failed) {
                        failed = true;
                        return done(new Error('failure!'));
                    }

                    received = payload.greeting;
                    done();
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

        let mobeeus = null;
        try {
            mobeeus = new MobeeusClient({
                register,
                state: (done) => {

                    return done(null, {
                        message: 'Initial Message'
                    });
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist;
        }

        internals.getServer({ register }, (err, server) => {

            expect(err).to.not.exist;

            const each = (item, next) => item(next);
            Items.serial([server.start.bind(server), mobeeus.init.bind(mobeeus), mobeeus.start.bind(mobeeus)], each, (err) => {

                expect(err).to.not.exist;
                expect(server.dispatcher).to.exist;
                server.dispatcher.task('simple-task', { greeting: 'Hello, World' }, (err) => {

                    expect(err).to.not.exist;

                    setTimeout(() => {

                        expect(received).to.exist;
                        Items.serial([server.stop.bind(server), mobeeus.stop.bind(mobeeus)], each, (err) => {

                            expect(err).to.not.exist;
                            finished();
                        });

                    }, 100);
                });
            });
        });

    });

    it('should queue a task, run it, then queue a task and run it server side.', (finished) => {

        let received = null;
        const register = (mobeeus) => {

            mobeeus.queue({
                name: 'simple-queue'
            });

            mobeeus.task({
                queue: 'simple-queue',
                name: 'simple-task',
                handler: (context, payload, done) => {

                    // dispatch the event to the server.
                    context.dispatcher.task('server-task', payload, done);
                },
                config: {
                    validate: {
                        payload: {
                            greeting: Joi.string().required()
                        }
                    }
                }
            });

            mobeeus.serverQueue({
                name: 'server-queue'
            });

            mobeeus.task({
                queue: 'server-queue',
                name: 'server-task',
                handler: (context, payload, done) => {

                    // this will run on the server.
                    received = payload.greeting;
                    done();
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

        let mobeeus = null;
        try {
            mobeeus = new MobeeusClient({
                register,
                state: (done) => {

                    return done(null, {
                        message: 'Initial Message'
                    });
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist;
        }

        internals.getServer({ register }, (err, server) => {

            expect(err).to.not.exist;

            const each = (item, next) => item(next);
            Items.serial([server.start.bind(server), mobeeus.init.bind(mobeeus), mobeeus.start.bind(mobeeus)], each, (err) => {

                expect(err).to.not.exist;
                expect(server.dispatcher).to.exist;
                server.dispatcher.task('simple-task', { greeting: 'Hello, World' }, (err) => {

                    expect(err).to.not.exist;

                    setTimeout(() => {

                        expect(received).to.exist;
                        Items.serial([server.stop.bind(server), mobeeus.stop.bind(mobeeus)], each, (err) => {

                            expect(err).to.not.exist;
                            finished();
                        });

                    }, 25);
                });
            });
        });

    });

    it('should schedule a job now', (finished) => {

        let received = null;
        const register = (mobeeus) => {

            mobeeus.job({

                name: 'simple-job',
                handler: (context, job, done) => {

                    // this will run on the worker.
                    received = job.attrs.data.greeting;
                    done();
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

        let mobeeus = null;
        try {
            mobeeus = new MobeeusClient({
                register,
                state: (done) => {

                    return done(null, {
                        message: 'Initial Message'
                    });
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist;
        }

        internals.getServer({ register }, (err, server) => {

            expect(err).to.not.exist;

            const each = (item, next) => item(next);
            Items.serial([server.start.bind(server), mobeeus.init.bind(mobeeus), mobeeus.start.bind(mobeeus)], each, (err) => {

                expect(err).to.not.exist;
                expect(server.dispatcher).to.exist;
                server.dispatcher.now('simple-job', { greeting: 'Hello, World' }, (err) => {

                    expect(err).to.not.exist;

                    setTimeout(() => {

                        expect(received).to.exist;

                        Items.serial([server.stop.bind(server), mobeeus.stop.bind(mobeeus)], each, (err) => {

                            expect(err).to.not.exist;
                            finished();
                        });

                    }, 25);
                });
            });
        });

    });


    it('should schedule a job to run every second', (finished) => {

        let counter = 1;
        const register = (mobeeus) => {

            mobeeus.job({

                name: 'simple-job',
                handler: (context, job, done) => {

                    // this will run on the worker.
                    counter++;
                    if (counter >= 3) {
                        job.remove();
                    }
                    done();
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

        let mobeeus = null;
        try {
            mobeeus = new MobeeusClient({
                register,
                state: (done) => {

                    return done(null, {
                        message: 'Initial Message'
                    });
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist;
        }

        internals.getServer({ register }, (err, server) => {

            expect(err).to.not.exist;

            const each = (item, next) => item(next);
            Items.serial([server.start.bind(server), mobeeus.init.bind(mobeeus), mobeeus.start.bind(mobeeus)], each, (err) => {

                expect(err).to.not.exist;
                expect(server.dispatcher).to.exist;

                server.dispatcher.agenda.cancel({ name: 'simple-job' }, (err, numRemoved) => {

                    expect(err).to.not.exist;
                    server.dispatcher.every('one second', 'simple-job', { greeting: 'Hello, World' }, (err) => {

                        expect(err).to.not.exist;

                        setTimeout(() => {

                            expect(counter).to.be.above(2);

                            Items.serial([server.stop.bind(server), mobeeus.stop.bind(mobeeus)], each, (err) => {

                                expect(err).to.not.exist;
                                finished();
                            });

                        }, 5000);
                    });

                });
            });
        });

    });

    it('should schedule a job to run once in two seconds', (finished) => {

        let received = null;
        const register = (mobeeus) => {

            mobeeus.job({

                name: 'simple-job',
                handler: (context, job, done) => {

                    // this will run on the worker.
                    received = job.attrs.data.greeting;
                    done();
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

        let mobeeus = null;
        try {
            mobeeus = new MobeeusClient({
                register,
                state: (done) => {

                    return done(null, {
                        message: 'Initial Message'
                    });
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist;
        }

        internals.getServer({ register }, (err, server) => {

            expect(err).to.not.exist;

            const each = (item, next) => item(next);
            Items.serial([server.start.bind(server), mobeeus.init.bind(mobeeus), mobeeus.start.bind(mobeeus)], each, (err) => {

                expect(err).to.not.exist;
                expect(server.dispatcher).to.exist;

                server.dispatcher.agenda.cancel({ name: 'simple-job' }, (err, numRemoved) => {

                    expect(err).to.not.exist;
                    server.dispatcher.schedule('two seconds', 'simple-job', { greeting: 'Hello, World' }, (err) => {

                        expect(err).to.not.exist;

                        setTimeout(() => {

                            expect(received).to.equal('Hello, World');

                            Items.serial([server.stop.bind(server), mobeeus.stop.bind(mobeeus)], each, (err) => {

                                expect(err).to.not.exist;
                                finished();
                            });

                        }, 5000);
                    });

                });
            });
        });

    });

});
