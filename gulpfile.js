var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');

var browserify = require('browserify');
var vueify = require('vueify');
var babelify = require('babelify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var runSequence = require('run-sequence');

var config = {
    assetsDir: 'src',
    sassPattern: 'scss/**/*.scss',
    jsPattern: 'js/**/*.js',
    vuePattern: 'vue/**/*.vue',
    bowerDir: 'bower_components',
    production: !!plugins.util.env.production,
    sourceMaps: !plugins.util.env.production,
    //https://knpuniversity.com/screencast/gulp/version-cache-busting
    revManifestPath: 'rev-manifest.json',
    useManifest: false,

};

var sassOpts = {
    includePaths: [
        config.bowerDir+'/bootstrap/scss',
        config.bowerDir+'/font-awesome/scss'
    ]
};

var app = {};

app.addStyle = function(paths, outputFilename) {
    return gulp.src(paths)
        .pipe(plugins.plumber(function(error) {
            console.log(error.toString());
            this.emit('end');
        }))
        .pipe(plugins.if(config.sourceMaps, plugins.sourcemaps.init()))
        .pipe(plugins.sass(sassOpts))
        .pipe(plugins.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(plugins.concat('css/'+outputFilename))
        .pipe(config.production ? plugins.cleanCss() : plugins.util.noop())
        .pipe(plugins.if(config.useManifest, plugins.rev()))
        .pipe(plugins.if(config.sourceMaps, plugins.sourcemaps.write('.')))
        .pipe(gulp.dest('web'))
        .pipe(plugins.if(config.useManifest, plugins.rev.manifest(config.revManifestPath, {
            merge: true
        })))
        .pipe(plugins.if(config.useManifest, gulp.dest('.')));
};

app.addScript = function(paths, outputFilename) {
    return gulp.src(paths)
        .pipe(plugins.plumber(function(error) {
            console.log(error.toString());
            this.emit('end');
        }))
        .pipe(plugins.if(config.sourceMaps, plugins.sourcemaps.init()))
        .pipe(plugins.concat('js/'+outputFilename))
        .pipe(config.production ? plugins.uglify() : plugins.util.noop())
        .pipe(plugins.if(config.useManifest, plugins.rev()))
        .pipe(plugins.if(config.sourceMaps, plugins.sourcemaps.write('.')))
        .pipe(gulp.dest('web'))
        .pipe(plugins.if(config.useManifest, plugins.rev.manifest(config.revManifestPath, {
            merge: true
        })))
        .pipe(plugins.if(config.useManifest, gulp.dest('.')));
};

app.copy = function(srcFiles, outputDir) {
    return gulp.src(srcFiles)
        .pipe(gulp.dest(outputDir));
};

gulp.task('styles', function () {

    return app.addStyle([
        config.assetsDir+'/scss/app.scss',

        //vueapp
        'web/css/bundle.css'

    ], 'app.css');

});

gulp.task('scripts', function() {

    return app.addScript([
        config.bowerDir+'/jquery/dist/jquery.js',
        config.bowerDir+'/tether/dist/js/tether.js',
        config.bowerDir+'/bootstrap/dist/js/bootstrap.js',
        config.assetsDir+'/js/app.js',

        //vueapp
        'web/js/bundle.js'

    ], 'app.js');

});

gulp.task('fonts', function() {
    return app.copy(
        config.bowerDir+'/font-awesome/fonts/*',
        'web/fonts'
    );
});

gulp.task('vue', function() {

    var b = browserify({
        entries: config.assetsDir+'/vue/main.js',
        debug: !config.production
    });

    b.plugin('vueify/plugins/extract-css', {out: 'web/css/bundle.css'});
    b.transform(vueify, {sass: sassOpts});
    b.transform(babelify);

    return b.bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(gulp.dest('web/js/'));

});

gulp.task('watch', function() {
    gulp.watch(config.assetsDir+'/'+config.sassPattern, ['styles']);
    gulp.watch(config.assetsDir+'/'+config.jsPattern, ['scripts']);
});

gulp.task('watch-vue', function() {
    gulp.watch(config.assetsDir+'/'+config.sassPattern, ['styles']);
    gulp.watch(config.assetsDir+'/'+config.jsPattern, ['scripts']);
    gulp.watch(config.assetsDir+'/'+config.vuePattern, ['build-vue-for-watch']);
    gulp.watch(config.assetsDir+'/vue/main.js', ['build-vue-for-watch']);
});

gulp.task('clean', function() {
    if(config.useManifest)
        del.sync(config.revManifestPath);

    del.sync('web/css/*');
    del.sync('web/js/*');
    del.sync('web/fonts/*');
});


gulp.task('clean-vue', function() {
    del.sync('web/css/bundle.css');
    del.sync('web/js/bundle.js');
});

gulp.task('build-vue', function(callback) {
    runSequence('clean', 'vue', ['styles', 'scripts'], ['clean-vue', 'fonts'] , callback);
});

gulp.task('build-vue-for-watch', function(callback) {
    runSequence('vue', ['styles', 'scripts'], callback);
});

gulp.task('build', ['clean', 'styles', 'scripts', 'fonts']);
gulp.task('default', ['build', 'watch']);
gulp.task('default-vue', ['build-vue', 'watch-vue']);
