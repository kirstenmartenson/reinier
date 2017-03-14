/**
 * Copyright (c) 2017, Three Pawns, Inc. All rights reserved.
 */

'use strict';

// During the test the env variable is set to test
process.env.NODE_ENV = 'testing';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const config = require('config').get('test');

const should = chai.should();
let token;

chai.use(chaiHttp);

const generateBasicAuth = (user) => {
  const username = config[user].username;
  const password = config[user].password;
  const base64 = new Buffer(`${username}:${password}`).toString('base64');
  return `Basic ${base64}`;
};

const generateFormAuth = user => generateBasicAuth(user).replace(/^Basic/i, 'Form');

const generateBearerAuth = auth => `Bearer ${auth}`;

// Our parent block
describe('User', () => {
  beforeEach((done) => { // Before each test we empty the database
    /*
     * Nothing to see here (yet)
     */
    done();
  });
  /*
   * Test the /GET route
   */
  describe('GET /login', () => {
    it('without a header should fail', (done) => {
      chai.request(server)
        .get('/login')
        .end((err, res) => {
          res.should.have.status(401);
          res.headers.should.have.property('www-authenticate');
          res.headers['www-authenticate'].should.match(/^Basic/);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.eql('Missing header');
          done();
        });
    });
    it('with a malformed Basic header should fail', (done) => {
      chai.request(server)
        .get('/login')
        .set('authorization', 'Basic somegobbledygook')
        .end((err, res) => {
          res.should.have.status(401);
          res.headers.should.have.property('www-authenticate');
          res.headers['www-authenticate'].should.match(/^Basic/);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.eql('Missing credentials');
          done();
        });
    });
    it('with a bad Basic password should fail', (done) => {
      chai.request(server)
        .get('/login')
        .set('authorization', generateBasicAuth('blogger').slice(0, -4))
        .end((err, res) => {
          res.should.have.status(401);
          res.headers.should.have.property('www-authenticate');
          res.headers['www-authenticate'].should.match(/^Basic/);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.eql('Invalid username/password');
          done();
        });
    });
    it('with a good Basic password should succeed', (done) => {
      chai.request(server)
        .get('/login')
        .set('authorization', generateBasicAuth('blogger'))
        .end((err, res) => {
          res.should.have.status(200);
          res.headers.should.not.have.property('www-authenticate');
          res.body.should.be.a('object');
          res.body.should.have.property('token');
          token = res.body.token;
          done();
        });
    });
    it('with a malformed Form header should fail', (done) => {
      chai.request(server)
        .get('/login')
        .set('authorization', 'Form somegobbledygook')
        .end((err, res) => {
          res.should.have.status(401);
          res.headers.should.have.property('www-authenticate');
          res.headers['www-authenticate'].should.match(/^Form/);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.eql('Missing credentials');
          done();
        });
    });
    it('with a bad Form password should fail', (done) => {
      chai.request(server)
        .get('/login')
        .set('authorization', generateFormAuth('blogger').slice(0, -4))
        .end((err, res) => {
          res.should.have.status(401);
          res.headers.should.have.property('www-authenticate');
          res.headers['www-authenticate'].should.match(/^Form/);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.eql('Invalid username/password');
          done();
        });
    });
    it('with a good Form password should succeed', (done) => {
      chai.request(server)
        .get('/login')
        .set('authorization', generateFormAuth('blogger'))
        .end((err, res) => {
          res.should.have.status(200);
          res.headers.should.not.have.property('www-authenticate');
          res.body.should.be.a('object');
          res.body.should.have.property('token');
          done();
        });
    });
  });

  describe('GET /', () => {
    it('without an authentication header should fail', (done) => {
      chai.request(server)
        .get('/')
        .end((err, res) => {
          res.should.have.status(401);
          res.headers.should.have.property('www-authenticate');
          res.headers['www-authenticate'].should.match(/^Basic/);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.eql('Missing header');
          done();
        });
    });
    it('with a basic authentication header should fail', (done) => {
      chai.request(server)
        .get('/')
        .set('authorization', generateBasicAuth('blogger'))
        .end((err, res) => {
          res.should.have.status(401);
          res.headers.should.have.property('www-authenticate');
          res.headers['www-authenticate'].should.match(/^Bearer/);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.eql('Login to get a new bearer token');
          done();
        });
    });
    it('with a form authentication header should fail', (done) => {
      chai.request(server)
        .get('/')
        .set('authorization', generateFormAuth('blogger'))
        .end((err, res) => {
          res.should.have.status(401);
          res.headers.should.have.property('www-authenticate');
          res.headers['www-authenticate'].should.match(/^Bearer/);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.eql('Login to get a new bearer token');
          done();
        });
    });
    it('with correct bearer authentication header should succeed', (done) => {
      chai.request(server)
        .get('/')
        .set('authorization', generateBearerAuth(token))
        .end((err, res) => {
          res.should.have.status(200);
          res.headers.should.not.have.property('www-authenticate');
          should.exist(res.text);
          res.text.should.match(/^[^<]*<html[^>]*>/);
          done();
        });
    });
  });
});
