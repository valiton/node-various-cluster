###*
 * Standard library imports
###
path = require 'path'
util = require 'util'

###*
 * 3rd library imports
###
_ = require 'lodash'

module.exports = class Worker

  _log = (type, msg) ->
    if typeof process.logger is 'object'
      return process.logger[type](msg)
    util.log msg


  _shutdown = ->
    _log.call this, 'notice', util.format('%s with pid %s will start graceful shutdown',  @config.title, process.pid)
    shutDowns = process.listeners('shutdown').length
    if shutDowns is 0
      _log.call this, 'notice', util.format('%s with pid %s is done with graceful shutdown, exit now', @config.title, process.pid)
      return process.exit 0

    sdt = setTimeout =>
      _log.call this, 'crit', util.format('%s with pid %s could not graceful shutdown, forced exit after %s ms',  @config.title, process.pid, @config.shutdownTimeout)
      process.exit 1
    , @config.shutdownTimeout


    process.emit 'shutdown', =>
      if --shutDowns is 0
        clearTimeout sdt
        _log.call this, 'notice', util.format('%s with pid %s is done with graceful shutdown, exit now', @config.title, process.pid)
        process.exit 0


  _requireModule = ->
    if typeof @config.exec isnt 'string'
      throw new Error util.format('no exec-property defined in config: %j', @config)
    mod = require path.join(process.cwd(), @config.exec)
    new mod(@config.config).init?() if typeof mod is 'function'


  _appendEvents = ->
    @connected = true
    process.on 'message', (msg) =>
      if msg.type is 'shutmedown'
        process.shuttingDown = true
        @connected = false
        _shutdown.call this

    process.on 'uncaughtException', (err) =>
      if @connected
        _log.call this, 'crit', util.format('%s with pid %s had uncaught exception: %s', @config.title, process.pid, err.stack)
        process.send 'worker-exception'
      else
        process.exit()

    ['SIGINT', 'SIGTERM'].forEach (signal) =>
      process.on signal, => _log.call this, 'notice', util.format('%s with pid %s received signal %s', @config.title, process.pid, signal)


  ###*
   * create a new Worker instance
   *
   * @memberOf global
   *
   * @constructor
   * @this {Worker}
  ###
  constructor: ->
    @config = JSON.parse process.env.WORKER_CONFIG
    if typeof @config isnt 'object'
      throw new Error 'WORKER_CONFIG is missing'
    process.title = process.variousCluster = @config.title


  init: () ->
    _requireModule.call this
    _appendEvents.call this







