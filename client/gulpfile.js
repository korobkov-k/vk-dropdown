var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var gulpSequence = require('gulp-sequence')
var jsFiles = 'src/*.js';
var jsDest = 'dist/';

gulp.task('build', function() {
    return gulp.src(jsFiles)
        .pipe(concat('dropdown-bundle.js'))
        .pipe(gulp.dest(jsDest))
        .pipe(rename('dropdown-bundle.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});

gulp.task('copyToServer', function() {
    return gulp.src('dist/dropdown-bundle.min.js')
        .pipe(gulp.dest('../server/public/javascripts'))
});

gulp.task('watch',function(){
    gulp.watch(['src/*.js'], gulpSequence('build', 'copyToServer'));
});

gulp.task('default', gulpSequence(['watch', 'build'], 'copyToServer'));

