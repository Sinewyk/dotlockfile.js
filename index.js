/**
 * Refs
 * Higher order algo: http://linux.die.net/man/3/lockfile_create
 * then source code of dotlockfile: https://sourcecodebrowser.com/liblockfile/1.07/lockfile_8c_source.html
 * unlink(2): http://man7.org/linux/man-pages/man2/unlink.2.html
 * open(2): http://man7.org/linux/man-pages/man2/open.2.html
 * stat(2): http://man7.org/linux/man-pages/man2/stat.2.html
 */

exports.create = require('./lib/create');
exports.remove = require('./lib/remove');
exports.check = require('./lib/check');
exports.touch = require('./lib/touch');
