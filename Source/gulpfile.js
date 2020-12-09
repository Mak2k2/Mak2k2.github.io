var { watch, src, dest, parallel, series } = require('gulp');
var browserSync = require('browser-sync');
var pug = require('gulp-pug');
var imagemin = require('gulp-imagemin');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var del = require('del');
const webpack = require('webpack-stream');
var { src, dest, parallel } = require('gulp');
var plumber = require('gulp-plumber');
//var htmlbeautify = require('gulp-html-beautify');

// Девсервер
function devServer(cb) {
  var params = {
    watch: true,
    reloadDebounce: 150,
    notify: false,
    server: { baseDir: './build' },
  };

  browserSync.create().init(params);
  cb();
}

function clearBuild() {
  return del('build/');
}

function buildStyles() {
  return src('src/styles/*.scss')
    .pipe(plumber({ errorHandler }))
    .pipe(sass())
    .pipe(postcss([
      autoprefixer(),
      cssnano()
    ]))
    .pipe(dest('build/styles/'));
}

function HtmlPages() {
  // Пути можно передавать массивами
  return src('src/pages/*.html')
    .pipe(dest('build/'));
}

function buildPages() {
  // Пути можно передавать массивами
  return src('src/pages/*.pug')
    .pipe(pug({pretty: true}))
    .pipe(dest('build/'));
}

function buildScripts() {
  return src('src/scripts/*.js')
    .pipe(plumber({ errorHandler }))
    .pipe(webpack({ output: { filename: 'bundle.js' } }))
    .pipe(dest('build/scripts/'));
}

// function buildAssets() {
//   return src('src/assets/**/*.*')
//     .pipe(dest('build/assets/'));
// }

function buildAssets(cb) {
  // Уберём пока картинки из общего потока
  src(['src/assets/**/*.*', '!src/assets/img/**/*.*'])
    .pipe(dest('build/assets/'));

  src('src/assets/img/**/*.*')
    .pipe(imagemin())
    .pipe(dest('build/assets/img'));

  // Раньше функция что-то вовзращала, теперь добавляем вместо этого искусственый колбэк
  // Это нужно, чтобы Галп понимал, когда функция отработала и мог запустить следующие задачи
  cb();
}

function errorHandler(errors) {
  console.warn('Error!');
  console.warn(errors);
}

/*function htmlbeautify() {
  var options = {
    "indent_size": 4,
    "indent_char": " ",
    "eol": "\n",
    "indent_level": 0,
    "indent_with_tabs": false,
    "preserve_newlines": true,
    "max_preserve_newlines": 10,
    "jslint_happy": false,
    "space_after_anon_function": false,
    "brace_style": "collapse",
    "keep_array_indentation": false,
    "keep_function_indentation": false,
    "space_before_conditional": true,
    "break_chained_methods": false,
    "eval_code": false,
    "unescape_strings": false,
    "wrap_line_length": 0,
    "wrap_attributes": "auto",
    "wrap_attributes_indent_size": 4,
    "end_with_newline": false
  };
  src('/build/*.html')
    .pipe(htmlbeautify(options))
    .pipe(gulp.dest('/build/'))
}*/

// Отслеживание
function watchFiles() {
  watch(['src/pages/**/*.pug', 'src/blocks/**/*.pug'], buildPages);
  watch('src/scripts/**/*.js', buildScripts);
  watch('src/assets/**/*.*', buildAssets);
  watch('src/styles/*.scss', buildStyles);
  watch('src/pages/*.html', HtmlPages);
}

exports.default =
  series(
    clearBuild,
    parallel(
      devServer,
      series(
        parallel(buildPages, buildStyles, HtmlPages, buildScripts, buildAssets),
        watchFiles
      )
    )
	);