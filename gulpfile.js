const gulp = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const pump = require('pump');

gulp.task('compress', callback => {
	pump([
		gulp.src('js/portfolio.js'),
		uglify(),
		rename({suffix:'-min'}),
		gulp.dest('js')
	], callback);
});
