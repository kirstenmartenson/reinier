/**
 * Copyright (c) 2017, Three Pawns, Inc. All rights reserved.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const defer = require('config/defer').deferConfig;
const raw = require('config/raw').raw;
const basicAuth = require('basic-auth');
const stringify = require('json-stringify-safe');
const rfs = require('rotating-file-stream');
const bunyan = require('bunyan');

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
          path: fs.existsSync(dir) ? dir : fs.mkdirSync(dir) || dir,
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
  bunyan: {
    logger: {
      name: 'seneca',
      streams: [{
        level: bunyan.INFO,
        stream: 'process.stdout',
      }, {
        type: 'rotating-file',
        file: 'application.log',
        level: bunyan.INFO,
        period: '1d', // daily rotation
        count: 7, // keep a week of back copies
      }],
    },
  },
  seneca: {
    log: {
      map: [{
        level: 'all',
        handler: defer((cfg) => {
          const config = JSON.parse(JSON.stringify(cfg.bunyan.logger));
          config.streams.forEach((stream) => {
            if (stream.stream === 'process.stdout') {
              stream.stream = process.stdout;
            } else if (stream.type === 'rotating-file' && stream.file) {
              stream.path = `${process.cwd()}/${cfg.servers.logs.directory}/${stream.file}`;
            }
          });

          if (!config.serializers) {
            config.serializers = bunyan.stdSerializers;
          }

          const logger = bunyan.createLogger(config);

          return function log(...args) {
            args.shift(); // remove timestamp - bunyan has one
            const level = args.splice(1, 1)[0]; // remove log level
            const msg = stringify(args, (key, value) => (['req', 'res'].indexOf(key) >= 0 ? '[FILTERED]' : value));
            logger[level](msg.replace(/["]/g, '\'')); // make pretty and log
          };
        }),
      }],
    },
  },
};
