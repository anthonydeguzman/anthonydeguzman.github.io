const gulp = require("gulp");
const uglify = require("gulp-uglify");
const cleanCSS = require("gulp-clean-css"); // You'll need to install this
const rename = require("gulp-rename");
const pump = require("pump");

// JavaScript minification task
gulp.task("compress-js", (callback) => {
  pump(
    [
      gulp.src(["script.js"]),
      uglify(),
      rename({ suffix: "-min" }),
      gulp.dest("./"),
    ],
    callback
  );
});

// CSS minification task
gulp.task("compress-css", (callback) => {
  pump(
    [
      gulp.src(["styles.css"]),
      cleanCSS(), // Minify CSS
      rename({ suffix: "-min" }),
      gulp.dest("./"),
    ],
    callback
  );
});

// Combined task
gulp.task("compress", gulp.parallel("compress-js", "compress-css"));
