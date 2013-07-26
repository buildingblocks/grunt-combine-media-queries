# Combine media queries

> Combine matching media queriries into one media query definition. Useful for CSS generated by LESS using nested media queries written mobile-first.

This was written as a solution to a problem we have using LESS CSS for our mobile first sites. It's by no means complete but does what we require.

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-combine-media-queries --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-combine-media-queries');
```

## The "combine_media_queries" task

### Overview
In your project's Gruntfile, add a section named `combine_media_queries` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  combine_media_queries: {
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

Currently there aren't any options

### Usage Examples

#### Default Options
In this example, the all the css files in `test/css/` are processed move moved to the folder `processed`

```js
grunt.initConfig({
  combine_media_queries: {
      default : {
        files: {
          'processed': ['test/css/*.css'],
        },
      }
    },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
Initial release. Currently only works for CSS written mobile-first and will only order by 'min-width'.
