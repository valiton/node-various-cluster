###*
 * Standard library imports
###
cluster = require 'cluster'
util = require 'util'
os = require 'os'

###*
 * 3rd library imports
###
_ = require 'lodash'


module.exports = class WorkerType

  defaultConfig =
    count: os.cpus().length
    shutdownTimeout: 10000


  _log = (type, msg) ->
    util.log msg


  ###*
   * create a new WorkerType instance
   *
   * @memberOf global
   *
   * @constructor
   * @this {WorkerType}
  ###
  constructor: ->
    if typeof process.logger is 'object'
      _log = (type, msg) -> process.logger[type](msg)


  init: (config) ->
    self = this

    @config = _.defaults config, defaultConfig
    workers = []
    for item in [1..@config.count]
      do =>
        config = @config
        cluster.fork('WORKER_CONFIG': JSON.stringify(@config))

          .on 'message', (msg) ->
            if msg.type is 'worker-exception'
              _log.call self, 'notice', util.format('%s with pid %s was informed of worker-exception, shutdown all workers', config.title, process.pid)
              cluster.disconnect()

          .on 'online', ->
            _log.call self, 'notice', util.format('%s with pid %s is online', self.config.title, @process.pid)

          .on 'exit', (worker, code, signal) ->
            _log.call self, 'notice', util.format('%s with pid %s exits now', self.config.title, @process.pid)
            cluster.disconnect()

          .on 'disconnect', ->
            _log.call self, 'notice', util.format('%s with pid %s is disconnected', self.config.title, @process.pid)



