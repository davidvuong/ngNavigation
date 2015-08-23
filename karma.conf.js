/**
 * ngNavigation/karma.conf.js
 *
 * Copyright (c) 2015 David Vuong <david.vuong256@gmail.com>
 * Licensed MIT
 */
module.exports = function (config) {
    config.set({
        // Base path that will be used to resolve all patterns (eg. files, exclude).
        basePath: '',

        // Frameworks to use
        //  Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // List of files/patterns to load in the browser.
        files: [
            'node_modules/angular/angular.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'js/ngNavigation.js',
            'tests/**/*.spec.js'
        ],

        // List of files to exclude.
        exclude: [],

        // Pre-process matching files before serving them to the browser.
        //  Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'js/ngNavigation.js': 'coverage'
        },

        reporters: ['progress', 'coverage'],
        coverageReporter: {
            type: 'lcov',
            dir: 'coverage/',
            subdir: '.'
        },

        port: 9876,
        colors: true,

        // Possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO,

        // Enable/disable watching file and executing tests whenever any file changes.
        autoWatch: true,

        // Start these browsers
        //  Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],

        // Continuous Integration mode
        //  if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    })
};
