/*
 * grunt-combine-media-queries
 * https://github.com/buildingblocks/grunt-combine-media-queries
 *
 * Copyright (c) 2013 John Cashmore
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      all: ['Gruntfile.js', 'tasks/*.js'],
      options: {
        jshintrc: '.jshintrc'
      },
    },
    clean: {
      tests: ['tmp']
    },
    cmq: {
      options: {
        log: true
      },
      your_target: {
        files: {
          'tmp': ['test/test3.css']
        }
      },
      dynamic: {
        expand: true,
        cwd: 'test/',
        src: ['test6.css'],
        dest: 'tmp/'
      }
    }

  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['clean', 'jshint', 'cmq']);

};
