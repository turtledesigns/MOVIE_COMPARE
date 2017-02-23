'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp'),
	gutil = require('gulp-util'),
	$ = require('gulp-load-plugins')(),
	del = require('del'),
	runSequence = require('run-sequence'),
	useref = require('gulp-useref'),
	replace = require('gulp-replace'),
	rename = require('gulp-rename'),
	jeditor = require("gulp-json-editor"),
	ftp = require("gulp-ftp"),
	argv = require('yargs').argv,
	fs = require('fs'),
	pkg = require('./package.json'),
	version = pkg.version;

/**
 * processes the source files for use in the win 10 app
 */
gulp.task('amendSource', function(){
	gulp.src('app/config.xml', {base:''})
	.pipe(replace(/(version=\")(.*?)(\" xmlns)/ig, "$1" + pkg.version + '$3'))
	.pipe(gulp.dest('app'));
    
	return gulp.src('app/www/icon.png')
	.pipe(gulp.dest('app/platforms/android/res/mipmap-hdpi'))
	.pipe(gulp.dest('app/platforms/android/res/mipmap-ldpi'))
	.pipe(gulp.dest('app/platforms/android/res/mipmap-mdpi'))
	.pipe(gulp.dest('app/platforms/android/res/mipmap-xhdpi'))
	.pipe(gulp.dest('app/res/mipmap-mdpi'))
	.pipe($.size({title: 'amendSource'}));
  });

gulp.task('ftp', function () {
	return gulp.src('release/BUILD_' + pkg.version + '/*')
	.pipe(ftp({
		host: 'XXXX',
		user: 'XXXX',
		pass: 'XXXX',
		remotePath: 'moviecompareapp/'
	}))
	.pipe(gutil.noop());
});

// copy assets
gulp.task('moveBuildToCorrectFolder', function (){
	return gulp.src('app/platforms/android/build/outputs/apk/android-debug.apk')
		.pipe(rename('MOVIE_COMPARE_v' + pkg.version + '.apk'))
		.pipe(gulp.dest('release/BUILD_' + pkg.version))
});

/**
 * increments version number in package.json
 */
gulp.task('version',function(){
	version = pkg.version.substr(0,pkg.version.lastIndexOf('.')+1) + String(Number(pkg.version.substr(pkg.version.lastIndexOf('.')+1,pkg.version.length))+1);
	return gulp.src('./package.json')
	.pipe(jeditor({
		'version': version
	},
				  // the second argument is passed to js-beautify as its option
				  {
		'indent_char': '\t',
		'indent_size': 1
	}))
	.pipe(gulp.dest("./"));
});

// Build Production Files, the Default Task
gulp.task('default', function (cb) {
	$.cache.clearAll();
});

// Load custom tasks from the `tasks` directory
try { require('require-dir')('tasks'); } catch (err) {}
