'use strict';

// Load modules
const expect = require('chai').expect;
const Co = require('co');
const RabbitMQ = require('../../lib/rabbitmq');
const Connection = RabbitMQ.Connection;
const Publisher = RabbitMQ.Publisher;
const Consumer = RabbitMQ.Consumer;


// Declare internals
const internals = {};

// Tests
describe('Consumer', () => {

    it('should create a consumer instance', () => {

        return Co(function *() {

            const connection = new Connection();
            yield connection.open();

            const consumer = new Consumer();
            yield consumer.connect(connection, { name: 'test' });

        });
    });


    it('should send a task to the test queue', function () {

        this.timeout(500);

        return Co(function *() {

            let message = null;

            const connection = new Connection();
            yield connection.open();

            const publisher = new Publisher();
            yield publisher.connect(connection, { name: 'test' });

            let exception = null;
            try {
                publisher.addTask({
                    message: 'Simple Task'
                });
            }
            catch (ex) {
                exception = ex;
            }

            expect(exception).to.equal(null);

            const consumer = new Consumer();
            yield consumer.connect(connection, { name: 'test' });

            try {
                consumer.receiveTasks((task, obj, channel) => {

                    message = obj.message;
                    channel.ack(task);
                });
            }
            catch (ex) {
                exception = ex;
            }

            expect(exception).to.equal(null);

            const promise = new Promise((resolve, reject) => {

                setTimeout(() => {

                    resolve();
                }, 250);
            });


            yield promise;

            expect(message).to.equal('Simple Task');
        });
    });

    it('should not be able to recieve tasks a task to the test queue', function () {

        this.timeout(500);

        return Co(function *() {

            let message = null;

            const connection = new Connection();
            yield connection.open();

            const consumer = new Consumer();
            yield consumer.connect(connection, { name: 'test' });

            yield connection.close();

            let exception = null;
            try {
                consumer.receiveTasks((task, obj, channel) => {

                    message = obj.message;
                    channel.ack(task);
                });
            }
            catch (ex) {
                exception = ex;
            }

            expect(exception).to.not.equal(null);

        });
    });

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
