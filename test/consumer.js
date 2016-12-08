'use strict';

// Load modules

const expect = require('chai').expect;
const Items = require('items');
const Publisher = require('../lib/publisher');
const Connection = require('../lib/connection');
const Consumer = require('../lib/consumer');

// Declare internals

const internals = {};

// Tests

describe('Consumer', () => {

    it('should create a consumer instance', (done) => {

        const connection = new Connection();
        connection.open((err) => {

            expect(err).to.be.undefined;

            const consumer = new Consumer();
            consumer.connect(connection, { name: 'test' }, (err) => {

                expect(err).to.not.exist;
                done();
            });
        });

    });


    it('should send a task to the test queue', function (done) {

        this.timeout(500);

        const connection = new Connection();
        const publisher = new Publisher();
        const consumer = new Consumer();
        const payload = {
            message: 'Simple Task'
        };

        const handler = (item, content, channel) => {

            expect(content.message).to.equal('Simple Task');
            channel.ack(item);
            done();
        };

        connection.open((err) => {

            expect(err).to.not.exist;
            publisher.connect(connection, { name: 'test' }, (err) => {

                expect(err).to.not.exist;
                publisher.addTask(payload, (err) => {

                    expect(err).to.not.exist;
                    consumer.connect(connection, { name: 'test' }, (err) => {

                        expect(err).to.not.exist;
                        consumer.receiveTasks(handler, (err) => {

                            expect(err).to.not.exist;
                        });
                    });
                });
            });
        });


    });

    // it('should not be able to recieve tasks a task to the test queue', function () {

    //     this.timeout(500);

    //     return Co(function *() {

    //         let message = null;

    //         const connection = new Connection();
    //         yield connection.open();

    //         const consumer = new Consumer();
    //         yield consumer.connect(connection, { name: 'test' });

    //         yield connection.close();

    //         let exception = null;
    //         try {
    //             consumer.receiveTasks((task, obj, channel) => {

    //                 message = obj.message;
    //                 channel.ack(task);
    //             });
    //         }
    //         catch (ex) {
    //             exception = ex;
    //         }

    //         expect(exception).to.not.equal(null);

    //     });
    // });

    // it('task handler should return null if connection is severed.', function () {

    //     this.timeout(500);

    //     return Co(function *() {

    //         const connection = new Connection();
    //         yield connection.open();

    //         const consumer = new Consumer();
    //         yield consumer.connect(connection, { name: 'test' });

    //         let exception = null;
    //         let closed = false;
    //         try {
    //             consumer.receiveTasks((task, obj, channel) => {

    //                 // do nothing.
    //             }, (err) => {

    //                 closed = true;
    //             });
    //         }
    //         catch (ex) {
    //             exception = ex;
    //         }

    //         // Now cancel the connection.
    //         yield connection.close();

    //         const promise = new Promise((resolve, reject) => {

    //             setTimeout(() => {

    //                 resolve();
    //             }, 250);
    //         });


    //         yield promise;

    //         expect(exception).to.equal(null);
    //         expect(closed).to.equal(true);

    //     });
    // });
});
