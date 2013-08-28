/*
 * grunt-combine-media-queries
 * https://github.com/buildingblocks/grunt-combine-media-queries
 *
 * Copyright (c) 2013 John Cashmore
 * Licensed under the MIT license.
 */

'use strict';

var processCssRule = function(rule) {
  var strCss = '';
  strCss += rule.selectors.join(',\n') + ' {\n';
  rule.declarations.forEach(function (declaration) {
    if(declaration.property != null && declaration.value != null){
      strCss += '\t' + declaration.property + ':' + declaration.value + ';\n';
    }
  });
  strCss += '}\n\n';
  return strCss;
};

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
    
    // Function to log info only when 'options.log' is set to true
    var log = function(message){
      if (options.log){
        grunt.log.writeln(message);
      }
    };

    this.files.forEach(function(f) {
      
      f.src.forEach(function (filepath) {
      
        error = false;
      
        log('\nFile ' + filepath + ' found.');
              
        var filename = filepath.replace(/(.*)\//gi, '');
        var destpath = path.join(f.dest, filename);
        var source = grunt.file.read(filepath);
        var cssJson = parseCss(source);
        var strStyles = [];
        var processedCSS = {};
        processedCSS.base = {};
        processedCSS.base.rules = [];
        processedCSS.media = [];
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
            
            // push every single of merged query
            rule.rules.forEach(function (mediaRule) {
              if (mediaRule.type === 'rule') {
                processedCSS.media[i].rules.push(mediaRule);
              }
            });

          } else if (rule.type === 'keyframes') {
            processedCSS.keyframes.push(rule);
               
          } else if (rule.type === 'rule') {
            processedCSS.base.rules.push(rule);
          }
        });
          
        // Sort media queries by kind, this is needed to output them in the right order
        processedCSS.media.forEach(function (item) {
          if (item.rule.match( /print/ )){
            processedCSS.media.print.push(item);  
          } else if (item.rule.match( /min-width/ )){
            processedCSS.media.minWidth.push(item);
          } else if (item.rule.match( /min-height/ )){
            processedCSS.media.minHeight.push(item);
          } else if (item.rule.match( /max-width/ )){
            processedCSS.media.maxWidth.push(item);
          } else if (item.rule.match( /max-height/ )){
            processedCSS.media.maxHeight.push(item);
          } else {
            processedCSS.media.blank.push(item); 
          }   
        });
        
        // Sort media.minWidth queries ascending
        processedCSS.media.minWidth.sort(function(a,b){
          return a.sortVal-b.sortVal;
        });
        
        // Sort media.minHeight queries ascending
        processedCSS.media.minHeight.sort(function(a,b){
          return a.sortVal-b.sortVal;
        });
        
        // Sort media.maxWidth queries descending
        processedCSS.media.maxWidth.sort(function(a,b){
          return b.sortVal-a.sortVal;
        });
        
        // Sort media.maxHeight queries descending
        processedCSS.media.maxHeight.sort(function(a,b){
          return b.sortVal-a.sortVal;
        });
        
        // Function to output base CSS
        var outputBase = function(base){
          base.rules.forEach(function (rule) {
            strStyles += processCssRule(rule);
          });
        };
        
        // Function to output media queries
        var outputMedia = function(media){
          media.forEach(function(item){
            strStyles += '@media ' + item.rule + ' {\n\n';
            item.rules.forEach(function (rule) {
              strStyles += processCssRule(rule);
            });
            strStyles += '}\n\n';
            
            log('@media ' + item.rule);
          });
        };
        
        // Function to output keyframes
        var outputKeyFrames = function(keyFrames){
          processedCSS.keyframes.forEach(function (keyFrame) {
            strStyles += '@'+ (typeof keyFrame.vendor !=='undefined'? keyFrame.vendor: '') +'keyframes '+ keyFrame.name +' {\n\n';
            keyFrame.keyframes.forEach(function (frame) {
              strStyles += frame.values.join(',') + ' {\n';
              frame.declarations.forEach(function (declaration) {
                if(declaration.property != null && declaration.value != null){
                  strStyles += '\t' + declaration.property + ':' + declaration.value + ';\n';
                }
              });
              strStyles += '}\n\n';
            });
            strStyles += '}\n';
          });
        };
          
        // Check if base CSS was processed and print them
        if (processedCSS.base.length !== 0){
          outputBase(processedCSS.base);
        }
                
        // Check if media queries were processed and print them in order     
        if (processedCSS.media.length !== 0){
          log('\nProcessed media queries:');
          
          outputMedia(processedCSS.media.blank);
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