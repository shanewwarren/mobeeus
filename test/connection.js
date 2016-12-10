'use strict';

// Load modules

const expect = require('chai').expect;
const Items = require('items');

const Connection = require('../lib/connection');
const Consumer = require('../lib/consumer');

// Declare internals

const internals = {};

// Tests

describe('Connection', function () {

    this.timeout(10000);

    it('should open a connection by using defaults', (done) => {

        const connection = new Connection();
        connection.open((err) => {

            expect(err).to.be.undefined;
            done(err);
        });
    });

    it('should close only active channels', (done) => {

        const consumerOne = new Consumer({ name: 'test' });
        const consumerTwo = new Consumer({ name: 'test2' });

        const connection = new Connection();
        connection.open((err) => {

            expect(err).to.be.undefined;

            const each = (item, next) => item.connect(connection, next);
            Items.parallel([consumerOne, consumerTwo], each, (err) => {

                expect(err).to.be.undefined;

                // now close one.
                consumerOne.disconnect((err) => {

                    expect(err).to.be.undefined;

                    expect(connection.channelCount()).to.equal(1);
                    connection.close(done);
                });
            });
        });


    });

    it('should throw an exception if we try to close before opening it.', (done) => {

        const connection = new Connection();
        connection.close((err) => {

            expect(err).to.exist;
            done();
        });

    });

});
