#!/usr/bin/env node

/* eslint no-unused-expressions: 0, global-require: 0, no-console: 0 */
'use strict';

const mailsplit = require('mailsplit');
const Splitter = mailsplit.Splitter;
const Joiner = mailsplit.Joiner;
const Streamer = mailsplit.Streamer;
const libmime = require('libmime');
const path = require('path');
const fs = require('fs');

let streamer = new Streamer(node => !node.multipart);

let filenames = new Set();

streamer.on('node', data => {
    let extension = libmime.detectExtension(data.node.contentType || 'application/octet-stream');
    let filename = path.parse(data.node.filename || (data.node.contentType || 'attachment').split('/').shift() + '.' + extension);

    let base = (filename.name || 'attachment')
        .replace(/[\/\\]/g, '_')
        .replace(/\.+/g, '.')
        .replace(/[\x00-\x1F]/g, '_'); // eslint-disable-line no-control-regex
    let fname;
    let i = 0;
    while (1) {
        // eslint-disable-line no-constant-condition
        fname = base + (i ? '-' + i : '') + filename.ext;
        i++;
        if (filenames.has(fname)) {
            continue;
        }
        filenames.add(fname);
        break;
    }

    data.decoder.pipe(fs.createWriteStream(path.join(process.cwd(), fname)));
    data.done();
});

process.stdin
    .pipe(new Splitter())
    .pipe(streamer)
    .pipe(new Joiner())
    .pipe(process.stdout);
