import {appendFile} from 'fs-extra';
import test from 'ava';
import nock from 'nock';
import {stub} from 'sinon';
import tempy from 'tempy';
import lastRelease from '../lib/get-last-release';
import {registry, mock, available, unpublished} from './helpers/mock-registry';

let processStdout;
let processStderr;

test.before(() => {
  // Disable npm logger during tests
  processStdout = stub(process.stdout, 'write');
  processStderr = stub(process.stderr, 'write');
});

test.beforeEach(t => {
  // Save the current process.env
  t.context.env = Object.assign({}, process.env);
  process.env.NPM_TOKEN = 'npm_token';
  // Delete all `npm_config` environment variable set by CI as they take precedence over the `.npmrc` because the process that runs the tests is started before the `.npmrc` is created
  for (let i = 0, keys = Object.keys(process.env); i < keys.length; i++) {
    if (keys[i].startsWith('npm_config')) {
      delete process.env[keys[i]];
    }
  }
  // Save the current working diretory
  t.context.cwd = process.cwd();
  // Change current working directory to a temp directory
  process.chdir(tempy.directory());
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test.afterEach.always(t => {
  // Restore process.env
  process.env = Object.assign({}, t.context.env);
  // Clear nock
  nock.cleanAll();
  // Restore the current working directory
  process.chdir(t.context.cwd);
});

test.after.always(() => {
  // Restore stdout and stderr
  processStdout.restore();
  processStderr.restore();
});

test.serial('Get release from package name', async t => {
  const name = 'available';
  const registryMock = available(name);
  const release = await lastRelease({name, publishConfig: {registry}}, t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial("Get release from a tagged package's name", async t => {
  const name = 'tagged';
  const registryMock = available(name);
  const release = await lastRelease({name, publishConfig: {registry, tag: 'foo'}}, t.context.logger);

  t.is(release.version, '0.8.15');
  t.is(release.gitHead, 'bar');
  t.true(registryMock.isDone());
});

test.serial('Get release from the latest fallback tag', async t => {
  const name = 'tagged';
  const registryMock = available(name);
  const release = await lastRelease({name, publishConfig: {registry, tag: 'bar'}}, t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Get release from scoped package name', async t => {
  const name = '@scoped/available';
  const registryMock = available(name);

  const release = await lastRelease({name, publishConfig: {registry}}, t.context.logger);
  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Get nothing from completely unpublished package name', async t => {
  const name = 'completely-unpublished';
  const registryMock = unpublished(name);
  const release = await lastRelease({name, publishConfig: {registry}}, t.context.logger);

  t.is(release.version, undefined);
  t.true(registryMock.isDone());
});

test.serial('Get nothing from not yet published package name (unavailable)', async t => {
  const name = 'unavailable';
  const registryMock = mock(name).reply(404, {});
  const release = await lastRelease({name, publishConfig: {registry}}, t.context.logger);

  t.is(release.version, undefined);
  t.true(registryMock.isDone());
});

test.serial('Get nothing from not yet published package name (unavailable w/o response body)', async t => {
  const name = 'unavailable-no-body';
  const registryMock = mock(name).reply(404);
  const release = await lastRelease({name, publishConfig: {registry}}, t.context.logger);

  t.is(release.version, undefined);
  t.true(registryMock.isDone());
});

test.serial('Get registry from ".npmrc"', async t => {
  const name = 'available';
  const registryMock = available(name);
  await appendFile('./.npmrc', `registry = ${registry}`);
  const release = await lastRelease({name}, t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Get nothing from not yet published package name (unavailable w/o status code)', async t => {
  const name = 'unavailable-no-404';
  const registryMock = mock(name)
    .times(3)
    .replyWithError({message: 'not found', statusCode: 500, code: 'E500'});
  await appendFile('./.npmrc', 'fetch-retry-factor = 1\nfetch-retry-mintimeout = 1\nfetch-retry-maxtimeout = 1');
  const release = await lastRelease({name, publishConfig: {registry}}, t.context.logger);

  t.is(release.version, undefined);
  t.true(registryMock.isDone());
});

test.serial('Send bearer authorization using NPM_TOKEN', async t => {
  const name = 'available';
  const registryMock = available(name, ['authorization', 'Bearer npm_token']);
  await appendFile('./.npmrc', `registry = ${registry}\nalways-auth = true`);
  const release = await lastRelease({name}, t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Uses basic auth when always-auth=true in ".npmrc"', async t => {
  const name = 'available';
  delete process.env.NPM_TOKEN;
  process.env.NPM_USERNAME = 'username';
  process.env.NPM_PASSWORD = 'password';
  const registryMock = available(name, null, {user: 'username', pass: 'password'});
  await appendFile('./.npmrc', `registry = ${registry}\nalways-auth = true`);
  const release = await lastRelease({name}, t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Throws error on server error', async t => {
  const name = 'server-error';
  const registryMock = mock(name)
    .times(3)
    .reply(500);
  await appendFile('./.npmrc', 'fetch-retry-factor = 1\nfetch-retry-mintimeout = 1\nfetch-retry-maxtimeout = 1');
  await t.throws(lastRelease({name, publishConfig: {registry}}, t.context.logger), /500 Internal Server Error/);

  t.true(registryMock.isDone());
});

test.serial('Handle missing trailing slash on registry URL', async t => {
  const name = 'available';
  const registryMock = available(name);
  const release = await lastRelease({name, publishConfig: {registry: 'http://registry.npmjs.org'}}, t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});
