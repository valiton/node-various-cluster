# various-cluster

easily create a mulit-cluster environment with different worker-types.

if you need some messaging inside your worker-types, take a look at [msghub](https://npmjs.org/package/msghub)

## Why another Cluster-Module?

This is a thin wrapper around the node native [cluster module](http://nodejs.org/docs/latest/api/cluster.html). There are currently no cluster-module-wrappers out there, which will spawn different Worker-Types which are not necessarly some http-servers. also this module enables you to take full control of all shutdown-mechanisms.

## Getting Started

$ npm install various-cluster

require it in your code, and use it:

```javascript
var variouscluster = require('various-cluster');

variouscluster.init({
  title: 'title of your master process',
  count: 2, // fallback for workers with no count defined
  shutdownTimout: 10000, // fallback for workers with no shutdownTimout defined
  workers: [
    {
      title: 'some-worker',  // title of this worker process
      exec: 'lib/some-worker.js', // location of your worker to be executed
      count: 1, // number of process to be spawned
      shutdownTimeout: 1000, // how long thisw workertype has time to shutdown
      config: {} // add some worker-config right here
    },
    {
      title: 'another-worker',
      exec: 'lib/another-worker.js',
      count: 1,
      shutdownTimeout: 1000,
      config: {}
    }
  ]
});
```

## Documentation

api-docs: (open doc/index.html in your browser)

### Creation

create your environment with including various-cluster in your code and call the init-method with your cluster-config (see more about config below!)

```javascript
var yourConfig = {...};
var variouscluster = require('various-cluster');
variouscluster.init(yourConfig);
```

### Workerspecific Config and Initialization

you can also pass a workerspecific config to your workers, so you dont need to read the config manually in every process.

just follow this pattern:

```javascript
// in your master pass the workerconfig
variouscluster.init({
  ...
  workers: [
    {
      config: {
        "someKey": "someValue"
      }
    }
  ]
});
```

```javascript
// and in your worker create a constructor function receiving this config
function SomeWorker(config) {
  this.config = config;
}
```

```javascript
// and add an init-method to your Worker. This will instantly be called from various-cluster if present!
SomeWorker.prototype.init = function () {
  console.log(this.config.someKey); // will print 'someValue'
}
```

### Logging

various cluster will try to use a logger-instance which is appended to the current process. this logger instance needs a 'crit' and a 'notice' method. if no process.logger is present, it just uses node.js native [util.log()](http://nodejs.org/api/util.html#util_util_log_string)

```javascript
// in your master create a logger:
process.logger = {
  crit: function (msg) {
    console.error(msg);
  },
  notice: function (msg) {
    console.log(msg);
  }
};
```

### Shutdown

in every worker-process you can append a shutdown-Listener if you want to cleanup something in your application before shutting down:

```javascript
process.on('shutdown', function (done) {
  // clean up here and call the done-callback when finished
  done();
});
```
if the cleanup takes longer than in your config defined, the process will be forced to exit!

### uncaughtExceptions

per default if in the master an uncaught-exception happens, the whole application will gracefully shutdown.

if a worker has an uncaughtException, it depends on your configuration. per default this worker is gracefully shutdown and is reforked. if you
configure a workertype with the config-parameter 'shutdownAll: true', the whole application will gracefully shutdown.

### CONFIG which you provide in the init-method

#### config.title

process.title of the master process, DEFAULT: 'various-cluster-master'

#### config.count

workercount which should be used (if no count is given for a single worker this one is used), DEFAULT: os.cpus().length

#### config.shutdownTimeout

shutdownTimeout in ms (if no shutdownTimeout is given for a single worker this one is used), DEFAULT: 10000
...

#### config.workers

an array with all workers (see more below)


#### config.workers[x].title

process.title of the worker process, DEFAULT: 'various-cluster-worker'

#### config.workers[x].exec

the local module-file which should be executed, DEFAULT: undefined

#### config.workers[x].count

workercount which should be used, DEFAULT: config.count

#### config.workers[x].shutdownTimeout

shutdownTimeout in ms, DEFAULT: config.shutdownTimeout

#### config.workers[x].shutdownAll

shutdown all workertypes and workers if this worker has an uncaught exception, DEFAULT: false

#### config.workers[x].config

your workerspecific config DEFAULT: undefined

## Examples

see the examples-directory!

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Lint your code using [Grunt](http://gruntjs.com/)

## Release History

- 0.1.5 allow worker count to be 0

- 0.1.4 force exit when no shutdown-handler

- 0.1.3 fix clean shutdown

- 0.1.2 better exception handling + cleaner shutdown

- 0.1.1 Added some keywords

- 0.1.0 Initial Release

## Contributors

- Bastian "hereandnow" Behrens
- Gleb Kotov

## License
Copyright (c) 2013 Valiton GmbH
Licensed under the MIT license.

