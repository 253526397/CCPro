"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
var path_1 = require("path");
var child_process_1 = require("child_process");

function getProjectPath() {
    var editor = Editor;
    var proj = editor.Project;
    return (proj && proj.path) || '';
}

exports.methods = {
    showLog: function () {
        console.log('Hello World');
    },
    configExport: function () {
        var projectPath = getProjectPath();
        var batPath = path_1.join(projectPath, 'config', 'exceltools.bat');
        console.log('[tools] Running: ' + batPath);

        var child = child_process_1.spawn('cmd', ['/c', batPath], { cwd: path_1.join(projectPath, 'config') });

        child.stdout.on('data', function (data) {
            console.log(data.toString().replace(/\r?\n$/, ''));
        });

        child.stderr.on('data', function (data) {
            console.error(data.toString().replace(/\r?\n$/, ''));
        });

        child.on('close', function (code) {
            var status = code === 0 ? 'Done!' : 'Exited with code: ' + code;
            console.log('[tools] ' + status);
        });
    },
};

function load() { }
exports.load = load;

function unload() { }
exports.unload = unload;
