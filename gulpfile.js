/// <reference path="./typings/index.d.ts"/>
const gulp = require("gulp");
//const ts = require("gulp-typescript");
const merge = require("merge2");
const sourceMaps = require("source-map-support");
sourceMaps.install();
//let tsProject = ts.createProject("tsconfig.json");
let fs = require('fs');
let tsifyOptions = JSON.parse(fs.readFileSync('./tsconfig.json')).compilerOptions;
const browserify = require('browserify');
const tsify = require('tsify');
const _ = require('lodash');

gulp.task("build", () => {
    return browserify()
        .add('index.ts')
        .add('src/index.ts')
        .add('src/event.ts')
        .add('src/interfaces.ts')
        .add('test/basic.ts')
        .plugin(tsify, _.extend(tsifyOptions, {}))
        .bundle()
        .on('error', function (error) { console.error(error.toString()); })
        .pipe(fs.createWriteStream('index.js', {
            encoding: 'utf8',
            flags: "w",
            autoClose: true
        }));
});
gulp.task("default", ["build"], () => {
});
