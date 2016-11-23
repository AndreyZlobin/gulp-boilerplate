var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var Q = require('q');

var config = {
    assetsDir: 'src',
    sassPattern: 'scss/**/*.scss',
    jsPattern: 'js/**/*.js',
    bowerDir: 'bower_components',
    production: !!plugins.util.env.production,
    sourceMaps: !plugins.util.env.production,
    //https://knpuniversity.com/screencast/gulp/version-cache-busting
    revManifestPath: 'rev-manifest.json',
    useManifest: false
};

var app = {};

app.addStyle = function(paths, outputFilename) {
    return gulp.src(paths)
        .pipe(plugins.plumber(function(error) {
            console.log(error.toString());
            this.emit('end');
        }))
        .pipe(plugins.if(config.sourceMaps, plugins.sourcemaps.init()))
        .pipe(plugins.sass())
        .pipe(plugins.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(plugins.concat('css/'+outputFilename))
        .pipe(config.production ? plugins.minifyCss() : plugins.util.noop())
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

var Pipeline = function() {
    this.entries = [];
};
Pipeline.prototype.add = function() {
    this.entries.push(arguments);
};
Pipeline.prototype.run = function(callable) {
    var deferred = Q.defer();
    var i = 0;
    var entries = this.entries;
    var runNextEntry = function() {
        // see if we're all done looping
        if (typeof entries[i] === 'undefined') {
            deferred.resolve();
            return;
        }
        // pass app as this, though we should avoid using "this"
        // in those functions anyways
        callable.apply(app, entries[i]).on('end', function() {
            i++;
            runNextEntry();
        });
    };
    runNextEntry();
    return deferred.promise;
};


gulp.task('styles', function () {
    var pipeline = new Pipeline();

    pipeline.add([
        config.assetsDir+'/scss/app.scss'
    ], 'app.css');

    return pipeline.run(app.addStyle);
});

gulp.task('scripts', function() {
    var pipeline = new Pipeline();

    pipeline.add([
        config.bowerDir+'/jquery/dist/jquery.js',
        config.bowerDir+'/tether/dist/js/tether.js',
        config.bowerDir+'/bootstrap/dist/js/bootstrap.js',
        config.assetsDir+'js/app.js'
    ], 'app.js');

    return pipeline.run(app.addScript);
});

gulp.task('fonts', function() {
    return app.copy(
        config.bowerDir+'/font-awesome/fonts/*',
        'web/fonts'
    );
});

gulp.task('watch', function() {
    gulp.watch(config.assetsDir+'/'+config.sassPattern, ['styles']);
    gulp.watch(config.assetsDir+'/'+config.jsPattern, ['scripts']);
});

gulp.task('clean', function() {
    if(config.useManifest)
        del.sync(config.revManifestPath);

    del.sync('web/css/*');
    del.sync('web/js/*');
    del.sync('web/fonts/*');
});

gulp.task('default', ['clean', 'styles', 'scripts', 'fonts', 'watch']);