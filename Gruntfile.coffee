# Basic vInsight-lib-module configuration
module.exports = (grunt) ->

  grunt.initConfig

    pkg: grunt.file.readJSON('package.json')

    coffeelint:
      app: ["src/**/*.coffee"]
      options:
        max_line_length:
          value: 1000
          level: "error"

    clean:
      files:
        src: ["lib", "doc"]

      spec:
        src: ["spec-lib"]

    coffee:
      compile:
        options:
          bare: true
        files: [
          {expand: true, cwd: './src', src: ['**/*.coffee'], dest: './lib', ext: '.js'},
          {expand: true, cwd: './spec', src: ['**/*.coffee'], dest: './spec-lib', ext: '.spec.js'}
        ]

    jsdoc:
      dist:
        src: ['lib/*.js'],
        options:
          destination: 'doc'



  grunt.loadNpmTasks "grunt-coffeelint"
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-jsdoc"

  grunt.registerTask "default", ["clean", "coffee", "jsdoc"]