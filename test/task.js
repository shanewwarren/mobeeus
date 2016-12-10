'use strict';

// Load modules
const expect = require('chai').expect;
const Joi = require('joi');
const Task = require('../lib/task');

// Declare internals
const internals = {};

// Tests
describe('Task', () => {

    it('should fail with invalid options', (done) => {

        let task = null;

        try {
            task = new Task();
        }
        catch (err) {
            expect(err).to.exist;
        }

        expect(task).to.not.exist;

        done();
    });

    it('should create a new instance with valid options', (done) => {

        const task = new Task({
            queue: 'simpleQueue',
            name: 'simpleTask',
            handler: (context, payload, done) => {

                console.log('Do something');
                return done();
            }
        });

        expect(task).to.exist;
        done();
    });

    it('should return the payload unchanged if there are no validation options.', (done) => {

        const task = new Task({
            queue: 'simpleQueue',
            name: 'simpleTask',
            handler: (context, payload, done) => {

                console.log('Do something');
                return done();
            }
        });

        const payload = task.validate({
            message: 'Hello!'
        });

        expect(payload.message).to.equal('Hello!');

        done();
    });

    it('should throw an error if the payload is invalid.', (done) => {

        const task = new Task({
            queue: 'simpleQueue',
            name: 'simpleTask',
            handler: (context, payload, done) => {

                console.log('Do something');
                return done();
            },
            config: {
                validate: {
                    payload: {
                        message: Joi.string().default('Hola')
                    }
                }
            }
        });

        let payload = null;
        try {
            payload = task.validate({
                message: 1234
            });
        }
        catch (err) {

            expect(err).to.exist;
        }

        done();
    });

    it('should validate payload and assume defaults.', (done) => {

        const task = new Task({
            queue: 'simpleQueue',
            name: 'simpleTask',
            handler: (context, payload, done) => {

                console.log('Do something');
                return done();
            },
            config: {
                validate: {
                    payload: {
                        message: Joi.string().default('Hola')
                    }
                }
            }
        });

        let payload = null;
        payload = task.validate();
        expect(payload.message).to.equal('Hola');

        done();
    });

});
