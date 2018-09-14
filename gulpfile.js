const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const babel = require('gulp-babel');
const less = require('gulp-less');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cssmin = require('gulp-cssmin');
const hashsum = require('gulp-hashsum');
const sourcemaps = require('gulp-sourcemaps');
const runSequence = require('run-sequence');
const rename = require('gulp-rename');
const del = require('del');

const src = JSON.parse(fs.readFileSync('./src.js.json'));
const sourcemapDir = '../maps';

const ASSETS = path.resolve('./assets');
const DIST = path.resolve('./assets/dist');

const paths = {
  app: {
    source: `${ASSETS}/js/app`,
    output: { folder: `${DIST}/js`, filename: 'app.js' }
  },
  geo: {
    source:  `${ASSETS}/js/app/components/geoWidget`,
    output: { folder: `${DIST}/js`, filename: 'geo.js' }
  },
  flat: {
    source: `${ASSETS}/js/app`,
    output: { folder: `${DIST}/js`, filename: 'flat.js' }
  },
  vendor: {
    source: `${ASSETS}/js/lib`,
    output: { folder: `${DIST}/js`, filename: 'vendor.js' }
  },
  less: {
    source: `${ASSETS}/less/main.less`,
    output: { folder: `${DIST}/css`, filename: 'main.css' }
  }
};

gulp.task('clean', () => del([DIST]));

gulp.task('build:app', () => {
  return gulp
    .src(src.app)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat(paths.app.output.filename))
    // .pipe(uglify())
    .pipe(sourcemaps.write(sourcemapDir))
    .pipe(gulp.dest(paths.app.output.folder));
  }
);

gulp.task('build:geo', () => {
  return gulp
    .src(src.geo)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat(paths.geo.output.filename))
    .pipe(sourcemaps.write(sourcemapDir))
    .pipe(gulp.dest(paths.geo.output.folder));
  }
);

gulp.task('build:flat', () => {
  return gulp
    .src(src.flat)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat(paths.flat.output.filename))
    // .pipe(uglify())
    .pipe(sourcemaps.write(sourcemapDir))
    .pipe(gulp.dest(paths.flat.output.folder));
  }
);

gulp.task('build:vendor', () =>
  gulp
    .src(src.vendor)
    .pipe(sourcemaps.init())
    .pipe(concat(paths.vendor.output.filename))
    .pipe(uglify())
    .pipe(sourcemaps.write(sourcemapDir))
    .pipe(gulp.dest(paths.vendor.output.folder))
);

gulp.task('build:less', () =>
  gulp
    .src(paths.less.source)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(cssmin())
    // .pipe(rename(paths.less.output.filename))
    .pipe(sourcemaps.write(sourcemapDir))
    .pipe(gulp.dest(paths.less.output.folder))
);

gulp.task('update:versions', () =>
  gulp
    .src(
      Object.keys(paths)
        .map(k => paths[k].output)
        .map(o => o.folder + '/' + o.filename)
    )
    .pipe(
      hashsum({
        filename: 'src.versions.json',
        hash: 'md5',
        json: true
      })
    )
);

gulp.task('watch:app', () =>
  gulp.watch(paths.app.source + '/**/*.js', ['build:app', 'update:versions'])
);
gulp.task('watch:geo', () =>
  gulp.watch(paths.geo.source + '/**/*.js', ['build:geo', 'update:versions'])
);
gulp.task('watch:flat', () =>
  gulp.watch(paths.app.source + '/**/*.js', ['build:flat', 'update:versions'])
);
gulp.task('watch:vendor', () =>
  gulp.watch(paths.vendor.source + '/**/*.js', ['build:vendor', 'update:versions'])
);
gulp.task('watch:less', () =>
  gulp.watch(ASSETS + '/less/**/*.less', ['build:less', 'update:versions'])
);

gulp.task('watch', ['build', 'watch:vendor', 'watch:app', 'watch:geo', 'watch:flat', 'watch:less']);
gulp.task('build', ['clean'], () =>
  runSequence(['build:vendor', 'build:app', 'build:geo', 'build:flat', 'build:less'], 'update:versions')
);

gulp.task('default', ['build']);
