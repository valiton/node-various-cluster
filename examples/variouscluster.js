// run this from your project-directory like this (you need to npm install first):
// $ node examples/various-cluster.js

var variouscluster = require(process.cwd() + '/lib/various-cluster');

variouscluster.init({
  title: 'title of your master process',
  count: 2, // fallback for workers with no count defined
  shutdownTimout: 10000, // fallback for workers with no shutdownTimout defined
  workers: [
    {
      title: 'some-worker',  // title of this worker process
      exec: './examples/some-worker.js', // location of your worker to be executed
      count: 1, // number of process to be spawned
      shutdownTimeout: 1000, // how long thisw workertype has time to shutdown
      config: {} // add some worker-config right here
    },
    {
      title: 'another-worker',
      exec: './examples/another-worker.js',
      count: 1,
      shutdownTimeout: 1000,
      config: {}
    }
  ]
});