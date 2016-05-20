# Dotlockfile.js

The [node.js](https://nodejs.org/en/) implementation of [dotlockfile](http://manpages.ubuntu.com/manpages/xenial/man1/dotlockfile.1.html) with some [differences](#differences)

# Install

`npm i dotlockfile`

# Differences

  - retries (`-r`) defaults to 0
  - retries (`-r`) === -1 just won't work, no infinite loop.
  - no `-m` option (mail)

# API

all path parameters defaults to `` `${process.pid}.lock` ``

## create(path[, options]) => Promise
```
{
    retries: 0,
    pid: null,
}
```

Promise resolve to a function to remove your lock if you acquired the lock.
Promive rejects 
## remove(path) => Promise
## check(path) => Promise
## touch(path) => Promise
