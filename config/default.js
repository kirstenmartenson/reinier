/**
 * Copyright (c) 2017, Three Pawns, Inc. All rights reserved.
 */

'use strict';

const fs = require('fs');
const defer = require('config/defer').deferConfig;
const basicAuth = require('basic-auth');

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
