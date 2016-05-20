const defaultLockFile = require('./defaultLockFile');
const co = require('co');
const fs = require('mz/fs');

const ENOENT = 'ENOENT';

/**
 * remove lock file
 * @param  {string} path to the lockfile
 * @return {Promise<>}
 */
function remove(lockFilePath = defaultLockFile) {
    return co(function*() {
        try {
            yield fs.unlink(lockFilePath);
        } catch (e) {
            if (e.code !== ENOENT) {
                throw e;
            }
            // FALL THROUGH
        }
    });
}

module.exports = remove;
