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
      var key, _ref, _results;
      delete process.logger;
      _log.call(self, 'notice', util.format('%s with pid %s exits now', self.config.title, this.process.pid));
      if (!!self.config.shutdownAll) {
        process.shuttingDown = true;
        _log.call(self, 'notice', util.format('worker %s is configured to shutdown app, do this now', config.title));
        _ref = cluster.workers;
        _results = [];
        for (key in _ref) {
          worker = _ref[key];
          _results.push(worker.send({
            type: 'shutmedown'
          }));
        }
        return _results;
      } else {
        if (!process.shuttingDown) {
          return process.nextTick(function() {
            _log.call(self, 'notice', util.format('master with pid %s will restart this worker now', this.process.pid));
            return _fork.call(self, config);
          });
        }
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
    if (this.config.count > 0) {
      _results = [];
      for (item = _i = 1, _ref = this.config.count; 1 <= _ref ? _i <= _ref : _i >= _ref; item = 1 <= _ref ? ++_i : --_i) {
        _results.push((function() {
          return _fork.call(_this, _this.config);
        })());
      }
      return _results;
    }
  };

  return WorkerType;

})();
