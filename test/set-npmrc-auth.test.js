import {resolve} from 'node:path';
import test from 'ava';
import fs from 'fs-extra';
import { stub } from 'sinon';
import {temporaryFile, temporaryDirectory} from 'tempy';

const {HOME} = process.env;
const cwd = process.cwd();

test.beforeEach((t) => {
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test.afterEach.always(() => {
  process.env.HOME = HOME;
  process.chdir(cwd);
});

test.serial('Set auth with "NPM_TOKEN"', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});
  const env = {NPM_TOKEN: 'npm_token'};

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  await setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env, logger: t.context.logger});

  t.regex((await fs.readFile(npmrc)).toString(), /\/\/custom.registry.com\/:_authToken = \${NPM_TOKEN}/);
  t.deepEqual(t.context.log.args[1], [`Wrote NPM_TOKEN to ${npmrc}`]);
});

test.serial('Set auth with "NPM_USERNAME", "NPM_PASSWORD" and "NPM_EMAIL"', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});
  const env = {NPM_USERNAME: 'npm_username', NPM_PASSWORD: 'npm_pasword', NPM_EMAIL: 'npm_email'};

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  await setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env, logger: t.context.logger});

  t.is((await fs.readFile(npmrc)).toString(), `_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`);
  t.deepEqual(t.context.log.args[1], [`Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to ${npmrc}`]);
});

test.serial('Preserve home ".npmrc"', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});
  const env = {NPM_TOKEN: 'npm_token'};

  await fs.appendFile(resolve(process.env.HOME, '.npmrc'), 'home_config = test');

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  await setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env, logger: t.context.logger});

  t.is((await fs.readFile(npmrc)).toString(), `home_config = test\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`);
  t.deepEqual(t.context.log.args[1], [
    'Reading npm config from %s',
    [resolve(process.env.HOME, '.npmrc')].join(', '),
  ]);
  t.deepEqual(t.context.log.args[2], [`Wrote NPM_TOKEN to ${npmrc}`]);
});

test.serial('Preserve home and local ".npmrc"', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});
  const env = {NPM_TOKEN: 'npm_token'};

  await fs.appendFile(resolve(cwd, '.npmrc'), 'cwd_config = test');
  await fs.appendFile(resolve(process.env.HOME, '.npmrc'), 'home_config = test');

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  await setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env, logger: t.context.logger});

  t.is(
    (await fs.readFile(npmrc)).toString(),
    `home_config = test\ncwd_config = test\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
  );
  t.deepEqual(t.context.log.args[1], [
    'Reading npm config from %s',
    [resolve(process.env.HOME, '.npmrc'), resolve(cwd, '.npmrc')].join(', '),
  ]);
  t.deepEqual(t.context.log.args[2], [`Wrote NPM_TOKEN to ${npmrc}`]);
});

test.serial('Preserve all ".npmrc" if auth is already configured', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});

  await fs.appendFile(resolve(cwd, '.npmrc'), `//custom.registry.com/:_authToken = \${NPM_TOKEN}`);
  await fs.appendFile(resolve(process.env.HOME, '.npmrc'), 'home_config = test');

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  await setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env: {}, logger: t.context.logger});

  t.is((await fs.readFile(npmrc)).toString(), `home_config = test\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`);
  t.deepEqual(t.context.log.args[1], [
    'Reading npm config from %s',
    [resolve(process.env.HOME, '.npmrc'), resolve(cwd, '.npmrc')].join(', '),
  ]);
});

test.serial('Preserve ".npmrc" if auth is already configured for a scoped package', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});

  await fs.appendFile(
    resolve(cwd, '.npmrc'),
    `@scope:registry=http://custom.registry.com\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
  );
  await fs.appendFile(resolve(process.env.HOME, '.npmrc'), 'home_config = test');

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  await setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env: {}, logger: t.context.logger});

  t.is(
    (await fs.readFile(npmrc)).toString(),
    `home_config = test\n@scope:registry=http://custom.registry.com\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
  );
  t.deepEqual(t.context.log.args[1], [
    'Reading npm config from %s',
    [resolve(process.env.HOME, '.npmrc'), resolve(cwd, '.npmrc')].join(', '),
  ]);
});

test.serial('Throw error if "NPM_TOKEN" is missing', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  const [error] = await t.throwsAsync(
    setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env: {}, logger: t.context.logger})
  );

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test.serial('Emulate npm config resolution if "NPM_CONFIG_USERCONFIG" is set', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});

  await fs.appendFile(resolve(cwd, '.custom-npmrc'), `//custom.registry.com/:_authToken = \${NPM_TOKEN}`);

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  await setNpmrcAuth(npmrc, 'http://custom.registry.com', {
    cwd,
    env: {NPM_CONFIG_USERCONFIG: resolve(cwd, '.custom-npmrc')},
    logger: t.context.logger,
  });

  t.is((await fs.readFile(npmrc)).toString(), `//custom.registry.com/:_authToken = \${NPM_TOKEN}`);
  t.deepEqual(t.context.log.args[1], ['Reading npm config from %s', [resolve(cwd, '.custom-npmrc')].join(', ')]);
});

test.serial('Throw error if "NPM_USERNAME" is missing', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});
  const env = {NPM_PASSWORD: 'npm_pasword', NPM_EMAIL: 'npm_email'};

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  const [error] = await t.throwsAsync(
    setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env, logger: t.context.logger})
  );

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test.serial('Throw error if "NPM_PASSWORD" is missing', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});
  const env = {NPM_USERNAME: 'npm_username', NPM_EMAIL: 'npm_email'};

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  const [error] = await t.throwsAsync(
    setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env, logger: t.context.logger})
  );

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test.serial('Throw error if "NPM_EMAIL" is missing', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});
  const env = {NPM_USERNAME: 'npm_username', NPM_PASSWORD: 'npm_password'};

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  const [error] = await t.throwsAsync(
    setNpmrcAuth(npmrc, 'http://custom.registry.com', {cwd, env, logger: t.context.logger})
  );

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test.serial('Prefer .npmrc over environment variables', async (t) => {
  const npmrc = temporaryFile({name: '.npmrc'});
  // Specify an NPM token environment variable
  const env = {NPM_TOKEN: 'env_npm_token'};

  await fs.appendFile(resolve(cwd, '.npmrc'), '//registry.npmjs.org/:_authToken=npmrc_npm_token');

  const setNpmrcAuth = (await import('../lib/set-npmrc-auth.js')).default;
  await setNpmrcAuth(npmrc, 'http://registry.npmjs.org', {cwd, env, logger: t.context.logger});

  t.is(
    (await fs.readFile(npmrc)).toString(),
    // Assert did not write the token from environment variable
    `//registry.npmjs.org/:_authToken=npmrc_npm_token`
  );

  // Assert reads from config
  t.deepEqual(t.context.log.args[1], ['Reading npm config from %s', resolve(cwd, '.npmrc')]);

  // Assert does not write NPM_TOKEN
  for (const log of t.context.log.args) {
    t.false(log.includes('Wrote NPM_TOKEN'));
  }
});
