const {resolve} = require('path');
const test = require('ava');
const getNpm = require('../lib/get-npm');

let ostype;

test.before(() => {
  ostype = process.env.OSTYPE;
});

test.after(() => {
  process.env.OSTYPE = ostype;
});

test.serial('Get npm cmd for linux', (t) => {
  process.env.OSTYPE = 'linux';
  t.is(getNpm(), resolve(__dirname, '../node_modules/.bin/npm'));
});

test.serial('Get npm cmd for windows', (t) => {
  process.env.OSTYPE = 'msys';
  t.is(getNpm(), resolve(__dirname, '../node_modules/.bin/npm.cmd'));
});
