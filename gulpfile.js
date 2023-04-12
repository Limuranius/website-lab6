'use strict';

const gulp = require('gulp');
const stylus = require('gulp-stylus');
const pug = require('gulp-pug');
const autoprefixer = require('gulp-autoprefixer');
const browsersync = require('browser-sync').create();

gulp.task('stylus', function(){
  return gulp.src('app/styl/*.styl')
    .pipe(stylus())
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('pug', function(){
  return gulp.src('app/pug/templates/*.pug')
    .pipe(pug({
      pretty: true
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('js', function(){
  return gulp.src('app/js/*.*')
    .pipe(gulp.dest('dist/js'));
});

gulp.task('build', gulp.series(gulp.parallel('pug','stylus','js')));

gulp.task('watch', function(){
  gulp.watch('app/styl/**/*.*', gulp.series('stylus'));
  gulp.watch('app/pug/**/*.*', gulp.series('pug'));
  gulp.watch('app/js/**/*.*', gulp.series('js'));
});

gulp.task('serve', function(){
  browsersync.init({
    server: 'dist'
  });

  browsersync.watch('dist/**/*.*').on('change', browsersync.reload);
});


gulp.task('tree', function(){
  return gulp.src('*.*',{read: false})
    .pipe(gulp.dest('./app'))
    .pipe(gulp.dest('./app/styl'))
    .pipe(gulp.dest('./app/pug'))
    .pipe(gulp.dest('./dist'))
    .pipe(gulp.dest('./dist/css'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(gulp.dest('./dist/fonts'))
    .pipe(gulp.dest('./dist/img'))
    .pipe(gulp.dest('./src'))
})

gulp.task('dev', gulp.series('tree', 'build', gulp.parallel('watch', 'serve')));