/**
 * Standard library imports
*/

var WorkerType, cluster, os, util, _;

cluster = require('cluster');

util = require('util');

os = require('os');

/**
 * 3rd library imports
*/


_ = require('lodash');

module.exports = WorkerType = (function() {
  var defaultConfig, _log;

  defaultConfig = {
    count: os.cpus().length,
    shutdownTimeout: 10000
  };

  _log = function(type, msg) {
    return util.log(msg);
  };

  /**
   * create a new WorkerType instance
   *
   * @memberOf global
   *
   * @constructor
   * @this {WorkerType}
  */


  function WorkerType() {
    if (typeof process.logger === 'object') {
      _log = function(type, msg) {
        return process.logger[type](msg);
      };
    }
  }

  WorkerType.prototype.init = function(config) {
    var item, self, workers, _i, _ref, _results,
      _this = this;
    self = this;
    this.config = _.defaults(config, defaultConfig);
    workers = [];
    _results = [];
    for (item = _i = 1, _ref = this.config.count; 1 <= _ref ? _i <= _ref : _i >= _ref; item = 1 <= _ref ? ++_i : --_i) {
      _results.push((function() {
        config = _this.config;
        return cluster.fork({
          'WORKER_CONFIG': JSON.stringify(_this.config)
        }).on('message', function(msg) {
          if (msg.type === 'worker-exception') {
            _log.call(self, 'notice', util.format('%s with pid %s was informed of worker-exception, shutdown all workers', config.title, process.pid));
            return cluster.disconnect();
          }
        }).on('online', function() {
          return _log.call(self, 'notice', util.format('%s with pid %s is online', self.config.title, this.process.pid));
        }).on('exit', function(worker, code, signal) {
          _log.call(self, 'notice', util.format('%s with pid %s exits now', self.config.title, this.process.pid));
          return cluster.disconnect();
        }).on('disconnect', function() {
          return _log.call(self, 'notice', util.format('%s with pid %s is disconnected', self.config.title, this.process.pid));
        });
      })());
    }
    return _results;
  };

  return WorkerType;

})();
