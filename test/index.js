/* eslint-env mocha */

const assert = require('power-assert');
const dotlockfile = require('../');
const fs = require('mz/fs');
const path = require('path');
const timeInSeconds = require('../lib/timeInSeconds');
const defaultLockFile = require('../lib/defaultLockFile');

const {
    create,
    remove,
    check,
    touch,
} = dotlockfile;

function wrongPath() {
    throw new Error('Should not have been called');
}

describe('dotlockfile', function() {
    const testLockFilePath = path.join(__dirname, '/file.lock');
    const ENOENT = 'ENOENT';
    const LOCKFILE_ALREADY_EXISTS = 'Lockfile already exists';

    function* removeTestFile(_path = defaultLockFile) {
        try {
            fs.unlink(_path);
        } catch (e) {
            // FALL THROUGH
        }
    }

    beforeEach(function*() {
        yield* removeTestFile();
        yield* removeTestFile(testLockFilePath);
    });

    afterEach(function*() {
        yield* removeTestFile();
        yield* removeTestFile(testLockFilePath);
    });

    context('#check()', function() {
        it('throws if stale', function*() {
            const anteriorTime = timeInSeconds() - 300;
            yield fs.writeFile(testLockFilePath, '0', 'utf8');
            yield fs.utimes(testLockFilePath, anteriorTime, anteriorTime);
            try {
                yield check(testLockFilePath);
            } catch (e) {
                assert.equal(e.message, 'Lockfile invalid');
                return;
            }
            wrongPath();
        });

        it('throws if stale pid', function*() {
            yield fs.writeFile(testLockFilePath, '99999', 'utf8');
            try {
                yield check(testLockFilePath);
            } catch (e) {
                assert.equal(e.message, 'Lockfile invalid');
                return;
            }
            wrongPath();
        });

        it('does not throw if valid pid and stale', function*() {
            const anteriorTime = timeInSeconds() - 300;
            yield fs.writeFile(testLockFilePath, process.pid, 'utf8');
            yield fs.utimes(testLockFilePath, anteriorTime, anteriorTime);
            yield check(testLockFilePath);
        });

        it('does not throw if not stale', function*() {
            yield fs.writeFile(testLockFilePath, '0', 'utf8');
            yield check(testLockFilePath);
        });

        it('does not throw if valid pid and not stale', function*() {
            yield fs.writeFile(testLockFilePath, process.pid, 'utf8');
            yield check(testLockFilePath);
        });
    });

    context('#create()', function() {
        it('creates a lockfile', function*() {
            yield create(testLockFilePath);
            yield fs.stat(testLockFilePath);
        });

        it('there is a default lock file', function*() {
            yield create();
            try {
                yield create();
            } catch (e) {
                assert.equal(e.message, LOCKFILE_ALREADY_EXISTS);
                return;
            }
            wrongPath();
        });

        it('fails if trying lock without pid and already existing lock without pid', function*() {
            yield create(testLockFilePath);
            yield fs.stat(testLockFilePath);
            try {
                yield create(testLockFilePath);
            } catch (e) {
                assert.equal(e.message, LOCKFILE_ALREADY_EXISTS);
                return;
            }
            wrongPath();
        });

        it('fails if trying lock without pid and already existing lock with valid pid', function*() {
            yield create(testLockFilePath, { pid: process.pid });
            yield fs.stat(testLockFilePath);
            try {
                yield create(testLockFilePath);
            } catch (e) {
                assert.equal(e.message, LOCKFILE_ALREADY_EXISTS);
                return;
            }
            wrongPath();
        });

        it('fails if trying lock with pid and already existing lock without pid', function*() {
            yield create(testLockFilePath);
            yield fs.stat(testLockFilePath);
            try {
                yield create(testLockFilePath, { pid: process.pid });
            } catch (e) {
                assert.equal(e.message, LOCKFILE_ALREADY_EXISTS);
                return;
            }
            wrongPath();
        });

        it('fails if trying lock with pid and already existing lock with valid pid', function*() {
            yield create(testLockFilePath, { pid: process.pid });
            yield fs.stat(testLockFilePath);
            try {
                yield create(testLockFilePath, { pid: process.pid });
            } catch (e) {
                assert.equal(e.message, LOCKFILE_ALREADY_EXISTS);
                return;
            }
            wrongPath();
        });

        it('fails if trying lock with stale pid and already existing lock with valid pid', function*() {
            yield create(testLockFilePath, { pid: process.pid });
            yield fs.stat(testLockFilePath);
            try {
                yield create(testLockFilePath, { pid: 99999 });
            } catch (e) {
                assert.equal(e.message, LOCKFILE_ALREADY_EXISTS);
                return;
            }
            wrongPath();
        });

        it('succeed but does not actually leave lock if stale pid', function*() {
            yield create(testLockFilePath, { pid: 99999 });
            try {
                yield fs.stat(testLockFilePath);
            } catch (e) {
                return;
            }
            wrongPath();
        });

        it('handle obsolete pids', function*() {
            yield create(testLockFilePath, { pid: 99999 });
            yield create(testLockFilePath, { pid: process.pid });
        });

        it('by defaults lock file contains 0', function*() {
            yield create(testLockFilePath);
            const contents = yield fs.readFile(testLockFilePath);
            assert.equal(contents.toString(), '0');
        });

        it('we can send a pid', function*() {
            yield create(testLockFilePath, { pid: process.pid });
            const contents = yield fs.readFile(testLockFilePath);
            assert.equal(contents.toString(), process.pid);
        });

        it.skip('retries', function*() {
            this.timeout(10000);
            yield fs.writeFile(testLockFilePath, '5');
            setTimeout(function() {
                fs.unlink(testLockFilePath);
            }, 2500);
            yield create(testLockFilePath, { retries: 1 });
        });
    });

    context('#remove()', function() {
        it('removes a lock', function*() {
            yield create(testLockFilePath);
            yield fs.stat(testLockFilePath);
            yield remove(testLockFilePath);
            try {
                yield fs.stat(testLockFilePath);
            } catch (e) {
                assert.equal(e.code, ENOENT);
                return;
            }
            wrongPath();
        });

        it('it is not an error to remove a non-existing file', function*() {
            yield remove('waza');
        });

        // You're a big boy, if you want to remove a lock you can ... just call check first
        it('does not throw if trying to remove lock of still running job', function*() {
            yield create(testLockFilePath, { pid: process.pid });
            yield remove(testLockFilePath);
        });

        it('returns the remove method with correct pid', function*() {
            const rm = yield create(testLockFilePath, { pid: process.pid });
            const contents = yield fs.readFile(testLockFilePath);
            assert.equal(contents.toString(), process.pid);
            yield rm();
            try {
                yield fs.stat(testLockFilePath);
            } catch (e) {
                return assert.equal(e.code, ENOENT);
            }
            wrongPath();
        });

        it('returns the remove method if no pid', function*() {
            const rm = yield create(testLockFilePath);
            yield fs.stat(testLockFilePath);
            yield rm();
            try {
                yield fs.stat(testLockFilePath);
            } catch (e) {
                return assert.equal(e.code, ENOENT);
            }
            wrongPath();
        });
    });

    context('#touch()', function() {
        it('correctly edit the time of the file', function*() {
            yield fs.writeFile(testLockFilePath, '', 'utf8');
            const prev = yield fs.stat(testLockFilePath);
            yield touch(testLockFilePath);
            const next = yield fs.stat(testLockFilePath);
            assert.notEqual(prev.mtime, next.mtime);
            assert.notEqual(prev.ctime, next.ctime);
            assert.notEqual(prev.atime, next.atime);
        });
    });
});
