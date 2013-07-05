###*
 * Standard library imports
###
cluster = require 'cluster'
util = require 'util'
os = require 'os'

###*
 * 3rd library imports
###
prettySeconds = require 'pretty-seconds'
_ = require 'lodash'


module.exports = class WorkerType

  defaultConfig =
    count: os.cpus().length
    shutdownTimeout: 10000


  _log = (type, msg) ->
    if typeof process.logger is 'object'
      return process.logger[type](msg)
    util.log msg


  _fork = (config) ->
    self = this
    cluster.fork('WORKER_CONFIG': JSON.stringify(config))

      .on 'message', (msg) ->
        if msg is 'worker-exception'
          @destroy()
      .on 'online', ->
        _log.call self, 'notice', util.format('%s with pid %s is online', self.config.title, @process.pid)

      .on 'exit', (worker, code, signal) ->
        delete process.logger
        _log.call self, 'notice', util.format('%s with pid %s exits now', self.config.title, @process.pid)
        if self.config.shutdownAll is true
          _log.call self, 'notice', util.format('worker %s is configured to shutdown app, do this now', config.title)
          return cluster.disconnect =>
            _log.call this, 'notice', util.format('%s with pid %s has no workers remaining, exit after %s uptime', config.title, process.pid, prettySeconds(process.uptime()))
            process.exit 0

        unless process.shuttingDown
          process.nextTick ->
            _log.call self, 'notice', util.format('master with pid %s will restart this worker now', @process.pid)
            _fork.call self, config


      .on 'disconnect', ->
        _log.call self, 'notice', util.format('%s with pid %s is disconnected', self.config.title, @process.pid)


  ###*
   * create a new WorkerType instance
   *
   * @memberOf global
   *
   * @constructor
   * @this {WorkerType}
  ###
  constructor: ->


  init: (config) ->
    @config = _.defaults config, defaultConfig
    workers = []
    for item in [1..@config.count]
      do =>
        _fork.call this, @config


