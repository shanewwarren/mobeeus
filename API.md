# 1.0.x API Reference

* [Registration](#registration "Registration")
  * [Mobeeus](#mobeeus "Mobeeus")
    * [`mobeeus.queue(options)`](#mobeeusqueueoptions)
    * [`mobeeus.serverQueue(options)`](#mobeeusserverqueueoptions)
    * [`mobeeus.task(options)`](#mobeeustaskoptions)
    * [`mobeeus.job(options)`](#mobeeusjoboptions)

* [Server](#server)
  * [Dispatcher](#dispatcher "Dispatcher")
    * [`server.dispatcher.task(name, [payload], next)`](#serverdispatchertask "task")
    * [`server.dispatcher.every(interval, name, [payload], next)`](#dispatchEveryJob "every")
    * [`server.dispatcher.schedule(when, name, [payload], next)`](#dispatchScheduleJob "schedule")
    * [`server.dispatcher.now(name, [payload], next)`](#dispatchNowJob "now")
    * [`server.dispatcher.agenda`](#accessAgenda "agenda")
* [Client](#client)

## Registration

The **mobeeus** plugin uses the standard registration process using the `server.register()` method.  The plugin accepts the following registration options:

* `register` - takes a function or an array of functions with a signature of `function(mobeeus)`.  Each function is passed the [`mobeus`](#mobeeus) object which supports registering queues, tasks, and jobs.
* `state` - optional parameter that populates the `context` of a `task` or `job` with the following supported values:
  * a function with the signature `function(cb)`.  The callback must return an `object`.
  * an object.
* `rabbitmq` - optional object to specify RabbitMQ specific uri or socket settings.
    * `uri`
      * `host` - The host to which the underlying TCP connection is made. Defaults to `localhost`.
      * `port` - The port number to which the underlying TCP connection is made. Defaults to `5672`.
      * `username` - User name part of credentials to access a connection which has been secured.
      * `password` - Password part of credentials to access a connection which has been secured.
      * `vhost` - Virtual-host field.
      * `frameMax` -  The size in bytes of the maximum frame allowed over the connection.
                    0 means no limit (but since frames have a size field which is an unsigned
                    32 bit integer, it's perforce 2^32 - 1); I default it to 0x1000,
                    i.e. 4kb, which is the allowed minimum, will fit many purposes, and
                    not chug through Node.JS's buffer pooling.
      * `channelMax` - The maximum number of channels allowed. Default is `0`, meaning `2^16 - 1`.
      * `heartbeat` - The period of the connection heartbeat, in seconds.  Defaults to `0`, meaning no heartbeat.
      * `locale` - The desired locale for error messages.  RabbitMQ only ever uses `en_US`; which, happily, is the default.
    * `socket`
      * `cert` - Client certificate as a buffer
      * `key` - Client key as a buffer
      * `passphrase` - Passphrase for key
      * `ca` - Array of trusted CA certs as buffers
      * `noDelay` - If the value is true, this sets TCP_NODELAY on the underlying socket.

* `mongodb` - optional object to specify MongoDB connection settings.
    * `host` - Hostname of running MongoDB service.  Defaults to `127.0.0.1`.
    * `port` - Port of running MongoDB service.  Defaults to `27017`.

### Mobeeus

Mobeeus is the object provided to all functions passed to the `register`.  It provides the following methods:

#### `mobeeus.queue(options)`

Registers a task queue.  The server & client can publish tasks on the queue, but only the client can consume tasks.

- `options`
  - `name` - Name of the queue
  - `durable` - If true, the queue will survive broker restarts, modulo
      the effects of exclusive and autoDelete; this defaults
      to `true` if not supplied, unlike the others.
  - `exclusive` - If true, scopes the queue to the connection (defaults to false)
  - `autoDelete` -  If true, the queue will be deleted when the number of consumers drops to zero. Defaults to `false`.
  - `arguments` - Additional arguments, usually parameters for some kind of broker-specific extension e.g., high availability, TTL.
    - `messageTtl` - Expires messages arriving in the queue after n milliseconds
    - `expires` - The queue will be destroyed after n milliseconds of disuse,
          where use means having consumers, being declared (asserted or
          checked, in this API), or being polled with a #get.
    - `deadLetterExchange` - An exchange to which messages discarded from the queue will be resent.
          Use deadLetterRoutingKey to set a routing key for discarded messages;
          otherwise, the message's routing key (and CC and BCC, if present)
          will be preserved. A message is discarded when it expires or is rejected
          or nacked, or the queue limit is reached.
    - `maxLength` - Sets a maximum number of messages the queue will hold.
          Old messages will be discarded (dead-lettered if that's set) to make
          way for new messages.
    - `maxPriority` - Makes the queue a priority queue.


#### `mobeeus.serverQueue(options)`

Registers a server task queue.  The server consume tasks on the queue and the client can publishes tasks.

- `options`
  - `name` - Name of the queue
  - `durable` - If true, the queue will survive broker restarts, modulo
      the effects of exclusive and autoDelete; this defaults
      to `true` if not supplied, unlike the others.
  - `exclusive` - If true, scopes the queue to the connection (defaults to false)
  - `autoDelete` -  If true, the queue will be deleted when the number of consumers drops to zero. Defaults to `false`.
  - `arguments` - Additional arguments, usually parameters for some kind of broker-specific extension e.g., high availability, TTL.
    - `messageTtl` - Expires messages arriving in the queue after n milliseconds
    - `expires` - The queue will be destroyed after n milliseconds of disuse,
          where use means having consumers, being declared (asserted or
          checked, in this API), or being polled with a #get.
    - `deadLetterExchange` - An exchange to which messages discarded from the queue will be resent.
          Use deadLetterRoutingKey to set a routing key for discarded messages;
          otherwise, the message's routing key (and CC and BCC, if present)
          will be preserved. A message is discarded when it expires or is rejected
          or nacked, or the queue limit is reached.
    - `maxLength` - Sets a maximum number of messages the queue will hold.
          Old messages will be discarded (dead-lettered if that's set) to make
          way for new messages.
    - `maxPriority` - Makes the queue a priority queue.

#### `mobeeus.task(options)`

Registers a task.  Provides the [`server.dispatcher`](#dispatcher) the ability to dispatch a task with the same name.  The `handler` is run on the client.

- `options`
  - `name` - Name of the the task.
  - `queue` - Name of the queue this task belongs to.
  - `handler` - a function with the signature `function(context, payload, next)` where:
    - `context` - an object that contains a reference to the [`Dispatcher`](#dispatcher) merged with the state provided in the `state` option of the plugin.
    - `payload` - the validated data payload for the task.
    - `next` - the continuation method required to complete the task.
  - `config` - If true, scopes the queue to the connection (defaults to false)
    - `validate`
      - `payload` - optional Joi schema used to validate the task payload.

#### `mobeeus.job(options)`

Registers a job.  Provides the [`server.dispatcher`](#dispatcher) the ability to dispatch jobs with the same name.  When a scheduled job is triggered the `handler` is run on the client.

- `options`
  - `name` - Name of the the job.
  - `handler` - a function with the signature `function(context, job, next)` where:
    - `context` - an object that contains a reference to the [`Dispatcher`](#dispatcher) merged with the state provided in the `state` option of the plugin.
    - `job` - Agenda.js `job` model.
      - `attrs`
        - `data` - the validated data payload for the job.
      -  additional options and methods can be found at: [https://github.com/rschmukler/agenda#manually-working-with-a-job](https://github.com/rschmukler/agenda#manually-working-with-a-job).
    - `next` - the continuation method required to complete the task.
  - `config` - If true, scopes the queue to the connection (defaults to false)
    - `validate`
      - `payload` - optional Joi schema used to validate the task payload.

## Server

The plugin decorates the server with the [`dispatcher`](#dispatcher) allows the server to schedule jobs or queue tasks.

### Dispatcher

#### `server.dispatcher.task(name, [payload], next)`

Queues a task, where:

- `name` - Name of the the job.
- `payload` - optional data to send to the task.
- `next` - the continuation method required.


#### `server.dispatcher.every(interval, name, [payload], next)`

Schedules a job to run on a repeated interval, where:

- `interval` - a [Human Interval](https://github.com/rschmukler/human-interval) that defines how often the job will run.
- `name` - Name of the the job.
- `payload` - optional data to send to the task.
- `next` - the continuation method required.

#### `server.dispatcher.schedule(when, name, [payload], next)`

Schedules a job to run once later, where:

- `when` - is a [Human Interval](https://github.com/rschmukler/human-interval) that defines when the job will run.
- `name` - Name of the the job.
- `payload` - data to send to the task.
- `next` - the continuation method required.

#### `server.dispatcher.now(name, [payload], next)`

Schedules a job to run now, where:

- `name` - Name of the the job.
- `payload` - data to send to the task.
- `next` - the continuation method required.

#### `server.dispatcher.agenda`

Access to the underlying [Agenda.js](https://github.com/rschmukler/agenda) object.  Useful for when you may want to query/delete/update existing jobs.
