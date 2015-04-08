'use strict';
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    scsslint = require("gulp-scss-lint"),
    lazypipe = require('lazypipe');

var pkg = require('./package.json');

var isDeploy = process.argv[process.argv.length - 1] == 'deploy';

console.log("isDeploy = " + isDeploy);

var paths = {
    app: 'src',
    dist: 'dist',
    tmp : '.tmp',
    tmpStyles: '.tmp' + '/styles'
};

var config = {
    sass: {
        src: paths.app + '/scss/**/*.{sass,scss}',
        dest: paths.dist + '/css',
        options: {
            noCache: true,
            compass: false,
            bundleExec: true,
            style: 'expanded',
            sourcemap: true,
            sourcemapPath: '.'
        }
    },
    scsslint: {
        src: [
            paths.app + '/scss/base/*.{sass,scss}',
            '!' + paths.app + '/scss/base/_normalize.scss',
            '!' + paths.app + '/scss/base/_reset.scss',
            '!' + paths.app + '/scss/base/_type.scss'
        ],
        options: {
            endless: true,
            sync: true,
            config: "scsslint.yml"
        }
    },
    autoprefixer: {
        browsers: [
            '> 1%',
            'safari 5',
            'ie 7',
            'ie8',
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
/* 部署之前 scss lint */
gulp.task("scss-lint", function(){

    var fail = process.argv.indexOf("--fail") !== -1;

    return gulp.src(config.scsslint.src)
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

/* 编译SCSS */
gulp.task("scss-compile", ["scss-lint"], function(){
    return gulp.src(config.sass.src)
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.cache($.sass()))
        .pipe($.autoprefixer(config.autoprefixer))
        .pipe($.filter(['*.css', '!*.map'])) // Don’t write sourcemaps of sourcemaps
        .pipe($.sourcemaps.write('.', { includeContent: false }))
        .pipe($.filter().restore()) // Restore original files
        .pipe(gulp.dest(paths.tmpStyles))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'SCSS 编译完毕！'
        }));
});

/* css 检测 */
var csslintChannel = lazypipe().pipe($.csslint, "csslintrc.json").pipe($.csslint.reporter);
gulp.task("css-lint", function(){
    return gulp.src(paths.tmpStyles + "/**/*")
        .pipe($.filter(['*.css', '!*.map']))
        .pipe($.cached("csslint"))
        .pipe($.if(!isDeploy, csslintChannel()));
});

/* css 合并 */
gulp.task("css-join", ["css-lint"], function(){
    return gulp.src(paths.tmpStyles+"/**/*")
        .pipe($.filter(['*.css', '!*.map']))
        .pipe($.concat("app.css"))
        .pipe($.size())
        .pipe(gulp.dest(paths.tmp))
        .pipe($.notify({
            onLast: true,
            message: 'css 文件合并完毕！'
        }));
});

/* 生成 css 主文件 */
gulp.task("css-app", function(cb){
    //按照顺序执行taks
    return runSequence("sass-compile", "css-join",  cb);
});

/* 清除 tmp styles */
gulp.task("clean-tmp-styles", function(){
    return gulp.src([config.paths.tmpStyles, config.paths.tmp+"/app.css"], { read: false })
        .pipe($.rimraf());
});

gulp.task("deploy", [
    "css-lint"
]);

gulp.task("default", [
    "clean-tmp-styles",
    "css-lint"
]);