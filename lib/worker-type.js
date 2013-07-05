/**
 * Standard library imports
*/

var WorkerType, cluster, os, prettySeconds, util, _;

cluster = require('cluster');

util = require('util');

os = require('os');

/**
 * 3rd library imports
*/


prettySeconds = require('pretty-seconds');

_ = require('lodash');

module.exports = WorkerType = (function() {
  var defaultConfig, _fork, _log;

  defaultConfig = {
    count: os.cpus().length,
    shutdownTimeout: 10000
  };

  _log = function(type, msg) {
    if (typeof process.logger === 'object') {
      return process.logger[type](msg);
    }
    return util.log(msg);
  };

  _fork = function(config) {
    var self;
    self = this;
    return cluster.fork({
      'WORKER_CONFIG': JSON.stringify(config)
    }).on('message', function(msg) {
      if (msg === 'worker-exception') {
        return this.destroy();
      }
    }).on('online', function() {
      return _log.call(self, 'notice', util.format('%s with pid %s is online', self.config.title, this.process.pid));
    }).on('exit', function(worker, code, signal) {
      var _this = this;
      delete process.logger;
      _log.call(self, 'notice', util.format('%s with pid %s exits now', self.config.title, this.process.pid));
      if (self.config.shutdownAll === true) {
        _log.call(self, 'notice', util.format('worker %s is configured to shutdown app, do this now', config.title));
        return cluster.disconnect(function() {
          _log.call(_this, 'notice', util.format('%s with pid %s has no workers remaining, exit after %s uptime', config.title, process.pid, prettySeconds(process.uptime())));
          return process.exit(0);
        });
      }
      if (!process.shuttingDown) {
        return process.nextTick(function() {
          _log.call(self, 'notice', util.format('master with pid %s will restart this worker now', this.process.pid));
          return _fork.call(self, config);
        });
      }
    }).on('disconnect', function() {
      return _log.call(self, 'notice', util.format('%s with pid %s is disconnected', self.config.title, this.process.pid));
    });
  };

  /**
   * create a new WorkerType instance
   *
   * @memberOf global
   *
   * @constructor
   * @this {WorkerType}
  */


  function WorkerType() {}

  WorkerType.prototype.init = function(config) {
    var item, workers, _i, _ref, _results,
      _this = this;
    this.config = _.defaults(config, defaultConfig);
    workers = [];
    _results = [];
    for (item = _i = 1, _ref = this.config.count; 1 <= _ref ? _i <= _ref : _i >= _ref; item = 1 <= _ref ? ++_i : --_i) {
      _results.push((function() {
        return _fork.call(_this, _this.config);
      })());
    }
    return _results;
  };

  return WorkerType;

})();
