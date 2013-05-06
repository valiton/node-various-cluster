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
  var _log;

  _log = function(type, msg) {
    return util.log(msg);
  };

  /**
   * create a new VariousCluster instance,
   *
   * @memberOf global
   *
   * @constructor
   * @param {object} config read more about config options in README
   * @private
   * @this {VariousCluster}
  */


  function VariousCluster() {
    if (typeof process.logger === 'object') {
      _log = function(type, msg) {
        return process.logger[type](msg);
      };
    }
  }

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
      cluster.on('exit', function(msg) {
        _log.call(_this, 'notice', util.format('%s with pid %s has no workers remaining, exit after %s uptime', _this.config.title, process.pid, prettySeconds(process.uptime())));
        return process.exit(0);
      });
      cluster.on('message', function(msg) {
        if (msg === 'worker-exception') {
          _log.call(_this, 'notice', util.format('%s with pid %s was informed of worker-exception, shutdown all workers: %s', _this.config.title, process.pid, err));
          return cluster.disconnect();
        }
      });
      process.on('uncaughtException', function(err) {
        _log.call(_this, 'crit', util.format('%s with pid %s had uncaught exception, shutdown all workers: %s', _this.config.title, process.pid, err));
        return cluster.disconnect();
      });
      ['SIGINT', 'SIGTERM'].forEach(function(signal) {
        return process.on(signal, function() {
          _log.call(_this, 'notice', util.format('%s with pid %s received signal %s, shutdown all workers', _this.config.title, process.pid, signal));
          return cluster.disconnect();
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
