/*
 * Copyright (c) 2017 by Three Pawns, Inc. All rights reserved.
 */

'use strict';

exports.request_received = function requestReceived(msg, done) {
  msg.logger.debug('Callback successful', {
    method: 'receive',
  });
  done(undefined, msg);
};

exports.validate = function validate(msg, done) {
  msg.logger.debug('Callback successful', {
    method: 'validate',
  });
  done(undefined, msg);
};

exports.before = function before(msg, done) {
  msg.logger.debug('Callback successful', {
    method: 'before',
  });
  done(undefined, msg);
};

exports.respond = function respond(msg, done) {
  msg.res.redirect('/bootstrap.html');
  msg.logger.debug('Callback successful', {
    method: 'respond',
  });
  done(undefined, msg);
};

exports.after = function after(msg, done) {
  msg.logger.debug('Callback successful', {
    method: 'after',
    context: msg,
  });
  done(undefined, msg);
};
