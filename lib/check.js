const defaultLockFile = require('./defaultLockFile');
const co = require('co');
const fs = require('mz/fs');

const INVALID_LOCKFILE = 'Lockfile invalid';

const EPERM = 'EPERM';
const ESRCH = 'ESRCH';

/**
 * Check lock file validity
 * @param  {string} path to the lock file
 * @return {Promise}
 */
function check(lockFilePath = defaultLockFile) {
    return co(function*() {
        const stats = yield fs.stat(lockFilePath);
        const time = Date.now();

        const contents = (yield fs.readFile(lockFilePath)).toString();

        // if there is a pid, see if the process is still alive
        if (contents !== '0') {
            try {
                // check for process existence
                return process.kill(contents, 0);
            } catch (e) {
                if (e.code === EPERM) {
                    return true;
                }
                if (e.code === ESRCH) {
                    throw new Error(INVALID_LOCKFILE);
                }
                throw e;
            }
        }

        // Without a pid lockfile is still valid
        // if newer than 5 min
        const fileTime = new Date(stats.mtime).getTime();
        if (time < fileTime + 300000) {
            return true;
        }
        throw new Error(INVALID_LOCKFILE);
    });
}

module.exports = check;
