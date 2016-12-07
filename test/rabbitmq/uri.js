'use strict';

// Load modules
const expect = require('chai').expect;
const RabbitMQ = require('../../lib/rabbitmq');
const Uri = RabbitMQ.Uri;

// Declare internals
const internals = {};

// Tests
describe('Uri', () => {

    it('No options should default to localhost', (done) => {

        const uri = new Uri({});
        expect(uri.full).to.equal('amqp://localhost');
        done();
    });

    it('Host and port', (done) => {

        const uri = new Uri({
            host: '127.0.0.1',
            port: 9999
        });

        expect(uri.full).to.equal('amqp://127.0.0.1:9999');
        done();
    });

    it('Just username', (done) => {

        const uri = new Uri({
            username: 'root'
        });

        expect(uri.full).to.equal('amqp://root@localhost');
        done();
    });

    it('Just password', (done) => {

        const uri = new Uri({
            password: 'hahaha'
        });

        expect(uri.full).to.equal('amqp://localhost');
        done();
    });

    it('Username and password', (done) => {

        const uri = new Uri({
            username: 'root',
            password: 'hahaha'
        });

        expect(uri.full).to.equal('amqp://root:hahaha@localhost');
        done();
    });

    it('Just port', (done) => {

        const uri = new Uri({
            port: 9999
        });

        expect(uri.full).to.equal('amqp://localhost:9999');
        done();
    });

    it('Everything', (done) => {

        const uri = new Uri({
            host: '127.0.0.1',
            port: 9999,
            username: 'root',
            password: 'hahaha',
            vhost: '/vhost',
            heartbeat: 5
        });

        expect(uri.full).to.equal('amqp://root:hahaha@127.0.0.1:9999/%2Fvhost?heartbeat=5');
        done();
    });

});
