/**
 * Copyright (c) 2017, Three Pawns, Inc. All rights reserved.
 */

'use strict';

module.exports = {
  servers: {
    logs: {
      rotate: '1h',
    },
  },
  bunyan: {
    logger: {
      name: 'seneca',
      streams: [{
        level: 'warn',
        stream: 'process.stdout',
      }, {
        type: 'rotating-file',
        file: 'application.log',
        level: 'debug',
        period: '1h',
        count: 7,
      }],
    },
  },
  test: {
    admin: {
      username: 'OVERRIDE',
      password: 'OVERRIDE',
    },
    editor: {
      username: 'OVERRIDE',
      password: 'OVERRIDE',
    },
    blogger: {
      username: 'OVERRIDE',
      password: 'OVERRIDE',
    },
  },
};
