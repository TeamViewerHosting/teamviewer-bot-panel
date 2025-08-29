const child_process = require('child_process');
const EventEmitter = require('events');
const extend = require('extend');

const CONSOLE_PATH = '/opt/teamviewer/ipc/bin/console';

class teamviewerConsole extends EventEmitter {
    constructor() {
        super();
        var self = this;
        this.init = false;
        this.process = child_process.spawn(CONSOLE_PATH);
        this.process.on('exit', function (code) {
            self.init = false;
            self.emit('exit');
            console.log('[!] teamviewer console exited with code', code);
        });
        var buff = '';
        this.process.stdout.on('data', function (data) {
            var z = data.toString();
            for (var i = 0; i < z.length; i++) {
                if (z[i] == '\n') {
                    try {
                        var cleanBuff = buff.replace(/[\uFFFD\uFFFE\uFFFF]/g, '');
                        var d = JSON.parse(cleanBuff);
                        self.emit('data', d);
                    } catch (e) {
                        console.log('Error parsing IPC data:', e.message);
                        console.log('Raw buffer:', buff);
                        self.emit('data', null);
                    }
                    buff = '';
                } else {
                    buff += z[i];
                }
            }
        });
        this.on('data', function (data) {
            if (!data) return;
            if (data.init) {
                self.init = true;
                self.emit('init');
            };
        });
    }
    command(cmd, data, callback) {
        data = data || {};
        extend(data, { "command": cmd });
        this.process.stdin.write(JSON.stringify(data) + '\n');
        if (callback)
            this.once('data', callback);
    }
    stop() {
        this.command("exit", {});
    }
}

module.exports = teamviewerConsole;
