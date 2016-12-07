'use strict';

// Load modules
const expect = require('chai').expect;
const Co = require('co');
const RabbitMQ = require('../../lib/rabbitmq');
const Connection = RabbitMQ.Connection;
const Consumer = RabbitMQ.Consumer;

// Declare internals
const internals = {};

// Tests
describe('Connection', () => {

    it('should open a connection by using defaults', () => {

        return Co(function *() {

            const connection = new Connection();
            yield connection.open();
        });
    });

    it('should close only active channels', function () {

        this.timeout(10000);
        return Co(function *() {

            const connection = new Connection();
            yield connection.open();

            const consumerOne = new Consumer();
            yield consumerOne.connect(connection, { name: 'test' });

            const consumerTwo = new Consumer();
            yield consumerTwo.connect(connection, { name: 'test2' });

            // now close one
            yield consumerOne.disconnect();

            expect(connection.channelCount).to.equal(1);

            // now close the connection
            yield connection.close();
        });
    });

    it('should throw an exception if we try to close before opening it.', () => {

        return Co(function *() {

            let exception = null;

            const connection = new Connection();
            try {
                yield connection.close();
            }
            catch (e) {
                exception = e;
            }

            expect(exception).to.not.equal(null);
            expect(exception.message).to.equal('No active connection.  Cannot close.');
        });
    });

});
