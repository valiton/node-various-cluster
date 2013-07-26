/**
 * @name various-cluster
 * @description easily create a mulit-cluster environment with different worker-types
 * @author Valiton GmbH, Bastian "hereandnow" Behrens
*/

/**
 * Standard library imports
*/

var VariousCluster, Worker, WorkerType, cluster, prettySeconds, util, _;

cluster = require('cluster');

util = require('util');

/**
 * 3rd library imports
*/


prettySeconds = require('pretty-seconds');

_ = require('lodash');

/*
 * Local imports
*/


WorkerType = require('./worker-type');

Worker = require('./worker');

VariousCluster = (function() {
  var _exit, _log;

  function VariousCluster() {}

  _log = function(type, msg) {
    if (typeof process.logger === 'object') {
      return process.logger[type](msg);
    }
    return util.log(msg);
  };

  _exit = function() {
    var workers;
    process.shuttingDown = true;
    workers = Object.keys(cluster.workers).length;
    if (workers === 0) {
      _log.call(this, 'notice', util.format('%s with pid %s has no workers remaining, exit after %s uptime', this.config.title, process.pid, prettySeconds(process.uptime())));
      return process.exit(0);
    } else {
      return _log.call(this, 'notice', util.format('%s with pid %s waits for %s workers to shutdown', this.config.title, process.pid, workers));
    }
  };

  /**
   * initalize the VariousCluster with the given config
   *
   * @param {object} config read more about config options in README
   * @function global.VariousCluster.prototype.init
   * @returns {this} the current instance for chaining
  */


  VariousCluster.prototype.init = function(config) {
    var defaultWorkerTypeConfig, workerConfig, _i, _len, _ref,
      _this = this;
    this.config = config;
    if (cluster.isMaster) {
      process.title = this.config.title || 'various-cluster-master';
      cluster.on('exit', function(worker, code, signal) {
        return process.nextTick(function() {
          return _exit.call(_this);
        });
      });
      process.on('uncaughtException', function(err) {
        var key, worker, _ref, _results;
        _log.call(_this, 'crit', util.format('%s with pid %s had uncaught exception, shutdown all workers: %s', _this.config.title, process.pid, err.stack));
        _exit.call(_this);
        _ref = cluster.workers;
        _results = [];
        for (key in _ref) {
          worker = _ref[key];
          _results.push(worker.send({
            type: 'shutmedown'
          }));
        }
        return _results;
      });
      ['SIGINT', 'SIGTERM'].forEach(function(signal) {
        return process.on(signal, function() {
          var key, worker, _ref, _results;
          _log.call(_this, 'notice', util.format('%s with pid %s received signal %s, shutdown all workers', _this.config.title, process.pid, signal));
          _exit.call(_this);
          _ref = cluster.workers;
          _results = [];
          for (key in _ref) {
            worker = _ref[key];
            _results.push(worker.send({
              type: 'shutmedown'
            }));
          }
          return _results;
        });
      });
      _ref = this.config.workers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        workerConfig = _ref[_i];
        defaultWorkerTypeConfig = {
          count: this.config.count,
          shutdownTimeout: this.config.shutdownTimeout,
          title: 'various-cluster-worker'
        };
        new WorkerType().init(_.defaults(workerConfig, defaultWorkerTypeConfig));
      }
    } else if (cluster.isWorker) {
      new Worker().init();
    }
    return this;
  };

  return VariousCluster;

})();

module.exports = new VariousCluster();
