/**
 * ngNavigation/Gruntfile.js
 *
 * Copyright (c) 2015 David Vuong <david.vuong256@gmail.com>
 * Licensed MIT
 */
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-karma');

    var appConfig = require('./build.config.js');
    var taskConfig = {
        pkg: grunt.file.readJSON('package.json'),

        meta: {
            banner: '/**\n' +
                ' * <%= pkg.name %> - v<%= pkg.version %>\n' +
                ' *\n' +
                ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
                ' * Licensed <%= pkg.license %>\n' +
                ' */\n'
        },

        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                commit: true,
                commitMessage: 'chore(release): v%VERSION%',
                commitFiles: [
                    'package.json',
                    'bower.json'
                ],
                createTag: false,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'origin'
            }
        },

        uglify: {
            compile: {
                options: { banner: '<%= meta.banner %>' },
                files: {
                    'js/ngNavigation.min.js': 'js/ngNavigation.js'
                }
            }
        },

        jshint: {
            src: ['<%= app_files.js %>'],
            gruntfile: ['Gruntfile.js'],

            // ref: http://jshint.com/docs/options/
            options: {
                curly: true,
                immed: true,
                newcap: false,
                noarg: true,
                sub: true,
                boss: true,
                eqnull: true,
                debug: true
            }
        },

        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        }
    };

    grunt.initConfig(grunt.util._.extend(taskConfig, appConfig));

    grunt.registerTask('build', ['jshint', 'uglify:compile']);
    grunt.registerTask('test', ['jshint', 'karma:unit']);
    grunt.registerTask('default', ['build']);
};
