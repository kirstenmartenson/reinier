/**
 * Copyright (c) 2017, Three Pawns, Inc. All rights reserved.
 */

'use strict';

const config = require('config');
const crypto = require('crypto');
const uuid = require('uuid');
const NodeCache = require('node-cache');

const algorithm = 'aes-256-ctr';
const password = config.get('servers.auth.crypt.password');
const cacheConfig = config.get('servers.auth.cache');
const ttl = cacheConfig.ttl;
const check = cacheConfig.check;

const encrypt = (text) => {
  const cipher = crypto.createCipher(algorithm, password);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
};

const decrypt = (text) => {
  const decipher = crypto.createDecipher(algorithm, password);
  return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
};

const userCache = new NodeCache({
  stdTTL: ttl,
  checkperiod: check,
});

/**
 * Process the authorization: Basic header
 */
module.exports.basicLDAP = function basicLDAP(passport) {
  return (req, res, next) => {
    const authorization = req.get('Authorization');

    if (!authorization) {
      // Send the request for Basic Authentication and exit
      res.set('WWW-Authenticate', 'Basic').status(401).json({
        message: 'Missing header',
      });
      return next();
    }

    // Do the authentication
    return passport.authenticate('ldapauth', (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        // Authentication failed
        return res.set('WWW-Authenticate', 'Basic').status(401).json(info || {});
      }

      // Authentication succeeded so login the user
      req.user = user;  // req.logIn() is not called because no session is needed

      // Encrypt the header because it contains the password
      const basic = encrypt(authorization);

      // Create the bearer token and cache the basic header
      const token = new Buffer(uuid.v4()).toString('base64');
      userCache.set(token, basic);

      // Put the token in the response and send
      const reply = info || {};
      reply.token = token;
      return res.status(200).json(reply);
    })(req, res, next);
  };
};

/**
 * Process the authorization: Bearer header
 */
module.exports.bearer = function bearer(passport) {
  return (req, res, next) => {
    const authorization = req.get('Authorization');
    const token = authorization ? authorization.match(/bearer\s+([\S]+)$/i) || [] : [];
    const cached = token[1] ? userCache.get(token[1]) : undefined;

    if (!authorization) {
      res.redirect('/login');
      return next();
    }

    if (!cached) {
      // Either basic authentication -or- an expired or invalid bearer authentication
      res.set('WWW-Authenticate', 'Bearer').status(401).json({
        message: 'Login to get a new bearer token',
      });
      return next();
    }

    // Decrypt the cached basic authorization header and override the header
    const basic = decrypt(cached);
    req.headers.authorization = basic;

    // Do the authentication with the overridden header
    return passport.authenticate('ldapauth', (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        // Authentication failed
        return res.redirect('/login');
      }

      // Authentication succeeded so login the user
      req.user = user;  // req.logIn() is not called because no session is needed
      return next();
    })(req, res, next);
  };
};
