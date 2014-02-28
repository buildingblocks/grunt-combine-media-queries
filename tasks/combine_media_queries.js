/*
 * grunt-combine-media-queries
 * https://github.com/buildingblocks/grunt-combine-media-queries
 *
 * Copyright (c) 2013 John Cashmore
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('cmq', 'Find duplicate media queries and combines them.', function() {

    // Require stuff
    var parseCss = require('css-parse');
    var path = require('path');
    var error = true;

    // Default options
    var options = this.options({
      log: false,
      ext: false
    });

    // Log info only when 'options.log' is set to true
    var log = function(message){
      if (options.log){
        grunt.log.writeln(message);
      }
    };

    // Process media queries
    var processImportURL = function(importURL) {
      var strCss = '';
      strCss += '@import ' + importURL.import + ';';
      return strCss;
    };

    // Process comments
    var processComment = function(comment) {
      var strCss = '/*' + comment.comment + '*/';
      return strCss;
    };

    // Process declaration
    var processDeclaration = function(declaration) {
      var strCss = declaration.property + ': ' + declaration.value + ';';
      return strCss;
    };

    // Check declarations type
    var commentOrDeclaration = function(declarations) {
      var strCss = '';
      if(declarations.type === 'declaration'){
        strCss += '\n\t' + processDeclaration(declarations);
      } else if(declarations.type === 'comment'){
        strCss += ' ' + processComment(declarations);
      }
      return strCss;
    };

    // Process normal CSS rule
    var processRule = function(rule) {
      var strCss = '';
      strCss += rule.selectors.join(',\n') + ' {';
      rule.declarations.forEach(function (rules) {
        strCss += commentOrDeclaration(rules);
      });
      strCss += '\n}\n\n';
      return strCss;
    };

    // Check rule type
    var commentOrRule = function(rule) {
      var strCss = '';
      if (rule.type === 'rule') {
        strCss += processRule(rule);
      } else if (rule.type === 'comment') {
        strCss += processComment(rule) + '\n\n';
      }
      return strCss;
    };

    // Check keyframe type
    var commentOrKeyframe = function(frame){
      var strCss = '';
      if (frame.type === 'keyframe'){
        strCss += frame.values.join(',') + ' {';
        frame.declarations.forEach(function (declaration) {
          strCss += commentOrDeclaration(declaration);
        });
        strCss += '\n}\n\n';
      } else if (frame.type === 'comment'){
        strCss += processComment(frame) + '\n\n';
      }
      return strCss;
    };

    // Process media queries
    var processMedia = function(media) {
      var strCss = '';
      strCss += '@media ' + media.rule + ' {\n\n';
      media.rules.forEach(function (rule) {
        strCss += commentOrRule(rule);
      });
      strCss += '}\n\n';
      log('@media ' + media.rule);

      return strCss;
    };

    // Process keyframes
    var processKeyframes = function(key) {
      var strCss = '';
      strCss += '@' + (typeof key.vendor !=='undefined'? key.vendor: '') + 'keyframes ' + key.name + ' {\n\n';
      key.keyframes.forEach(function (keyframe) {
        strCss += commentOrKeyframe(keyframe);
      });
      strCss += '}\n\n';

      return strCss;
    };

    this.files.forEach(function(f) {

      f.src.forEach(function (filepath) {

        error = false;

        log('\nFile ' + filepath + ' found.');

        var destpath = f.dest;
        var filename = filepath.replace(/(.*)\//gi, '');

        if (destpath.indexOf(filename) === -1) {
          destpath = path.join(f.dest, filename);
        }

        var source = grunt.file.read(filepath);
        var cssJson = parseCss(source);
        var strStyles = [];
        var processedCSS = {};
        processedCSS.importURL = [];
        processedCSS.base = [];
        processedCSS.media = [];
        processedCSS.media.all = [];
        processedCSS.media.minWidth = [];
        processedCSS.media.maxWidth = [];
        processedCSS.media.minHeight = [];
        processedCSS.media.maxHeight = [];
        processedCSS.media.print = [];
        processedCSS.media.blank = [];
        processedCSS.keyframes = [];

        grunt.file.write(destpath, cssJson);

        // For every rule in the stylesheet...
        cssJson.stylesheet.rules.forEach( function (rule) {
          // if the rule is a media query...
          if (rule.type === 'media') {

            // Create 'id' based on the query (stripped from spaces and dashes etc.)
            var strMedia = rule.media.replace(/[^A-Za-z0-9]/ig,'');

            // Create an array with all the media queries with the same 'id'
            var item = processedCSS.media.filter(function (element) {
              return (element.val === strMedia);
            });

            // If there are no media queries in the array, define details
            if (item.length < 1) {
              var mediaObj = {};
              mediaObj.sortVal = parseFloat(rule.media.match( /\d+/g ));
              mediaObj.rule = rule.media;
              mediaObj.val = strMedia;
              mediaObj.rules = [];

              processedCSS.media.push(mediaObj);
            }

            // Compare the query to other queries
            var i = 0, matched = false;
            processedCSS.media.forEach(function (elm) {
              if (elm.val === strMedia) {
                matched = true;
              }
              if (!matched) {i++;}
            });

            // Push every merged query
            rule.rules.forEach(function (mediaRule) {
              if (mediaRule.type === 'rule' || 'comment' ) {
                processedCSS.media[i].rules.push(mediaRule);
              }
            });

          } else if (rule.type === 'keyframes') {
            processedCSS.keyframes.push(rule);

          } else if (rule.type === 'import') {
            processedCSS.importURL.push(rule);

          } else if (rule.type === 'rule' || 'comment') {
            processedCSS.base.push(rule);

          }
        });

        // Sort media queries by kind, this is needed to output them in the right order
        processedCSS.media.forEach(function (item) {
          if (item.rule.match( /min-width/ )){
            processedCSS.media.minWidth.push(item);
          } else if (item.rule.match( /min-height/ )){
            processedCSS.media.minHeight.push(item);
          } else if (item.rule.match( /max-width/ )){
            processedCSS.media.maxWidth.push(item);
          } else if (item.rule.match( /max-height/ )){
            processedCSS.media.maxHeight.push(item);
          } else if (item.rule.match( /print/ )){
            processedCSS.media.print.push(item);
          } else if (item.rule.match( /all/ )){
            processedCSS.media.all.push(item);
          } else {
            processedCSS.media.blank.push(item);
          }
        });

        // Function to determine sort order
        var determineSortOrder = function(a, b, isMax) {
          var sortValA = a.sortVal,
              sortValB = b.sortVal;
              isMax = typeof isMax !== 'undefined' ? isMax : false;

          // consider print for sorting if sortVals are equal
          if (sortValA === sortValB) {
            if (a.rule.match( /print/ )) {
              // a contains print and should be sorted after b
              return 1;
            }
            if (b.rule.match( /print/ )) {
              // b contains print and should be sorted after a
              return -1;
            }
          }

          // return descending sort order for max-(width|height) media queries
          if (isMax) { return sortValB-sortValA; }

          // return ascending sort order
          return sortValA-sortValB;
        };

        // Sort media.all queries ascending
        processedCSS.media.all.sort(function(a,b){
          return determineSortOrder(a, b);
        });

        // Sort media.minWidth queries ascending
        processedCSS.media.minWidth.sort(function(a,b){
          return determineSortOrder(a, b);
        });

        // Sort media.minHeight queries ascending
        processedCSS.media.minHeight.sort(function(a,b){
          return determineSortOrder(a, b);
        });

        // Sort media.maxWidth queries descending
        processedCSS.media.maxWidth.sort(function(a,b){
          return determineSortOrder(a, b, true);
        });

        // Sort media.maxHeight queries descending
        processedCSS.media.maxHeight.sort(function(a,b){
          return determineSortOrder(a, b, true);
        });

        // Function to output base CSS
        var outputBase = function(base){
          base.forEach(function (rule) {
            strStyles += commentOrRule(rule);
          });
        };

        // Function to import URL
        var outputImportURL = function(importURL){
          importURL.forEach(function(item){
            strStyles += processImportURL(item);
          });
        };

        // Function to output media queries
        var outputMedia = function(media){
          media.forEach(function(item){
            strStyles += processMedia(item);
          });
        };

        // Function to output keyframes
        var outputKeyFrames = function(keyframes){
          keyframes.forEach(function (keyframe) {
            strStyles += processKeyframes(keyframe);
          });
        };

        // Check if import URL was processed
        if (processedCSS.importURL.length !== 0){
          outputImportURL(processedCSS.importURL);
        }

        // Check if base CSS was processed and print them
        if (processedCSS.base.length !== 0){
          outputBase(processedCSS.base);
        }

        // Check if media queries were processed and print them in order
        if (processedCSS.media.length !== 0){
          log('\nProcessed media queries:');
          outputMedia(processedCSS.media.blank);
          outputMedia(processedCSS.media.all);
          outputMedia(processedCSS.media.minWidth);
          outputMedia(processedCSS.media.minHeight);
          outputMedia(processedCSS.media.maxWidth);
          outputMedia(processedCSS.media.maxHeight);
          outputMedia(processedCSS.media.print);
          log('');
        }

        // Check if keyframes were processed and print them
        if (processedCSS.keyframes.length !== 0){
          outputKeyFrames(processedCSS.keyframes);
        }

        // Define the new file extension
        if( options.ext ){
          destpath = destpath.replace( /\.(.*)/ , options.ext);
        }

        // Normalize line endings
        strStyles = grunt.util.normalizelf(strStyles);

        // Write the new file
        grunt.file.write(destpath, strStyles);
        grunt.log.ok('File ' + destpath + ' created.');

      });

      if(error){
        grunt.fatal('No files found');
      }

    });

  });

};
