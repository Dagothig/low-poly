var gulp = require('gulp');

gulp.task('client', function(cb) {
    var ts = require('gulp-typescript');
    var concat = require('gulp-concat');

    return gulp.src('client/main.ts')
        .pipe(ts(ts.createProject('tsconfig.json', {
            typescript: require('typescript')
        })))
        .pipe(gulp.dest('public/js'));
});

gulp.task('watch-client', function(cb) {
    return gulp.watch([
        "client/**/*.ts"
    ], ['client']);
});

gulp.task('default', ['client', 'watch-client']);