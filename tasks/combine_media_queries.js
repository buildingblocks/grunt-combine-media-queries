/*
 * grunt-combine-media-queries
 * https://github.com/buildingblocks/grunt-combine-media-queries
 *
 * Copyright (c) 2013 John Cashmore
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

	function processCssRule (rule) {
		var strCss = "";
		strCss += rule.selectors.join(',') + ' {\r\n';
		rule.declarations.forEach(function (declaration) {
			strCss += '\t' + declaration.property + ':' + declaration.value + ';\r\n';
		});
		strCss += '}\r\n\r\n';

		return strCss;
	}

  grunt.registerMultiTask('combine_media_queries', 'Your task description goes here.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', '
    });
		var error = false,
				parseCss = require('css-parse'),
				fs = require('fs'),
				read = fs.readFileSync;
    // Iterate over all specified file groups.
    this.files.forEach(function(f) {

			f.src.forEach(function (filename) {
				console.log(filename);
				if (grunt.file.exists(filename)) {
					if (!grunt.file.isDir(filename)) {
						var source = read(filename, 'utf8');

						var cssJson = parseCss(source),
						processedCSS = {};
						processedCSS.base = {};
						processedCSS.base.rules = [];
						processedCSS.media = [];

						cssJson.stylesheet.rules.forEach( function (rule) {
							if (rule.type === 'media') {

								var strMedia = rule.media.replace(/[^A-Za-z0-9]/ig,'');

								var item = processedCSS.media.filter(function (element) {
										return (element.val === strMedia);
								});


								//console.log(strMedia);
								if (item.length < 1) {
									var mediaObj = {};
									mediaObj.minw = rule.media.match( /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/ ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" );
									mediaObj.maxw = rule.media.match( /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/ ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" );
									mediaObj.rule = rule.media;
									mediaObj.val = strMedia;

									mediaObj.rules = [];

									processedCSS.media.push(mediaObj)

								}
								var i = 0, matched = false;
								processedCSS.media.forEach(function (elm) {
									if (elm.val === strMedia) {
										matched = true;
									}
									if (!matched) {i++;};

								});

								console.log(i);



								rule.rules.forEach(function (mediaRule) {
									processedCSS.media[i].rules.push(mediaRule);

								});

							} else {
								processedCSS.base.rules.push(rule);
							}

						});


						processedCSS.media.sort(function (a,b) {
							if(a.minw < b.minw) {
								return -1;
							}
							if(a.minw > b.minw) {
								return 1;
							}
							return 0;
						});



						var strStyles = "";
						processedCSS.base.rules.forEach(function (rule) {
							strStyles += processCssRule(rule);
						});
						//console.log(processedCSS.media);
						//console.log(processedCSS.media.length);
						//var media;
						processedCSS.media.forEach(function (item) {

								strStyles += '@media ' + item.rule + ' {\r\n';

								//console.log(item.rules);
								//var rule;
								item.rules.forEach(function (rule) {
									//console.log(rule);
									strStyles += processCssRule(rule);

									//console.log(strStyles);
								});

								strStyles += '}\r\n';

						});
						//console.log(JSON.stringify(processedCSS));
						grunt.file.write(f.dest + '/' + filename, strStyles);

					} else {
						grunt.log.error('Source file "' + filename + '" not found.');
						error = true;
						return false;

					}
				} else {
					grunt.log.error('Source file "' + filename + '" not found.');
					error = true;
					return false;

				}
			});
    });
    if(error) {
			return false;
		}

  });

};
