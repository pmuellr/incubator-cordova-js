
var util         = require('util')
var fs           = require('fs')
var childProcess = require('child_process')
var path         = require("path")

desc("runs build");
task('default', ['build', 'test'], function () {});

desc("clean");
task('clean', ['set-cwd'], function () {
    
    var DEPLOY = path.join(__dirname,"pkg");
    var cmd = 'rm -rf ' + DEPLOY + ' && ' +
              'mkdir ' + DEPLOY;

    childProcess.exec(cmd,complete);
}, true);

desc("compiles the source files for all extensions");
task('build', ['clean'], function () {

    var packager = require("./build/packager");

    packager.write("blackberry");
    packager.write("playbook");
    packager.write("ios");
    packager.write("wp7");
    packager.write("android");
    packager.write("errgen");

});

desc("prints a dalek");
task('dalek', ['set-cwd'], function () {
    util.puts(fs.readFileSync("build/dalek", "utf-8"));
})

desc("runs the unit tests in node");
task('test', ['set-cwd'], require('./test/runner').node);

desc("starts a webserver to point at to run the unit tests");
task('btest', ['set-cwd'], require('./test/runner').browser);

desc("build graphviz pictures")
task('graphviz', ['set-cwd'], function() {
    require('./build/gv-requires')
})

desc("make sure we're in the right directory");
task('set-cwd', [], function() {
    if (__dirname != process.cwd()) {
        process.chdir(__dirname)
    }
});

