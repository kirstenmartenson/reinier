/**
 * Copyright (c) 2017, Three Pawns, Inc. All rights reserved.
 */

'use strict';

// Make it easy for developers to create local-{username}.json config files
if (!process.env.NODE_APP_INSTANCE && !process.env.NODE_ENV) {
  process.env.NODE_APP_INSTANCE = process.env.USER;
}

const config = require('config');
const http = require('http');
const https = require('https');
const express = require('express');
const solos = require('solos');
const passport = require('passport');
const LdapStrategy = require('passport-ldapauth');
const auth = require('./auth.js');
const morgan = require('morgan');

// setup the logger
const logConfig = config.get('servers.logs.options');
const requestLogger = morgan(logConfig.type, logConfig.options);

const ldapOptions = config.get('ldapauth');

passport.use(new LdapStrategy(ldapOptions, (user, done) => {
  const extractor = /cn[=]([^,]+)/;  // extract cn and set user.groups for solos authorization
  const memberOf = user.memberOf || user.isMemberOf || [];
  user.groups = (Array.isArray(memberOf) ? memberOf : [memberOf]).map(dn => dn.match(extractor)[1]);
  done(null, user);
}));

const app = express();
const router = express.Router();
const seneca = require('seneca')(config.get('seneca'));

app.set('x-powered-by', false);
app.use(requestLogger);
app.use(passport.initialize());
app.use(express.static('public'));
app.use('/', router);

// Configure Basic Authentication - LDAP (/login)
router.use(/^[/]login[/]?/, auth.basicLDAP(passport));

// Configure Bearer Authentication - Cached (not /login)
router.use(/^[/](?!login)/, auth.bearer(passport));

seneca.use('entity');

// initialize solos
solos.init(router, seneca, config.get('solos'));

// start servers
const serverConfig = config.get('servers');
const secureOptions = config.get('servers.secure.options');

const openPort = config.has('servers.open.port') ? serverConfig.open.port : 80;
const securePort = config.has('servers.secure.port') ? serverConfig.secure.port : 443;
const securePortURL = securePort === 443 ? '' : `:${securePort}`;

const listening = function (server) {
  return () => {
    const host = server.address().address;
    const port = server.address().port;
    const secure = server.getTicketKeys ? 's' : '';

    /* eslint-disable no-console */
    console.log('Listening at http%s://%s:%s', secure, host === '::' ? 'localhost' : host, port);
    /* eslint-enable */
  };
};

const secured = https.createServer(secureOptions, app);
secured.listen(securePort, listening(secured));

// Redirect all open traffic to secured
const redirect = express();
redirect.set('x-powered-by', false);
redirect.all('*', (req, res) => {
  res.redirect(`https://${req.hostname}${securePortURL}${req.url}`);
});

const open = http.createServer(redirect);
open.listen(openPort, listening(open));

module.exports = app; // for testing
