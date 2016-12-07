'use strict';

// Load modules
const expect = require('chai').expect;
const Co = require('co');
const Agenda = require('../../lib/agenda');


// Declare internals
const internals = {};

internals.wait = (milliseconds) => {

    return new Promise((resolve, reject) => {

        setTimeout(() => {

            resolve();
        }, milliseconds);
    });
};


// Tests
describe('Agenda', () => {

    it('should open a connection by using defaults', () => {

        return Co(function *() {

            const agenda = new Agenda();
            yield agenda.connect();
        });
    });

    it('should open, start, then disconnect.', () => {

        return Co(function *() {

            let exception = null;

            try {
                const agenda = new Agenda();
                yield agenda.connect();
                yield agenda.start();
                yield agenda.disconnect();

                expect(agenda.agenda).to.be.null;
            }
            catch (e) {
                exception = e;
            }

            expect(exception).to.equal(null);
        });
    });


    it('should define a simple job and execute it.', () => {

        return Co(function *() {

            let exception = null;

            try {
                const agenda = new Agenda();
                yield agenda.connect();

                let testVariable = null;
                agenda.agenda.define('should set variable', (job, done) => {

                    const data = job.attrs.data;
                    testVariable = data.value;
                    done();
                });

                yield agenda.start();

                agenda.agenda.now('should set variable', { value: 'hahahaha' });

                yield internals.wait(250);

                expect(testVariable).to.equal('hahahaha');

                yield agenda.disconnect();

                expect(agenda.agenda).to.be.null;
            }
            catch (e) {
                exception = e;
            }

            expect(exception).to.equal(null);
        });
    });


});
