/**
 * Standard library imports
*/

var Worker, path, util, _;

path = require('path');

util = require('util');

/**
 * 3rd library imports
*/


_ = require('lodash');

module.exports = Worker = (function() {
  var _appendEvents, _log, _requireModule, _shutdown;

  _log = function(type, msg) {
    return util.log(msg);
  };

  _shutdown = function() {
    var sdt, shutDowns,
      _this = this;
    _log.call(this, 'notice', util.format('%s with pid %s will start graceful shutdown', this.config.title, process.pid));
    shutDowns = process.listeners('shutdown').length;
    if (shutDowns === 0) {
      return _log.call(this, 'notice', util.format('%s with pid %s is done with graceful shutdown, exit now', this.config.title, process.pid));
    }
    sdt = setTimeout(function() {
      _log.call(_this, 'crit', util.format('%s with pid %s could not graceful shutdown, forced exit after %s ms', _this.config.title, process.pid, _this.config.shutdownTimeout));
      return process.exit(1);
    }, this.config.shutdownTimeout);
    return process.emit('shutdown', function() {
      if (--shutDowns === 0) {
        clearTimeout(sdt);
        _log.call(_this, 'notice', util.format('%s with pid %s is done with graceful shutdown, exit now', _this.config.title, process.pid));
        return process.exit(0);
      }
    });
  };

  _requireModule = function() {
    var mod, _base;
    if (typeof this.config.exec !== 'string') {
      throw new Error(util.format('no exec-property defined in config: %j', this.config));
    }
    mod = require(path.join(process.cwd(), this.config.exec));
    if (typeof mod === 'function') {
      return typeof (_base = new mod(this.config.config)).init === "function" ? _base.init() : void 0;
    }
  };

  _appendEvents = function() {
    var _this = this;
    this.connected = true;
    process.on('disconnect', function() {
      _this.connected = false;
      return _shutdown.call(_this);
    });
    process.on('uncaughtException', function(err) {
      if (_this.connected) {
        _log.call(_this, 'crit', util.format('%s with pid %s had uncaught exception: %s', _this.config.title, process.pid, err));
        return process.send('worker-exception');
      } else {
        return process.exit();
      }
    });
    return ['SIGINT', 'SIGTERM'].forEach(function(signal) {
      return process.on(signal, function() {
        return _log.call(_this, 'notice', util.format('%s with pid %s received signal %s', _this.config.title, process.pid, signal));
      });
    });
  };

  /**
   * create a new Worker instance
   *
   * @memberOf global
   *
   * @constructor
   * @this {Worker}
  */


  function Worker() {
    if (typeof process.logger === 'object') {
      _log = function(type, msg) {
        return process.logger[type](msg);
      };
    }
    this.config = JSON.parse(process.env.WORKER_CONFIG);
    if (typeof this.config !== 'object') {
      throw new Error('WORKER_CONFIG is missing');
    }
    process.title = process.variousCluster = this.config.title;
  }

  Worker.prototype.init = function() {
    _requireModule.call(this);
    return _appendEvents.call(this);
  };

  return Worker;

})();
