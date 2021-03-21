'use strict';
const {src, dest, series, parallel, watch} = require('gulp');
const fileinclude = require('gulp-file-include');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps'); 
const cleanCss = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const tinypng = require('gulp-tinypng-compress');
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const webpcss = require("gulp-webpcss");
const spritesmith = require('gulp.spritesmith');
const svgmin = require('gulp-svgmin');
const svgSprites = require('gulp-svg-sprites');
const ttf2woff2 = require('gulp-ttf2woff2');
const ttf2woff = require('gulp-ttf2woff');
const fonter = require('gulp-fonter');
const del = require('del');
const browserSync = require('browser-sync');

const gulpif = require('gulp-if');
const argv = require('yargs').argv;

const path = {
    source: {
        html: 'src/*.*',
        css: ['src/style/variables/*.scss', 'src/style/lib/*.*', 'src/tpl/**/*.scss'],
        js: ['src/js/jquery/*.js', 'src/js/libjs/*.js', 'src/js/myjs/*.js'],
        img: 'src/img/**/*.*',
        sprite: 'src/img/sprite/*.png',
        svg: 'src/svg/*.svg',
        spritesvg: 'src/svg/sprite/*.svg',
        fonts: 'src/fonts/*.ttf',
        otf: 'src/fonts/*.otf'
    },
    build: {
        html: 'build/',
        css: 'build/assets/style/',
        js: 'build/assets/js/',
        img: 'build/assets/img/',
        sprite: 'src/',
        svg: 'build/assets/svg/',
        spritesvg: 'build/assets/svg/sprite/',
        fonts: 'build/assets/fonts/',
        otf: 'src/fonts/'
    },
    watch: {
        html: 'src/**/*.*',
        css: 'src/**/*.*',
        js: 'src/js/**/*.*',
        img: 'src/img/**/*.*',
        svg: 'src/svg/**/*.*'
    }
};

const html = () => {
    return src(path.source.html)
        .pipe(fileinclude({prefix: '@@', basepath: '@file'}))
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browserSync.stream());
}

const style = () => {
    return src(path.source.css)
        .pipe(sourcemaps.init())
        .pipe(concat('style.min.css'))
        .pipe(webpcss())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(gulpif(argv.prod, cleanCss({level: {2: {mergeMedia: true}}})))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream());
}

const js = () => {
    return src(path.source.js)
        .pipe(concat('main.min.js'))
        .pipe(terser())
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream());
}

const img = () => {
        src(path.source.img)
        .pipe(webp({quality: 70}))
        .pipe(dest(path.build.img))
        return src(path.source.img)
        .pipe(tinypng({key: '1TVlzWyyCl95vn5hcvjkBwDS4yT4bbMZ', sigFile: '.tinypng-sigs', log: true}))
        .pipe(dest(path.build.img))
        .pipe(browserSync.stream());
}

const spriteimg = () => {
    return src(path.source.sprite)
    .pipe(spritesmith({imgName: 'img/common/sprite.png', cssName: 'style/lib/sprite.css', imgPath: '../img/common/sprite.png'}))
    .pipe(dest(path.build.sprite))
}

const svg = () => {
    return src(path.source.svg)
        .pipe(svgmin())
        .pipe(dest(path.build.svg))
        .pipe(browserSync.stream());
}

const spritesvg = () => {
    return src(path.source.spritesvg)
        .pipe(svgmin())
        .pipe(svgSprites({preview: false, cssFile: "../../../../src/style/lib/spritesvg.css", svgPath: '../svg/sprite/%f', svg: {sprite: 'sprite/spritesvg.svg'}}))
        .pipe(dest(path.build.spritesvg))
        .pipe(browserSync.stream());
}

const otf = () => {
    return src(path.source.otf)
        .pipe(fonter({formats: ['ttf']}))
        .pipe(dest(path.build.otf));
}

const ttf = () => {
    src(path.source.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
    return src(path.source.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
}

const browserSyncServer = () => {
    browserSync.init({
        server: {
            baseDir: "./build"
        }
    });
}

const browserSyncProxy = () => {
    browserSync.init({
        proxy: "namedir"
    });
}

const clean = () => {
    return del(['build/*.*', 'build/assets/**', '!build/assets', '!build/assets/img/**', '!build/assets/fonts/**', '!build/assets/svg/**']);
}

const cleanimg = () => {
    return del(['build/assets/img','.tinypng-sigs']);
}

const cleanfonts = () => {
    return del(['build/assets/fonts']);
}

const watcher = () => {
    watch(path.watch.html, html);
    watch(path.watch.css, style);
    watch(path.watch.js, js);
    watch(path.watch.img, img);
    watch(path.watch.svg, svg);
}

let build = series(clean, parallel(html, style, js, img, svg));
let fonts = series(otf,ttf);

exports.html = html;
exports.style = style;
exports.js = js;
exports.img = img;
exports.svg = svg;

exports.watcher = watcher;
exports.spritesvg = spritesvg;
exports.spriteimg = spriteimg;
exports.fonts = fonts;
exports.clean = clean;
exports.cleanimg = cleanimg;
exports.cleanfonts = cleanfonts;
exports.build = build;

exports.default = series(build, parallel(browserSyncServer, watcher));
exports.modx = series(build, parallel(browserSyncProxy, watcher));