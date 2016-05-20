const defaultLockFile = require('./defaultLockFile');
const co = require('co');
const fs = require('mz/fs');
const timeInSeconds = require('./timeInSeconds');

/**
 * Touch a file
 * @param  {string} path to the file
 * @return {Promise<>}
 */
function create(lockFilePath = defaultLockFile) {
    return co(function*() {
        const time = timeInSeconds();
        yield fs.utimes(lockFilePath, time, time);
    });
}

module.exports = create;
