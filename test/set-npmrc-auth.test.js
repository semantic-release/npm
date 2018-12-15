import path from 'path';
import test from 'ava';
import {readFile, appendFile} from 'fs-extra';
import {stub} from 'sinon';
import tempy from 'tempy';
import setNpmrcAuth from '../lib/set-npmrc-auth';

test.beforeEach(t => {
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Set auth with "NPM_TOKEN"', async t => {
  const cwd = tempy.directory();
  const env = {NPM_TOKEN: 'npm_token'};

  await setNpmrcAuth('http://custom.registry.com', {cwd, env, logger: t.context.logger});

  const npmrc = (await readFile(path.resolve(cwd, '.npmrc'))).toString();
  t.regex(npmrc, /\/\/custom.registry.com\/:_authToken = \$\{NPM_TOKEN\}/);
  t.deepEqual(t.context.log.args[1], [`Wrote NPM_TOKEN to ${path.resolve(cwd, '.npmrc')}`]);
});

test('Set auth with "NPM_USERNAME", "NPM_PASSWORD" and "NPM_EMAIL"', async t => {
  const cwd = tempy.directory();
  const env = {NPM_USERNAME: 'npm_username', NPM_PASSWORD: 'npm_pasword', NPM_EMAIL: 'npm_email'};

  await setNpmrcAuth('http://custom.registry.com', {cwd, env, logger: t.context.logger});

  const npmrc = (await readFile(path.resolve(cwd, '.npmrc'))).toString();
  t.is(npmrc, `\n_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`);
  t.deepEqual(t.context.log.args[1], [
    `Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to ${path.resolve(cwd, '.npmrc')}`,
  ]);
});

test('Do not modify ".npmrc" if auth is already configured', async t => {
  const cwd = tempy.directory();

  await appendFile(path.resolve(cwd, '.npmrc'), `//custom.registry.com/:_authToken = \${NPM_TOKEN}`);

  await setNpmrcAuth('http://custom.registry.com', {cwd, env: {}, logger: t.context.logger});

  t.is(t.context.log.callCount, 1);
});

test('Do not modify ".npmrc" if auth is already configured for a scoped package', async t => {
  const cwd = tempy.directory();

  await appendFile(
    path.resolve(cwd, '.npmrc'),
    `@scope:registry=http://custom.registry.com\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
  );

  await setNpmrcAuth('http://custom.registry.com', {cwd, env: {}, logger: t.context.logger});

  t.is(t.context.log.callCount, 1);
});

test('Throw error if "NPM_TOKEN" is missing', async t => {
  const cwd = tempy.directory();

  const [error] = await t.throwsAsync(
    setNpmrcAuth('http://custom.registry.com', {cwd, env: {}, logger: t.context.logger})
  );

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test('Throw error if "NPM_USERNAME" is missing', async t => {
  const cwd = tempy.directory();
  const env = {NPM_PASSWORD: 'npm_pasword', NPM_EMAIL: 'npm_email'};

  const [error] = await t.throwsAsync(setNpmrcAuth('http://custom.registry.com', {cwd, env, logger: t.context.logger}));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test('Throw error if "NPM_PASSWORD" is missing', async t => {
  const cwd = tempy.directory();
  const env = {NPM_USERNAME: 'npm_username', NPM_EMAIL: 'npm_email'};

  const [error] = await t.throwsAsync(setNpmrcAuth('http://custom.registry.com', {cwd, env, logger: t.context.logger}));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test('Throw error if "NPM_EMAIL" is missing', async t => {
  const cwd = tempy.directory();
  const env = {NPM_USERNAME: 'npm_username', NPM_PASSWORD: 'npm_password'};

  const [error] = await t.throwsAsync(setNpmrcAuth('http://custom.registry.com', {cwd, env, logger: t.context.logger}));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});
