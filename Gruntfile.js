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
    watch: {
      scripts: {
        files: ['Gruntfile.js', 'tasks/*.js'],
        tasks: ['clean', 'jshint', 'cmq']
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'tasks/*.js'],
      options: {
        jshintrc: '.jshintrc'
      },
    },
    clean: {
      tests: ['result']
    },
    cmq: {
      options: {
        log: true
      },
      your_target: {
        files: {
          'result/test.css': ['test/test3.css']
        }
      }
    }

  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['clean', 'jshint', 'cmq', 'watch']);

};