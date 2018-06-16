/*eslint-env node*/

const fs = require('fs');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const useref = require('gulp-useref');
const cleanCSS = require('gulp-clean-css');
const rename = require("gulp-rename");
const babelMinify = require('babel-minify');
const child_process = require('child_process');
const merge = require('merge-stream');

function minifyJs(fileName) {
	const content = fs.readFileSync(fileName, 'utf8');
	const minifiedContent = babelMinify(content).code;
	fs.writeFileSync(fileName, minifiedContent);
	console.log(
		`[${fileName}]: ${content.length}kb -> ${minifiedContent.length}kb`
	);
}
gulp.task('runWebpack', function () {
	return child_process.execSync('yarn run build');
});

gulp.task('copyFiles', function () {
	return merge(
		gulp
		.src('src/lib/codemirror/theme/*')
		.pipe(gulp.dest('app/lib/codemirror/theme')),
		gulp
		.src('src/lib/codemirror/mode/**/*')
		.pipe(gulp.dest('app/lib/codemirror/mode')),
		gulp.src('src/lib/transpilers/*').pipe(gulp.dest('app/lib/transpilers')),
		gulp.src('src/lib/screenlog.js').pipe(gulp.dest('app/lib')),
		gulp.src('src/preview.html').pipe(gulp.dest('app')),
		gulp.src('src/detached-window.js').pipe(gulp.dest('app')),
		gulp.src('src/icon-48.png').pipe(gulp.dest('app')),
		gulp.src('src/icon-128.png').pipe(gulp.dest('app')),
		gulp.src('src/patreon.png').pipe(gulp.dest('app')),
		gulp.src('build/bundle.*.js').pipe(rename("script.js")).pipe(gulp.dest('app')),
		gulp.src('build/vendor.*.js').pipe(rename("vendor.js")).pipe(gulp.dest('app')),

		gulp.src('src/lib/codemirror/lib/codemirror.css').pipe(gulp.dest('build/lib/codemirror/lib')),
		gulp.src('src/lib/codemirror/addon/hint/show-hint.css').pipe(gulp.dest('build/lib/codemirror/addon/hint')),
		gulp.src('src/lib/codemirror/addon/fold/foldgutter.css').pipe(gulp.dest('build/lib/codemirror/addon/fold')),
		gulp.src('src/lib/codemirror/addon/dialog/dialog.css').pipe(gulp.dest('build/lib/codemirror/addon/dialog')),
		gulp.src('src/lib/hint.min.css').pipe(gulp.dest('build/lib')),
		gulp.src('src/lib/inlet.css').pipe(gulp.dest('build/lib')),
		gulp.src('src/style.css').pipe(gulp.dest('build')),

		gulp
		.src([
			'src/FiraCode.ttf',
			'src/FixedSys.ttf',
			'src/Inconsolata.ttf',
			'src/Monoid.ttf'
		])
		.pipe(gulp.dest('app'))
	);
});

gulp.task('useRef', function () {
	return gulp
		.src('build/index.html')
		.pipe(useref())
		.pipe(gulp.dest('app'));
});

gulp.task('minify', function () {
	// minifyJs('app/script.js');
	// minifyJs('app/vendor.js');
	minifyJs('app/lib/screenlog.js');

	gulp
		.src('app/*.css')
		.pipe(
			cleanCSS({
				debug: true
			}, details => {
				console.log(`${details.name}: ${details.stats.originalSize}`);
				console.log(`${details.name}: ${details.stats.minifiedSize}`);
			})
		)
		.pipe(gulp.dest('app'));
});

gulp.task('fixIndex', function () {
	var contents = fs.readFileSync('build/index.html', 'utf8');
	contents = contents.replace(/\<\!\-\- SCRIPT-TAGS \-\-\>[\S\s]*?\<\!\-\- END-SCRIPT-TAGS \-\-\>/, '<script defer src="vendor.js"></script><script defer src="script.js"></script>');
	fs.writeFileSync('build/index.html', contents, 'utf8');
});

gulp.task('generate-service-worker', function (callback) {
	var swPrecache = require('sw-precache');
	var rootDir = 'app';

	swPrecache.write(
		`${rootDir}/service-worker.js`, {
			staticFileGlobs: [
				rootDir + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'
			],
			stripPrefix: `${rootDir}/`,

			// has to be increased to around 2.8mb for sass.worker.js
			maximumFileSizeToCacheInBytes: 2900000
		},
		callback
	);
});

gulp.task('cleanup', function () {
	return child_process.execSync('rm -rf build');
});

gulp.task('release', function (callback) {
	runSequence(
		'runWebpack',
		'copyFiles',
		'fixIndex',
		'useRef',
		'minify',
		'generate-service-worker',
		'cleanup',
		function (error) {
			if (error) {
				console.log(error.message);
			} else {
				console.log('RELEASE FINISHED SUCCESSFULLY');
			}
			callback(error);
		});
});


// gulp.task('default', ['generate-service-worker']);
