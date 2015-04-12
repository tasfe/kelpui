'use strict';
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    scsslint = require('gulp-scss-lint'),
    csslint = require('gulp-csslint'),
    runSequence = require("run-sequence"),
    del = require('del');

var pkg = require('./package.json');

var isDeploy = process.argv[process.argv.length - 1] == 'deploy';

//console.log('isDeploy = ' + isDeploy);

var paths = {
    app: 'src',
    dist: 'dist',
    tmp: '.tmp'
};

var config = {
    sass: {
        src: [
            paths.app + '/scss/**/*.{sass,scss}'
        ],
        dest: paths.tmp,
        options:{
            outputStyle: 'nested', // libsass doesn't support nested yet
            precision: 10,
            includePaths: ['.'],
            onError: console.error.bind(console, 'Sass error:')
        }
    },
    scsslint: {
        src: [
            paths.app + '/scss/**/*.{sass,scss}',
            '!' + paths.app + '/scss/base/_normalize.scss',
            '!' + paths.app + '/scss/base/_reset.scss',
            '!' + paths.app + '/scss/base/_type.scss'
        ],
        options: {
            endless: true,
            sync: true,
            config: 'scsslint.yml'
        }
    },
    csslint: {
        src: [
            paths.tmp + '/**/*.css'
        ],
        options: {
          'box-model': false,
          'compatible-vendor-prefixes': false,
          'empty-rules': true,
          'duplicate-properties': false,
          'font-sizes': false,
          'ids': true,
          'known-properties': false,
          'overqualified-elements': true,
          'shorthand': true,
          'text-indent': true,
          'unique-headings': false,
          'vendor-prefix': false,
          'zero-units': true,
          'universal-selector': false,
          'box-sizing': false,
          'bulletproof-font-face': false,
          'important': false,
          'unqualified-attributes': false,
          'regex-selectors': false,
          'floats': false,
          'fallback-colors': false,
          'adjoining-classes': false,
          'qualified-headings': false
        }
    },
    autoprefixer: {
        browsers: [
            '> 1%',
            'safari 5',
            'ie 6',
            'ie 7',
            'ie 8',
            'ie 9',
            'opera 12.1',
            'android 4'
        ],
        cascade: true
    },
    watch: {
        sass: this.src + '/scss/**/*.{sass,scss}',
        images: this.src + '/images/**/*'
    }
};

/*----------------------------------------------------
    Tasks
----------------------------------------------------*/
/* 部署之前 scss lint */
gulp.task("scss-lint", function(){

    var fail = process.argv.indexOf("--fail") !== -1;

    return gulp.src(config.scsslint.src)
        .pipe($.plumber())
        .pipe($.if(!isDeploy, $.cache(scsslint(config.scsslint.options), {
            success: function(scsslintFile) {
                return scsslintFile.scsslint.success;
            },
            value: function(scsslintFile) {
                return {
                    scsslint: scsslintFile.scsslint
                };
            }
        })))
        .pipe($.if(fail, scsslint.failReporter()));
});

/* 编译 scss */
gulp.task("scss-compile", ["scss-lint"], function(){
    return gulp.src(config.sass.src)
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass(config.sass.options))
        .pipe($.autoprefixer(config.autoprefixer))
        .pipe($.sourcemaps.write('.', { includeContent: false }))
        .pipe(gulp.dest(config.sass.dest))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'SCSS 编译完毕！'
        }));
});

/* 检测 css */
gulp.task("css-lint", function() {
    return gulp.src(config.csslint.src)
        .pipe($.if(!isDeploy, $.cache(csslint(config.csslint.options), {
            success: function(csslintFile) {
                return csslintFile.csslint.success;
            },
            value: function(csslintFile) {
                return {
                csslint: csslintFile.csslint
                };
            }
        })))
        .pipe(csslint.reporter());
});

gulp.task("css-app", function(cb) {
    return runSequence("scss-compile", "css-lint", cb);
});

gulp.task("styles", ["css-app"], function() {
    return gulp.src(config.csslint.src)
        .pipe($.if(isDeploy, $.minifyCss({noAdvanced: true})))
        .pipe(gulp.dest(paths.dist))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'CSS 样式生成！'
        }));
});

gulp.task("clear", function(done) {
    del.sync(paths.tmp);
    return $.cache.clearAll(done);
});

gulp.task("watch", function() {
    gulp.watch(config.sass.src, ["styles"]);
});

gulp.task("deploy", function(cb) {
    runSequence("clear", ["styles"], cb);
});

gulp.task("default", [
    "styles",
    "watch"
]);