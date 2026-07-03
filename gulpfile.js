// var gulp = require('gulp');
// var htmlmin = require('gulp-htmlmin');
// var fileInline = require('gulp-file-inline');
// var uglify = require('gulp-uglify');
// var jsonmin = require('gulp-jsonmin');

// var path = __dirname + '/build/web-mobile/';
// var distPath = __dirname + '/build/minify-web-mobile/';

// // 压缩html 内联css
// gulp.task('htmlmin', function (cb) {
//     gulp.src([path + 'index.html'])
//         .pipe(fileInline())
//         .pipe(htmlmin({
//             collapseWhitespace: true, //移出空格
//             removeComments: true, //删除注释
//             minifyJS: true,
//             minifyCSS: true,
//         }))
//         .pipe(gulp.dest(distPath))
//         .on('end', cb);
// });

// // 压缩js
// gulp.task('script', function (cb) {
//     gulp.src(path + '**/*.js')
//         .pipe(uglify())
//         .pipe(gulp.dest(distPath))
//         .on('end', cb);
// });

// // 压缩json
// gulp.task('minify-json', function (cb) {
//     gulp.src(path + '**/*.json') // 匹配所有 JSON 文件
//         .pipe(jsonmin())
//         .pipe(gulp.dest(distPath))
//         .on('end', cb);
// });

// // 将三个任务组合为一个任务一起执行

// gulp.task('minify-web-mobile', gulp.series('minify-json', /* 'htmlmin',  */'script'));

module.exports = require('./gulp/dist');