'use strict';

// Load modules
const expect = require('chai').expect;
const Publisher = require('../lib/publisher');
const Connection = require('../lib/connection');

// Declare internals
const internals = {};

// Tests
describe('Publisher', () => {

    it('should create a publisher instance', () => {

        const connection = new Connection();
        const publisher = new Publisher({ name: 'test' });

        connection.open((err) => {

            expect(err).to.not.exist;
            publisher.connect(connection, (err) => {

                expect(err).to.not.exist;
                done();
            });
        });
    });


    it('should send a task to the test queue', () => {

        const connection = new Connection();
        const publisher = new Publisher({ name: 'test' });
        const payload = {
            message: 'Simple Task'
        };

        connection.open((err) => {

            expect(err).to.not.exist;
            publisher.connect(connection, (err) => {

                expect(err).to.not.exist;
                publisher.addTask(payload, (err) => {

                    expect(err).to.not.exist;
                    done();
                });
            });
        });
    });

    it('should fail to send a message if the connection is closed.', () => {

        const connection = new Connection();
        const publisher = new Publisher({ name: 'test' });

        const payload = {
            message: 'Simple Task'
        };

        connection.open((err) => {

            expect(err).to.not.exist;
            publisher.connect(connection, (err) => {

                expect(err).to.not.exist;
                connection.close((err) => {

                    expect(err).to.not.exist;
                    publisher.addTask(payload, (err) => {

                        expect(err).to.exist;
                        done();
                    });
                });
            });
        });
    });

});
