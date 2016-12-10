'use strict';

// Load modules

const expect = require('chai').expect;
const Agenda = require('../lib/agenda');

// Declare internals

const internals = {};

// Tests

describe('Agenda', () => {

    it('should open a connection by using defaults', (finished) => {

        const agenda = new Agenda({}, true);
        agenda.start((err) => {

            expect(err).to.not.exist;
            finished();
        });
    });

    it('should open, start, then disconnect.', (finished) => {


        const agenda = new Agenda({}, true);
        agenda.start((err) => {

            expect(err).to.not.exist;

            agenda.stop((err) => {

                expect(err).to.not.exist;
                finished();
            });
        });

    });

    it('should define a simple job and execute it.', (finished) => {

        const agenda = new Agenda({}, true);

        let testVariable = null;
        agenda.defineJob({
            name: 'should set variable',
            handler: (job, done) => {

                const data = job.attrs.data;
                testVariable = data.value;
                done();
            }
        });

        agenda.start((err) => {

            expect(err).to.not.exist;
            agenda.runJob({
                name: 'should set variable',
                payload: { value: 'hahahaha' },
                type: 'now'
            }, (err) => {

                expect(err).to.not.exist;
                setTimeout(() => {

                    agenda.stop((err) => {

                        expect(err).to.not.exist;
                        expect(testVariable).to.equal('hahahaha');
                        finished();
                    });
                }, 250);
            });
        });
    });


});
