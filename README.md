![mobeeus Text](https://github.com/shanewwarren/mobeeus/raw/master/images/mobeeus.png)

![mobeeus Logo](https://github.com/shanewwarren/mobeeus/raw/master/images/mobeeus.gif)

Hapi.js plugin and client module/executable to handle queueing and scheduling of background jobs.

# Documentation

[**API Documentation**](API.md)

# Example

## This example produces

```bash
> node ./index & mobeeus -f ./worker.js

[46385] Hello from the Worker.
[46380] Hello from the Server.
```

### server.js

```js
'use strict';

// Load modules
const Hapi = require('hapi');
const Hoek = require('hoek');
const Mobeeus = require('mobeeus');

const Simple = require('./queues/simple');
const Server = require('./queues/server');

const server = new Hapi.Server();
server.connection({ port: 3000 });

const mobeeus = {
    register: Mobeeus,
    options: {

        // Register the two queues on the server.
        register: [Simple, Server],

        // State can be an object or a function that returns
        // an object.  State is provided as the 'context' to
        // a task or a job.
        state: (done) => {

            return done(null, { subject: 'Server' });
        }
    }
};

// Register the plugin.
server.register(mobeeus, (err) => {

    Hoek.assert(!err, err);

    // Start the server.
    server.start((err) => {

        Hoek.assert(!err, err);

        // Dispatch 'simple-task' from the server.
        server.dispatcher.task('simple-task', { greeting: 'Hello from the' }, (err) => {

            Hoek.assert(!err, err);
            setTimeout(() => {

                server.stop((err) => {

                    Hoek.assert(!err, err);
                });
            }, 500);
        });
    });
});
```

### worker.js

```js
'use strict';

// Load modules
const Simple = require('./queues/simple');
const Server = require('./queues/server');

exports = module.exports = {

    register: [Simple, Server],
    state: (done) => {

        return done(null, { subject: 'Worker' });
    }
};
```


### queues/simple.js

```js
'use strict';

// Load modules

const Joi = require('joi');
const Process = require('process');

exports = module.exports = function (mobeeus) {

    // Define the queue.
    mobeeus.queue({
        name: 'simple-queue'
    });

    // Define a task that uses the queue.
    mobeeus.task({
        queue: 'simple-queue',
        name: 'simple-task',
        handler: (context, payload, done) => {

            // this will run on the worker.
            console.log(`[${Process.pid}] ${payload.greeting} ${context.subject}.`);

            // dispatch a task to the server.
            context.dispatcher.task('server-task', payload, done);

        },
        config: {
            validate: {
                payload: {
                    greeting: Joi.string().required()
                }
            }
        }
    });
};
```

### queues/server.js

```js
'use strict';

// Load modules

const Joi = require('joi');
const Process = require('process');

exports = module.exports = function (mobeeus) {

    // Define a 'server' queue.  Meaning server consumes tasks.
    mobeeus.serverQueue({
        name: 'server-queue'
    });

    // Define a task that will run on the server.
    mobeeus.task({
        queue: 'server-queue',
        name: 'server-task',
        handler: (context, payload, done) => {

            // this will run on the server.
            console.log(`[${Process.pid}] ${payload.greeting} ${context.subject}.`);
            done();
        },
        config: {
            validate: {
                payload: {
                    greeting: Joi.string().required()
                }
            }
        }
    });
};
```
