import {appendFile} from 'fs-extra';
import test from 'ava';
import nock from 'nock';
import {stub} from 'sinon';
import lastRelease from '../lib/get-last-release';
import {gitRepo, gitCommit, gitTagVersion} from './helpers/git-utils';
import {registry, mock, availableModule, unpublishedModule, missingGitHead} from './helpers/mock-registry';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();
// Disable logs during tests
stub(process.stdout, 'write');
stub(process.stderr, 'write');

test.beforeEach(async t => {
  process.env.NPM_TOKEN = 'npm_token';
  // Delete all `npm_config` environment variable set by CI as they take precedence over the `.npmrc` because the process that runs the tests is started before the `.npmrc` is created
  for (let i = 0, keys = Object.keys(process.env); i < keys.length; i++) {
    if (keys[i].startsWith('npm_config')) {
      delete process.env[keys[i]];
    }
  }
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);
  // Clear nock
  nock.cleanAll();
});

test.serial('Get release from package name', async t => {
  const name = 'available';
  const registryMock = mock(name).reply(200, availableModule);
  const release = await lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial("Get release from a tagged package's name", async t => {
  const name = 'tagged';
  const registryMock = mock(name).reply(200, availableModule);
  const release = await lastRelease({name, publishConfig: {registry, tag: 'foo'}}, 'master', t.context.logger);

  t.is(release.version, '0.8.15');
  t.is(release.gitHead, 'bar');
  t.true(registryMock.isDone());
});

test.serial('Get release from the latest fallback tag', async t => {
  const name = 'tagged';
  const registryMock = mock(name).reply(200, availableModule);
  const release = await lastRelease({name, publishConfig: {registry, tag: 'bar'}}, 'master', t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Get release from scoped package name', async t => {
  const name = '@scoped/available';
  const registryMock = mock(name).reply(200, availableModule);

  const release = await lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger);
  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Get nothing from completely unpublished package name', async t => {
  const name = 'completely-unpublished';
  const registryMock = mock(name).reply(200, unpublishedModule);
  const release = await lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger);

  t.falsy(release);
  t.true(registryMock.isDone());
});

test.serial('Get nothing from not yet published package name (unavailable)', async t => {
  const name = 'unavailable';
  const registryMock = mock(name).reply(404, {});
  const release = await lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger);

  t.falsy(release);
  t.true(registryMock.isDone());
});

test.serial('Get nothing from not yet published package name (unavailable w/o response body)', async t => {
  const name = 'unavailable-no-body';
  const registryMock = mock(name).reply(404);
  const release = await lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger);

  t.falsy(release);
  t.true(registryMock.isDone());
});

test.serial('Get registry from ".npmrc"', async t => {
  const name = 'available';
  const registryMock = mock(name).reply(200, availableModule);
  await appendFile('./.npmrc', `registry = ${registry}`);
  const release = await lastRelease({name}, 'master', t.context.logger);

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
  const release = await lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger);

  t.falsy(release);
  t.true(registryMock.isDone());
});

test.serial('Send bearer authorization using NPM_TOKEN', async t => {
  const name = 'available';
  const registryMock = mock(name, {reqheaders: {authorization: `Bearer ${process.env.NPM_TOKEN}`}}).reply(
    200,
    availableModule
  );
  await appendFile('./.npmrc', `registry = ${registry}\nalways-auth = true`);
  const release = await lastRelease({name}, 'master', t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Uses basic auth when always-auth=true in ".npmrc"', async t => {
  const name = 'available';
  delete process.env.NPM_TOKEN;
  process.env.NPM_USERNAME = 'username';
  process.env.NPM_PASSWORD = 'password';
  const registryMock = mock(name)
    .basicAuth({user: 'username', pass: 'password'})
    .reply(200, availableModule);
  await appendFile('./.npmrc', `registry = ${registry}\nalways-auth = true`);
  const release = await lastRelease({name}, 'master', t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});

test.serial('Retrieve "gitHead" from git tag', async t => {
  const commit = await gitCommit('First');
  await gitTagVersion('v1.33.7');

  const name = 'missing-githead';
  const registryMock = mock(name).reply(200, missingGitHead);
  const release = await lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger);

  t.is(release.version, '1.33.7');
  t.is(release.gitHead.substring(0, 7), commit.hash);
  t.true(registryMock.isDone());
});

test.serial('Throws SemanticReleaseError if the gitHead is missing', async t => {
  const name = 'missing-githead';
  const registryMock = mock(name).reply(200, missingGitHead);
  const error = await t.throws(lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.code, 'ENOGITHEAD');
  t.true(registryMock.isDone());
});

test.serial('Throws error on server error', async t => {
  const name = 'server-error';
  const registryMock = mock(name)
    .times(3)
    .reply(500);
  await appendFile('./.npmrc', 'fetch-retry-factor = 1\nfetch-retry-mintimeout = 1\nfetch-retry-maxtimeout = 1');
  await t.throws(
    lastRelease({name, publishConfig: {registry}}, 'master', t.context.logger),
    /500 Internal Server Error/
  );

  t.true(registryMock.isDone());
});

test.serial('Handle missing trailing slash on registry URL', async t => {
  const name = 'available';
  const registryMock = mock(name).reply(200, availableModule);
  const release = await lastRelease(
    {name, publishConfig: {registry: 'http://registry.npmjs.org'}},
    'master',
    t.context.logger
  );

  t.is(release.version, '1.33.7');
  t.is(release.gitHead, 'HEAD');
  t.true(registryMock.isDone());
});
