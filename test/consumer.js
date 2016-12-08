'use strict';

// Load modules

const expect = require('chai').expect;
const Publisher = require('../lib/publisher');
const Connection = require('../lib/connection');
const Consumer = require('../lib/consumer');

// Declare internals

const internals = {};

// Tests

describe('Consumer', () => {

    it('should create a consumer instance', (done) => {

        const connection = new Connection();
        const consumer = new Consumer({ name: 'test' });

        connection.open((err) => {

            expect(err).to.not.exist;
            consumer.connect(connection, (err) => {

                expect(err).to.not.exist;
                done();
            });
        });

    });


    it('should send a task to the test queue', (done) => {

        const connection = new Connection();
        const publisher = new Publisher({ name: 'test' });
        const consumer = new Consumer({ name: 'test' });
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
            publisher.connect(connection, (err) => {

                expect(err).to.not.exist;
                publisher.addTask(payload, (err) => {

                    expect(err).to.not.exist;
                    consumer.connect(connection, (err) => {

                        expect(err).to.not.exist;
                        consumer.receiveTasks(handler, (err) => {

                            expect(err).to.not.exist;
                        });
                    });
                });
            });
        });


    });

    it('should not be able to recieve tasks a task to the test queue',  (done) => {

        const connection = new Connection();
        const consumer = new Consumer({ name: 'test' });

        const handler = (item, content, channel) => {

            // shouldn't get here.
            channel.ack(task);
        };

        connection.open((err) => {

            expect(err).to.not.exist;
            consumer.connect(connection, (err) => {

                expect(err).to.not.exist;
                consumer.disconnect((err) => {

                    expect(err).to.not.exist;
                    consumer.receiveTasks(handler, (err) => {

                        expect(err).to.exist;
                        done();
                    });
                });
            });
        });

    });
});
