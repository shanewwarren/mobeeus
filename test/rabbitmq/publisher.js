'use strict';

// Load modules
const expect = require('chai').expect;
const Co = require('co');
const RabbitMQ = require('../../lib/rabbitmq');
const Connection = RabbitMQ.Connection;
const Publisher = RabbitMQ.Publisher;

// Declare internals
const internals = {};

// Tests
describe('Publisher', () => {

    it('should create a publisher instance', () => {

        return Co(function *() {

            const connection = new Connection();
            yield connection.open();

            const publisher = new Publisher();
            yield publisher.connect(connection, { name: 'test' });

        });
    });


    it('should send a task to the test queue', () => {

        return Co(function *() {

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

        });
    });

    it('should fail to send a message if the connection is closed.', () => {

        return Co(function *() {

            const connection = new Connection();
            yield connection.open();

            const publisher = new Publisher();
            yield publisher.connect(connection, { name: 'test' });

            // close the connection
            yield connection.close();

            let exception = null;

            try {
                publisher.addTask({
                    message: 'Simple Task'
                });
            }
            catch (e) {
                exception = e;
            }

            expect(exception).to.not.equal(null);
        });
    });

});
