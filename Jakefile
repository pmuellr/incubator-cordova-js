

desc("runs build");
task('default', ['build', 'test'], function () {});

desc("clean");
task('clean', ['set-cwd'], function () {
    var childProcess = require('child_process');
    var path = require("path");
    
    var DEPLOY = path.join(__dirname,"pkg");
    var cmd = 'rm -rf ' + DEPLOY + ' && ' +
              'mkdir ' + DEPLOY;

    childProcess.exec(cmd,complete);
}, true);

desc("compiles the source files for all extensions");
task('build', ['clean'], function () {

    var util = require('util'),
        fs = require('fs'),
        packager = require("./build/packager");

    packager.bundle("blackberry");
    packager.bundle("playbook");
    packager.bundle("ios");
    packager.bundle("wp7");
    packager.bundle("android");
    packager.bundle("errgen");

    util.puts(fs.readFileSync("build/dalek", "utf-8"));
});

desc("runs the unit tests in node");
task('test', ['set-cwd'], require('./test/runner').node);

desc("starts a webserver to point at to run the unit tests");
task('btest', ['set-cwd'], require('./test/runner').browser);

desc("make sure we're in the right directory");
task('set-cwd', [], function() {
    if (__dirname != process.cwd()) {
        process.chdir(__dirname)
    }
});

