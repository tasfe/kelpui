'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var lazypipe = require('lazypipe');

var pkg = require('./package.json');

var isDeploy = process.argv[process.argv.length - 1] == 'deploy';

var paths = {
    app: 'src/',
    dist: 'dist/',
    tmp : '.tmp/',
    tmpStyles: '.tmp' + 'styles/'
};

var config = {
    sass: {
        src: paths.app + '/scss/**/*.{sass,scss}',
        dest: '/css',
        options: {
            noCache: true,
            compass: false,
            bundleExec: true,
            sourcemap: true,
            sourcemapPath: '../../_assets/scss'
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
            bundleExec: true
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
/* 部署之前 sass lint */
gulp.task("sass-lint", function(){
    return gulp.src(config.scsslint.src)
        .pipe($.cached("sasslint"))
        .pipe($.if(!isDeploy, $.scssLint({config: "scsslint.yml"})));
});
/* 编译SCSS */
gulp.task("sass-compile", ["sass-lint"], function(){
    return gulp.src(config.paths.sass)
        .pipe($.plumber())
        .pipe($.cached("scss"))
        .pipe($.rubySass({
            noCache: true,
            compass: false,
            style: 'expanded',
            sourcemap: true,
            sourcemapPath: '.'
        }))
        .pipe($.sourcemaps.init())
        .pipe($.filter(['*.css', '!*.map'])) // Don’t write sourcemaps of sourcemaps
        .pipe($.autoprefixer({
            browsers: [
                '> 1%',
                'safari 5',
                'ie 7',
                'ie 8',
                'ie 9',
                'opera 12.1',
                'android 4'
            ],
            cascade: true
        }))
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