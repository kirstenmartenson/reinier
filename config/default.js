/**
 * Copyright (c) 2017, Three Pawns, Inc. All rights reserved.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const defer = require('config/defer').deferConfig;
const raw = require('config/raw').raw;
const basicAuth = require('basic-auth');
const rfs = require('rotating-file-stream');

module.exports = {
  servers: {
    open: {
      port: 8080,
    },
    secure: {
      port: 8443,
      key: `config/local-${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}-key.pem`,
      cert: `config/local-${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}-cert.pem`,
      options: {
        key: defer(cfg => `${fs.readFileSync(cfg.servers.secure.key)}`),
        cert: defer(cfg => `${fs.readFileSync(cfg.servers.secure.cert)}`),
      },
    },
    auth: {
      token: {
        secret: 'OVERRIDE',
        ttl: 10800,
      },
    },
    logs: {
      directory: 'log',
      file: 'access.log',
      rotate: '1d',
      type: 'combined',
      options: defer((cfg) => {
        const dir = path.join(process.cwd(), cfg.servers.logs.directory);
        const rotate = {
          interval: cfg.servers.logs.rotate,
          path: fs.existsSync(dir) || fs.mkdirSync(dir) ? dir : undefined,
        };

        return raw({
          type: cfg.servers.logs.type,
          options: {
            stream: rfs(cfg.servers.logs.file, rotate),
          },
        });
      }),
    },
  },
  ldapauth: {
    credentialsLookup: basicAuth,
    server: {
      url: 'OVERRIDE',
      bindDn: 'OVERRIDE',
      bindCredentials: 'OVERRIDE',
      searchBase: 'OVERRIDE',
      searchFilter: '(uid={{username}})',
    },
  },
  solos: {
    resource: {},
    security: {
      groups: {
        'reinier admin': '.*',
        'reinier editor': ['GET /', '(GET|PUT|POST|DELETE) /edit/.*'],
        'reinier blogger': ['GET /', '(GET|PUT|POST|DELETE) /blog/.*'],
      },
    },
  },
  seneca: {
    log: {
      level: 'info+',
    },
  },
};
