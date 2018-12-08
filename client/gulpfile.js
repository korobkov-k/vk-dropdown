var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var gulpSequence = require('gulp-sequence');
var jsFiles = ['src/js/set-frontend-users.js', 'src/js/dropdown.js', 'src/js/dropdown-controller.js'];
var cssFiles = ['src/css/*.css'];
var dest = 'dist';

gulp.task('buildJS', function() {
    return gulp.src(jsFiles)
        .pipe(concat('dropdown-bundle.js'))
        .pipe(gulp.dest(dest))
        .pipe(rename('dropdown-bundle.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest));
});

gulp.task('buildCSS', function() {
    return gulp.src(cssFiles)
        .pipe(concat('dropdown.css'))
        .pipe(gulp.dest(dest))
        .pipe(rename('dropdown.min.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest(dest));
});

gulp.task('copyJsToServer', function() {
    return gulp.src('dist/dropdown-bundle.js')
        .pipe(gulp.dest('../server/public/javascripts'))
});
gulp.task('copyCssToServer', function() {
    return gulp.src('dist/dropdown.css')
        .pipe(gulp.dest('../server/public/stylesheets'))
});

gulp.task('watch',function(){
    gulp.watch(['src/js/*.js', "src/css/*.css"], function (event) {
        gulpSequence(['buildJS', 'buildCSS'], ['copyJsToServer','copyCssToServer'])(function (err) {
            if (err) console.log(err)
        })
    });
});

gulp.task('default', gulpSequence(['watch', 'buildJS', 'buildCSS'], ['copyJsToServer','copyCssToServer']));

