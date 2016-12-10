'use strict';

// Load modules

exports = module.exports = function (mobeeus) {

    mobeeus.job({
        name: 'five-second-report',
        handler: (context, job, done) => {

            const data = context.api.getData();
            const keys = Object.keys(data);

            console.log('GENERATED REPORT:');
            for (const key of keys) {
                console.log(key, data[key].join(', '));
            }
            console.log('\n');

            done();
        }
    });
};

