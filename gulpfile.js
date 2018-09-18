const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const babel = require('gulp-babel');
const less = require('gulp-less');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cssmin = require('gulp-cssmin');
const sourcemaps = require('gulp-sourcemaps');
const runSequence = require('run-sequence');
// const rename = require('gulp-rename');
const del = require('del');

// const src = JSON.parse(fs.readFileSync('./src.js.json'));

const ASSETS = path.resolve('./js');
const DIST = path.resolve('./dist');
const MAPS = `./${DIST}/maps`;

const paths = {
  app: {
    source: `${ASSETS}`,
    output: { folder: `${DIST}`, filename: 'app.js' }
  },
  less: {
    source: `${ASSETS}/less/main.less`,
    output: { folder: `${DIST}/css`, filename: 'main.css' }
  }
};

const onError = error => {
  gutil.log(gutil.colors.red('[Error]'), error.toString());
}

gulp.task('clean', () => del([DIST]));

gulp.task('build:app', () =>
  gulp
    .src(`${paths.app.source}\\geoWidget.js`)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .on('error', err => onError(err))
    .pipe(concat(paths.app.output.filename))
    .pipe(uglify())
    .on('error', err => onError(err))
    .pipe(sourcemaps.write(MAPS))
    .pipe(gulp.dest(paths.app.output.folder))
);

gulp.task('build:less', () =>
  gulp
    .src(paths.less.source)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(cssmin())
    .pipe(sourcemaps.write(MAPS))
    .pipe(gulp.dest(paths.less.output.folder))
);

gulp.task('watch:app', () =>
  gulp.watch(`${paths.app.source}/*.js`, ['build:app'])
);
gulp.task('watch:less', () =>
  gulp.watch(`${ASSETS}/less/**/*.less`, ['build:less'])
);

gulp.task('watch', ['build', 'watch:app' /*, 'watch:less'*/]);
gulp.task('build', ['clean'], () =>
  runSequence(['build:app' /*, 'build:less'*/])
);

gulp.task('default', ['build']);
