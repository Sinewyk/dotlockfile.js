# Dotlockfile.js

[![Build Status](https://travis-ci.org/Sinewyk/dotlockfile.js.svg?branch=master)](https://travis-ci.org/Sinewyk/dotlockfile.js)

The [node.js](https://nodejs.org/en/) implementation of [dotlockfile](http://manpages.ubuntu.com/manpages/xenial/man1/dotlockfile.1.html) with some [differences](#differences)

  * [Install](#install)
  * [Known issues](#known-issues)
  * [Differences versus unix dotlockfile](#differences)
  * [API](#api)
    * [create](#createpath-string-options-object--promise)
    * [remove](#removepath-string-promise)
    * [check](#checkpath-string-promise)
    * [touch](#touchpath-string-promise)
  * [Why this package](#why-this-package)
  * [License](#license)

# Install

`npm i dotlockfile`

```
// ES6
{ create, check, touch } from 'dotlockfile';
async stuff() {
    try {
        const remove = await create(somePath, { pid: process.pid });
        //do stuff
        await remove();
    } catch (e) {
        errorHandler(e);
    }
}

//ES5
const dtf = require('dotlockfile');
dtf.create(somePath, { pid: process.pid }).then(remove => {
    //do stuff
    return remove()
})
.catch(errorHandler);
```

# Known issues

Only compatible node v6 for now because I didn't want to babel all of it too fast.

# Differences

AFAIK:

  - retries (`-r`) defaults to 0
  - retries (`-r`) === -1 just won't work, no infinite loop.
  - no `-m` option (mail)

# API

all path parameters defaults to `` `${process.pid}.lock` ``

### create(path: string[, options: Object]) => Promise

Create a lockfile.

options defaults to:
```
{
    retries: 0,
    pid: null,
}
```

Resolves to a function to remove your lock if you acquired the lock.

Rejects to an error with reason in the message if it couldn't create the lock.

### remove(path: string): Promise

Remove lockfile.

Resolve if you removed the lock (or lock isn't there).

Rejects if it couldn't remove the lock.

### check(path: string): Promise

Check lockfile validity.

Resolves to true if lockfile is valid.

Rejects to an error with invalid lock message if lockfile is invalid (does not automatically remve the lock).
### touch(path: string): Promise

Update utime of lockfile

# Why this package

I looked for an obvious dotlockfile equivalent and I didn't find it, or I find some stuff but it didn't have obvious tests to show that it's actually working ...

# License

MIT
