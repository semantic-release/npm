import {writeJson, readFile, appendFile} from 'fs-extra';
import test from 'ava';
import execa from 'execa';
import {stub} from 'sinon';
import tempy from 'tempy';
import clearModule from 'clear-module';
import SemanticReleaseError from '@semantic-release/error';
import npmRegistry from './helpers/npm-registry';

let processStderr;
let processStdout;

test.before(async () => {
  // Start the local NPM registry
  await npmRegistry.start();
  // Disable npm logger during tests
  processStderr = stub(process.stderr, 'write');
  processStdout = stub(process.stdout, 'write');
});

test.beforeEach(t => {
  // Save the current process.env
  t.context.env = Object.assign({}, process.env);
  // Delete env paramaters that could have been set on the machine running the tests
  delete process.env.NPM_TOKEN;
  delete process.env.NPM_USERNAME;
  delete process.env.NPM_PASSWORD;
  delete process.env.NPM_EMAIL;
  // Save the current working diretory
  t.context.cwd = process.cwd();
  // Change current working directory to a temp directory
  process.chdir(tempy.directory());
  // Clear npm cache to refresh the module state
  clearModule('..');
  t.context.m = require('..');
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test.afterEach.always(t => {
  // Restore process.env
  process.env = Object.assign({}, t.context.env);
  // Restore the current working directory
  process.chdir(t.context.cwd);
});

test.after.always(async () => {
  // Restore stdout and stderr
  processStderr.restore();
  processStdout.restore();
  // Stop the local NPM registry
  await npmRegistry.stop();
});

test.serial('Throws error if NPM token is invalid', async t => {
  process.env.NPM_TOKEN = 'wrong_token';
  const pkg = {name: 'published', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
  await writeJson('./package.json', pkg);
  const error = await t.throws(t.context.m.verifyConditions({}, {logger: t.context.logger}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EINVALIDNPMTOKEN');
  t.is(error.message, 'Invalid npm token.');

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /:_authToken/);
});

test.serial('Verify npm auth and package', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'valid-token', publishConfig: {registry: npmRegistry.url}};
  await writeJson('./package.json', pkg);
  await t.notThrows(t.context.m.verifyConditions({}, {logger: t.context.logger}));

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /_auth =/);
  t.regex(npmrc, /email =/);
});

test.serial('Verify npm auth and package with "npm_config_registry" env var set by yarn', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  process.env.npm_config_registry = 'https://registry.yarnpkg.com'; // eslint-disable-line camelcase
  const pkg = {name: 'valid-token', publishConfig: {registry: npmRegistry.url}};
  await writeJson('./package.json', pkg);
  await t.notThrows(t.context.m.verifyConditions({}, {logger: t.context.logger}));

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /_auth =/);
  t.regex(npmrc, /email =/);
});

test.serial('Return nothing if no version if published', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'not-published', publishConfig: {registry: npmRegistry.url}};
  await writeJson('./package.json', pkg);
  const nextRelease = await t.context.m.getLastRelease({}, {logger: t.context.logger});

  t.falsy(nextRelease);
});

test.serial('Return last version published', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'published', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
  await writeJson('./package.json', pkg);

  await appendFile(
    './.npmrc',
    `_auth = ${Buffer.from(`${process.env.NPM_USERNAME}:${process.env.NPM_PASSWORD}`, 'utf8').toString(
      'base64'
    )}\nemail = ${process.env.NPM_EMAIL}`
  );

  await execa('npm', ['publish']);

  const nextRelease = await t.context.m.getLastRelease({}, {logger: t.context.logger});
  t.is(nextRelease.version, '1.0.0');
});

test.serial('Return last version published on a dist-tag', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'published-next', version: '1.0.0', publishConfig: {registry: npmRegistry.url, tag: 'next'}};
  await writeJson('./package.json', pkg);

  await appendFile(
    './.npmrc',
    `_auth = ${Buffer.from(`${process.env.NPM_USERNAME}:${process.env.NPM_PASSWORD}`, 'utf8').toString(
      'base64'
    )}\nemail = ${process.env.NPM_EMAIL}`
  );

  // Publish version 1.0.0 on latest and next
  await execa('npm', ['publish', '--tag=next']);
  pkg.version = '1.1.0';
  await writeJson('./package.json', pkg);
  // Publish version 1.1.0 on next
  await execa('npm', ['publish', '--tag=next']);

  const nextRelease = await t.context.m.getLastRelease({}, {logger: t.context.logger});
  t.is(nextRelease.version, '1.1.0');
});

test.serial('Return nothing for an unpublished package', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'unpublished', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
  await writeJson('./package.json', pkg);

  await appendFile(
    './.npmrc',
    `_auth = ${Buffer.from(`${process.env.NPM_USERNAME}:${process.env.NPM_PASSWORD}`, 'utf8').toString(
      'base64'
    )}\nemail = ${process.env.NPM_EMAIL}`
  );

  await execa('npm', ['publish']);
  await execa('npm', ['unpublish', 'unpublished', '--force']);

  const nextRelease = await t.context.m.getLastRelease({}, {logger: t.context.logger});
  t.falsy(nextRelease);
});

test.serial('Publish a package', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'publish', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
  await writeJson('./package.json', pkg);

  await t.context.m.publish({}, {logger: t.context.logger, nextRelease: {version: '1.0.0'}});

  t.is((await execa('npm', ['view', 'publish', 'version'])).stdout, '1.0.0');
});

test.serial('Verify token and set up auth only on the fist call', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'test-module', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await writeJson('./package.json', pkg);

  await t.notThrows(t.context.m.verifyConditions({}, {logger: t.context.logger}));

  let nextRelease = await t.context.m.getLastRelease({}, {logger: t.context.logger});
  t.falsy(nextRelease);

  await t.context.m.publish({}, {logger: t.context.logger, nextRelease: {version: '1.0.0'}});

  nextRelease = await t.context.m.getLastRelease({}, {logger: t.context.logger});
  t.is(nextRelease.version, '1.0.0');
});
