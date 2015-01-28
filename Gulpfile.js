'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var pkg = require('./package.json');

var config = {
    browsersync: {
        development: {
            server: {
                baseDir: [development, build, src]
            },
            port: 9999,
            files: [
                developmentAssets + '/css/*.css',
                developmentAssets + '/js/*.js',
                developmentAssets + '/images/**',
                developmentAssets + '/fonts/*'
            ]
        },
        production: {
            server: {
                baseDir: [production]
            },
            port: 9998
        }
    },
    delete: {
        src: [developmentAssets]
    },
    sass: {
        src: srcAssets + '/scss/**/*.{sass,scss}',
        dest: developmentAssets + '/css',
        options: {
            noCache: true,
            compass: false,
            bundleExec: true,
            sourcemap: true,
            sourcemapPath: '../../_assets/scss'
        }
    },
    autoprefixer: {
        browsers: [
            'last 2 versions',
            'safari 5',
            'ie 8',
            'ie 9',
            'opera 12.1',
            'ios 6',
            'android 4'
        ],
        cascade: true
    },
    browserify: {
        // Enable source maps
        debug: true,
        // Additional file extensions to make optional
        extensions: ['.coffee', '.hbs'],
        // A separate bundle will be generated for each
        // bundle config in the list below
        bundleConfigs: [{
            entries: './' + srcAssets + '/javascripts/application.js',
            dest: developmentAssets + '/js',
            outputName: 'application.js'
        }, {
            entries: './' + srcAssets + '/javascripts/head.js',
            dest: developmentAssets + '/js',
            outputName: 'head.js'
        }]
    },
    images: {
        src: srcAssets + '/images/**/*',
        dest: developmentAssets + '/images'
    },
    webp: {
        src: productionAssets + '/images/**/*.{jpg,jpeg,png}',
        dest: productionAssets + '/images/',
        options: {}
    },
    gzip: {
        src: production + '/**/*.{html,xml,json,css,js}',
        dest: production,
        options: {}
    },
    copyfonts: {
        development: {
            src: srcAssets + '/fonts/*',
            dest: developmentAssets + '/fonts'
        },
        production: {
            src: developmentAssets + '/fonts/*',
            dest: productionAssets + '/fonts'
        }
    },
    watch: {
        sass: srcAssets + '/scss/**/*.{sass,scss}',
        scripts: srcAssets + '/javascripts/**/*.js',
        images: srcAssets + '/images/**/*',
        sprites: srcAssets + '/images/**/*.png',
        svg: 'vectors/*.svg'
    },
    scsslint: {
        src: [
            srcAssets + '/scss/**/*.{sass,scss}',
            '!' + srcAssets + '/scss/base/_sprites.scss',
            '!' + srcAssets + '/scss/helpers/_meyer-reset.scss'
        ],
        options: {
            bundleExec: true
        }
    },
    jshint: {
        src: srcAssets + '/javascripts/*.js'
    },
    sprites: {
        src: srcAssets + '/images/sprites/icon/*.png',
        dest: {
            css: srcAssets + '/scss/base/',
            image: srcAssets + '/images/sprites/'
        },
        options: {
            cssName: '_sprites.scss',
            cssFormat: 'css',
            cssOpts: {
                cssClass: function(item) {
                    // If this is a hover sprite, name it as a hover one (e.g. 'home-hover' -> 'home:hover')
                    if (item.name.indexOf('-hover') !== -1) {
                        return '.icon-' + item.name.replace('-hover', ':hover');
                        // Otherwise, use the name as the selector (e.g. 'home' -> 'home')
                    } else {
                        return '.icon-' + item.name;
                    }
                }
            },
            imgName: 'icon-sprite.png',
            imgPath: '/assets/images/sprites/icon-sprite.png'
        }
    },
    optimize: {
        css: {
            src: developmentAssets + '/css/*.css',
            dest: productionAssets + '/css/',
            options: {
                keepSpecialComments: 0
            }
        },
        js: {
            src: developmentAssets + '/js/*.js',
            dest: productionAssets + '/js/',
            options: {}
        },
        images: {
            src: developmentAssets + '/images/**/*.{jpg,jpeg,png,gif}',
            dest: productionAssets + '/images/',
            options: {
                optimizationLevel: 3,
                progessive: true,
                interlaced: true
            }
        },
        html: {
            src: production + '/**/*.html',
            dest: production,
            options: {
                collapseWhitespace: true
            }
        }
    },
    rsync: {
        src: production + '/**',
        options: {
            destination: '~/path/to/my/website/root/',
            root: production,
            hostname: 'mydomain.com',
            username: 'user',
            incremental: true,
            progress: true,
            relative: true,
            emptyDirectories: true,
            recursive: true,
            clean: true,
            exclude: ['.DS_Store'],
            include: []
        }
    }
};


var dateFormat = 'UTC:yyyy-mm-dd"T"HH:mm:ss Z';

var banner = [
  '/*! <%= pkg.title %> v<%= pkg.version %><%=ver%>',
  'by moocss',
  '(c) ' + $.util.date(Date.now(), 'UTC:yyyy') + ' AllMobilize, Inc.',
  'Licensed under <%= pkg.license.type %>',
  $.util.date(Date.now(), dateFormat) + ' */ \n'
].join(' | ');


/*----------------------------------------------------  
    Tasks
----------------------------------------------------*/
