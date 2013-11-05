/*
 * grunt-combine-media-queries
 * https://github.com/buildingblocks/grunt-combine-media-queries
 *
 * Copyright (c) 2013 John Cashmore
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt){

  grunt.registerMultiTask('cmq', 'Find duplicate media queries and combines them.', function(){
    
    // requirements
    var parse = require('css-parse'),
        stringify = require('css-stringify');

    // options
    var options = this.options({
      log: false,
      order: [
        {
          name: 'simple',
          regex: /screen/,
          order: 5,
          output: 0,
        },
        { 
          name: 'min-width',
          regex: /min-width/,
          order: 1,
          output: 1, 
        },
        {
          name: 'max-width',
          regex: /max-width/,
          reverse: true,
          order: 2,
          output: 2,
        },
        { 
          name: 'min-height',
          regex: /min-height/,
          order: 3,
          output: 3, 
        },
        {
          name: 'max-height',
          regex: /max-height/,
          reverse: true,
          order: 4,
          output: 4,
        },
        {
          name: 'other',
          order: 99,
          output: 5,
        },
        { 
          name: 'print',
          regex: /print/,
          order: 0,
          output: 99, 
        }
      ]
    });

    this.files.forEach(function(f){
    
      // get file contents
      var contents = f.src.filter(function(filepath) {
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        return grunt.file.read(filepath);
      }).join('\n');

      // parse the contents and setup objects used for combining and sorting
      var json = parse(contents),
          media = {
            extracted: [],
            extractedCount: 0,
            combined: [],
            combinedCount: 0,
            ordered: [],
            orderedCount: 0
          },
          other = [];

      // seperate media rules from other rules
      json.stylesheet.rules.forEach(function(rule){
        if(rule.type === 'media'){



          /*
           * The following two lines are used to order more specific queries 
           * after their simple counterpart(s), it is not working properly with 
           * em's need improvement. Works together with the internal sort 
           * function on line 164. 
           */
          var queryNumbers = rule.media.match(/\d+/g);
          rule.mediaInt = queryNumbers instanceof Array? queryNumbers.join('.') : queryNumbers;



          rule.mediaStr = rule.media.replace(/[^A-Za-z0-9]/ig,'');

          media.extracted.push(rule);
          media.extractedCount++;
        } else {
          other.push(rule);
        }
      });

      // find and combine equal media queries
      media.extracted.forEach(function(rule){
        if(!rule.matched){
          media.extracted.forEach(function(r){
            if(rule !== r && rule.mediaStr === r.mediaStr){
              rule.rules = rule.rules.concat(r.rules);
              r.matched = true;
            }
          });
          media.combined.push(rule);
          media.combinedCount++;
        }
      });

      // HEY YOU, stop right there!
      if(media.extractedCount === media.combinedCount){
        grunt.log.error('No duplicate media queries found.');
        return false;
      }

      // custom ordering and sorting
      options.order.forEach(function(o){
        o.rules = [];
        media.ordered.push(o);
        media.orderedCount++;
      });

      // sort ordered by order order
      media.ordered.sort(function(a,b){
        return a.order - b.order;
      });

      // use the order object's regex to sort push combined media rules
      media.combined.forEach(function(rule){
        for (var i = 0; !rule.ordered && i < media.orderedCount; i++) {
          if(rule.media.match(media.ordered[i].regex)){
            media.ordered[i].rules.push(rule);
            rule.ordered = true;
          }
        }
      });

      // sort ordered by output order
      media.ordered.sort(function(a,b){
        return a.output - b.output;
      });

      // sort ordered internally
      media.ordered.forEach(function(kind){
        kind.rules.sort(function(a,b){
          if(!kind.reverse || parseInt(a.mediaInt, 10) === parseInt(b.mediaInt, 10)){
            return a.mediaInt - b.mediaInt;
          } else {
            return b.mediaInt - a.mediaInt;
          }
        });
      });

      // join all the rules together in specified order
      for (var i = 0; i < media.orderedCount; i++) {
        other = other.concat(media.ordered[i].rules);
      }

      // merge them back into the json
      json.stylesheet.rules = other;

      // log every merged media query
      if(options.log){
        json.stylesheet.rules.forEach(function(rule){
          if(rule.type === 'media'){
            grunt.log.writeln(rule.media);
          }
        });
      }

      // write the new file
      grunt.file.write(f.dest, stringify(json) );
      grunt.log.ok('File "' + f.dest + '" created. Combined ' + media.extractedCount + ' media queries into ' + media.combinedCount + '.');
    });
  });
};