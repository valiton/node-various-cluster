###*
 * @name various-cluster
 * @description easily create a mulit-cluster environment with different worker-types
 * @author Valiton GmbH, Bastian "hereandnow" Behrens
###

###*
 * Standard library imports
###
cluster = require 'cluster'
util = require 'util'


###*
 * 3rd library imports
###
prettySeconds = require 'pretty-seconds'
_ = require 'lodash'


###
 * Local imports
###
WorkerType = require './worker-type'
Worker = require './worker'


class VariousCluster

  _log = (type, msg) ->
    util.log msg


  ###*
   * create a new VariousCluster instance,
   *
   * @memberOf global
   *
   * @constructor
   * @param {object} config read more about config options in README
   * @private
   * @this {VariousCluster}
  ###
  constructor: ->
    if typeof process.logger is 'object'
      _log = (type, msg) -> process.logger[type](msg)

  ###*
   * initalize the VariousCluster with the given config
   *
   * @param {object} config read more about config options in README
   * @function global.VariousCluster.prototype.init
   * @returns {this} the current instance for chaining
  ###
  init: (@config) ->

    if cluster.isMaster
      process.title = @config.title or 'various-cluster-master'

      cluster.on 'exit', (msg) =>
        _log.call this, 'notice', util.format('%s with pid %s has no workers remaining, exit after %s uptime', @config.title, process.pid, prettySeconds(process.uptime()))
        return process.exit 0

      cluster.on 'message', (msg) =>
        if msg is 'worker-exception'
          _log.call this, 'notice', util.format('%s with pid %s was informed of worker-exception, shutdown all workers: %s', @config.title, process.pid, err)
          cluster.disconnect()

      process.on 'uncaughtException', (err) =>
        _log.call this, 'crit', util.format('%s with pid %s had uncaught exception, shutdown all workers: %s', @config.title, process.pid, err)
        cluster.disconnect()

      ['SIGINT', 'SIGTERM'].forEach (signal) =>
        process.on signal, =>
          _log.call this, 'notice', util.format('%s with pid %s received signal %s, shutdown all workers', @config.title, process.pid, signal)
          cluster.disconnect()

      for workerConfig in @config.workers

        defaultWorkerTypeConfig =
          count: @config.count
          shutdownTimeout: @config.shutdownTimeout
          title: 'various-cluster-worker'

        new WorkerType().init _.defaults(workerConfig, defaultWorkerTypeConfig)


    else if cluster.isWorker
      new Worker().init()

    this

module.exports = new VariousCluster()
