
function AnotherWorker(config) {
  this.config = config;
}

// this is directly called after creating this worker from various-cluster
// so you should start your worker logic in this method!
AnotherWorker.prototype.init = function () {
  console.log('init was called, start this AnotherWorker');
  process.on('shutdown', function (done) {
    // do whatever you want this worker to cleanup when your application will be shutdown
    // and call done when you are finished:
    done();
  });
}

module.exports = AnotherWorker;