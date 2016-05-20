const timeInSeconds = require('./timeInSeconds');
const check = require('./check');
const remove = require('./remove');
const defaultLockFile = require('./defaultLockFile');
const co = require('co');
const os = require('os');
const fs = require('mz/fs');
const path = require('path');
const MAX_SLEEP = 60;
const LOCKFILE_ALREADY_EXISTS = 'Lockfile already exists';

// ref http://linux.die.net/man/3/lockfile_create
function uniqueLinkName() {
    return `.lk${process.pid}${timeInSeconds() & 15}${os.hostname()}`;
}

function weCanRetry(i, tries) {
    return i < tries && tries > 0;
}

function sleepPromise(seconds) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}

/**
 * create a lock file
 * @param  {string} path to the lockfile
 * @param  {object} options, takes pid and retries
 * @return {Promise}
 */
function create(lockFilePath = defaultLockFile, {
    pid = null,
    retries = 0,
} = {}) {
    return co(function*() {
        let tries = retries + 1;
        const tempLinkPath = path.join(path.parse(lockFilePath).dir, uniqueLinkName());
        let sleepTime = 0;

        try {
            // 1 - A unique file is created
            const buffer = pid === null ? new Buffer('0', 'utf8') : new Buffer(String(pid), 'utf8');
            const fd = yield fs.open(tempLinkPath, 'wx', '0644');
            yield fs.write(fd, buffer, 0, buffer.length);
            yield fs.close(fd);
            const tempStats = yield fs.stat(tempLinkPath);
            let sleep = false;

            for (
                let i = 0;
                weCanRetry(i, tries);
                ++i
            ) {
                if (sleep) {
                    sleepTime += 5;
                    if (sleepTime > MAX_SLEEP) {
                        sleepTime = MAX_SLEEP;
                    }
                    yield sleepPromise(sleepTime);
                }
                sleep = true;

                // 2 - The lock file is created using link, the return value is ignored
                try {
                    yield fs.link(tempLinkPath, lockFilePath);
                } catch (e) {
                    // FALL THROUGH
                }
                try {
                    // 3 - The new lockfile is stat()ed if it fails go to stop 6
                    const stats = yield fs.stat(lockFilePath);
                    // 4 - The stat value is compared with that of temporary file
                    // ref https://sourcecodebrowser.com/liblockfile/1.07/dotlockfile_8c.html#a3c04138a5bfe5d72780bb7e82a18e627
                    if (tempStats.ino !== stats.ino || tempStats.dev !== stats.dev) {
                        throw new Error(LOCKFILE_ALREADY_EXISTS);
                    }
                    // 4cont - The temporary file is deleted
                    yield fs.unlink(tempLinkPath);
                    // 5 - Check validity of existing lockfile, not valid => delete
                    try {
                        yield check(lockFilePath);
                    } catch (e) {
                        yield remove(lockFilePath);
                        sleep = false;
                        if (tries === 1) {
                            ++tries;
                        }
                    }
                    break;
                } catch (e) {
                    // 6 - Before retrying we sleep for i seconds
                    if (!weCanRetry(i + 1, tries)) {
                        throw e;
                    }
                    continue;
                }
            }
        } catch (e) {
            yield fs.unlink(tempLinkPath);
            throw e;
        }
        return () => remove(lockFilePath);
    });
}

module.exports = create;
