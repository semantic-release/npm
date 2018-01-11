import test from 'ava';
import {outputJson, readJson, readFile, appendFile, pathExists} from 'fs-extra';
import execa from 'execa';
import {stub} from 'sinon';
import clearModule from 'clear-module';
import SemanticReleaseError from '@semantic-release/error';
import npmRegistry from './helpers/npm-registry';
import {gitRepo, gitCommit, gitTagVersion, gitPackRefs} from './helpers/git-utils';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();
// Disable logs during tests
stub(process.stdout, 'write');
stub(process.stderr, 'write');

test.before(async () => {
  // Start the local NPM registry
  await npmRegistry.start();
});

test.beforeEach(async t => {
  // Delete env paramaters that could have been set on the machine running the tests
  delete process.env.NPM_TOKEN;
  delete process.env.NPM_USERNAME;
  delete process.env.NPM_PASSWORD;
  delete process.env.NPM_EMAIL;
  delete process.env.DEFAULT_NPM_REGISTRY;
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  await gitCommit('Initial commit');
  // Clear npm cache to refresh the module state
  clearModule('..');
  t.context.m = require('..');
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);
});

test.after.always(async () => {
  // Stop the local NPM registry
  await npmRegistry.stop();
});

test.serial('Skip npm auth verification if "npmPublish" is false', async t => {
  process.env.NPM_TOKEN = 'wrong_token';
  const pkg = {name: 'published', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);
  await t.notThrows(t.context.m.verifyConditions({npmPublish: false}, {options: {}, logger: t.context.logger}));
});

test.serial('Throws error if NPM token is invalid', async t => {
  process.env.NPM_TOKEN = 'wrong_token';
  process.env.DEFAULT_NPM_REGISTRY = npmRegistry.url;
  const pkg = {name: 'published', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);
  const error = await t.throws(t.context.m.verifyConditions({}, {options: {}, logger: t.context.logger}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EINVALIDNPMTOKEN');
  t.is(error.message, 'Invalid npm token.');

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /:_authToken/);
});

test.serial('Skip Token validation if the registry configured is not the default one', async t => {
  process.env.NPM_TOKEN = 'wrong_token';
  const pkg = {name: 'published', version: '1.0.0', publishConfig: {registry: 'http://custom-registry.com/'}};
  await outputJson('./package.json', pkg);
  await t.notThrows(t.context.m.verifyConditions({}, {options: {}, logger: t.context.logger}));

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /:_authToken/);
});

test.serial(
  'Throws error if NPM token is invalid if "npmPublish" is false and npm plugin used for "getLastRelease"',
  async t => {
    process.env.NPM_TOKEN = 'wrong_token';
    process.env.DEFAULT_NPM_REGISTRY = npmRegistry.url;
    const pkg = {name: 'published', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
    await outputJson('./package.json', pkg);
    const error = await t.throws(
      t.context.m.verifyConditions(
        {npmPublish: false},
        {options: {getLastRelease: '@semantic-release/npm'}, logger: t.context.logger}
      )
    );

    t.true(error instanceof SemanticReleaseError);
    t.is(error.code, 'EINVALIDNPMTOKEN');
    t.is(error.message, 'Invalid npm token.');

    const npmrc = (await readFile('.npmrc')).toString();
    t.regex(npmrc, /:_authToken/);
  }
);

test.serial(
  'Throws error if NPM token is invalid if "npmPublish" is false and npm plugin used for "getLastRelease" as an object',
  async t => {
    process.env.NPM_TOKEN = 'wrong_token';
    process.env.DEFAULT_NPM_REGISTRY = npmRegistry.url;
    const pkg = {name: 'published', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
    await outputJson('./package.json', pkg);
    const error = await t.throws(
      t.context.m.verifyConditions(
        {npmPublish: false},
        {options: {getLastRelease: {path: '@semantic-release/npm'}}, logger: t.context.logger}
      )
    );

    t.true(error instanceof SemanticReleaseError);
    t.is(error.code, 'EINVALIDNPMTOKEN');
    t.is(error.message, 'Invalid npm token.');

    const npmrc = (await readFile('.npmrc')).toString();
    t.regex(npmrc, /:_authToken/);
  }
);

test.serial('Verify npm auth and package', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'valid-token', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);
  await t.notThrows(t.context.m.verifyConditions({}, {options: {}, logger: t.context.logger}));

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /_auth =/);
  t.regex(npmrc, /email =/);
});

test.serial('Verify npm auth and package from a sub-directory', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'valid-token', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./dist/package.json', pkg);
  await t.notThrows(t.context.m.verifyConditions({pkgRoot: 'dist'}, {options: {}, logger: t.context.logger}));

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /_auth =/);
  t.regex(npmrc, /email =/);
});

test.serial('Verify npm auth and package with "npm_config_registry" env var set by yarn', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  process.env.npm_config_registry = 'https://registry.yarnpkg.com'; // eslint-disable-line camelcase
  const pkg = {name: 'valid-token', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);
  await t.notThrows(t.context.m.verifyConditions({}, {options: {}, logger: t.context.logger}));

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /_auth =/);
  t.regex(npmrc, /email =/);
});

test.serial('Return nothing if no version if published', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'not-published', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);
  const nextRelease = await t.context.m.getLastRelease({}, {options: {branch: 'master'}, logger: t.context.logger});

  t.falsy(nextRelease);
});

test.serial('Return last version published', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'published', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);

  await appendFile(
    './.npmrc',
    `_auth = ${Buffer.from(`${process.env.NPM_USERNAME}:${process.env.NPM_PASSWORD}`, 'utf8').toString(
      'base64'
    )}\nemail = ${process.env.NPM_EMAIL}`
  );

  await execa('npm', ['publish']);

  const nextRelease = await t.context.m.getLastRelease({}, {options: {branch: 'master'}, logger: t.context.logger});
  t.is(nextRelease.version, '1.0.0');
});

test.serial('Return last version published on a dist-tag', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {
    name: 'published-next',
    version: '1.0.0',
    publishConfig: {options: {}, registry: npmRegistry.url, tag: 'next'},
  };
  await outputJson('./package.json', pkg);

  await appendFile(
    './.npmrc',
    `_auth = ${Buffer.from(`${process.env.NPM_USERNAME}:${process.env.NPM_PASSWORD}`, 'utf8').toString(
      'base64'
    )}\nemail = ${process.env.NPM_EMAIL}`
  );

  // Publish version 1.0.0 on latest and next
  await execa('npm', ['publish', '--tag=next']);
  pkg.version = '1.1.0';
  await outputJson('./package.json', pkg);
  // Publish version 1.1.0 on next
  await execa('npm', ['publish', '--tag=next']);

  const nextRelease = await t.context.m.getLastRelease({}, {options: {branch: 'master'}, logger: t.context.logger});
  t.is(nextRelease.version, '1.1.0');
});

test.serial('Return nothing for an unpublished package', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'unpublished', version: '1.0.0', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);

  await appendFile(
    './.npmrc',
    `_auth = ${Buffer.from(`${process.env.NPM_USERNAME}:${process.env.NPM_PASSWORD}`, 'utf8').toString(
      'base64'
    )}\nemail = ${process.env.NPM_EMAIL}`
  );

  await execa('npm', ['publish']);
  await execa('npm', ['unpublish', 'unpublished', '--force']);

  const nextRelease = await t.context.m.getLastRelease(
    {},
    {options: {branch: 'master', publish: ['@semantic-release/npm']}, logger: t.context.logger}
  );
  t.falsy(nextRelease);
});

test.serial('Throw SemanticReleaseError if publish "pkgRoot" option in getLastRelease is not a String', async t => {
  const pkg = {name: 'invalid-pkgRoot', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);
  const pkgRoot = 42;
  const error = await t.throws(
    t.context.m.getLastRelease(
      {},
      {
        options: {branch: 'master', publish: ['@semantic-release/github', {path: '@semantic-release/npm', pkgRoot}]},
        logger: t.context.logger,
      }
    )
  );

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.code, 'EINVALIDPKGROOT');
});

test.serial(
  'Throw SemanticReleaseError if publish "npmPublish" option in verifyConditions is not a Boolean',
  async t => {
    const pkg = {name: 'invalid-npmPublish', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
    await outputJson('./package.json', pkg);
    const npmPublish = 42;
    const error = await t.throws(
      t.context.m.verifyConditions(
        {},
        {
          options: {publish: ['@semantic-release/github', {path: '@semantic-release/npm', npmPublish}]},
          logger: t.context.logger,
        }
      )
    );

    t.is(error.name, 'SemanticReleaseError');
    t.is(error.code, 'EINVALIDNPMPUBLISH');
  }
);

test.serial(
  'Throw SemanticReleaseError if publish "tarballDir" option in verifyConditions is not a String',
  async t => {
    const pkg = {name: 'invalid-tarballDir', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
    await outputJson('./package.json', pkg);
    const tarballDir = 42;
    const error = await t.throws(
      t.context.m.verifyConditions(
        {},
        {
          options: {publish: ['@semantic-release/github', {path: '@semantic-release/npm', tarballDir}]},
          logger: t.context.logger,
        }
      )
    );

    t.is(error.name, 'SemanticReleaseError');
    t.is(error.code, 'EINVALIDTARBALLDIR');
  }
);

test.serial('Throw SemanticReleaseError if publish "pkgRoot" option in verifyConditions is not a String', async t => {
  const pkg = {name: 'invalid-pkgRoot', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);
  const pkgRoot = 42;
  const error = await t.throws(
    t.context.m.verifyConditions(
      {},
      {
        options: {publish: ['@semantic-release/github', {path: '@semantic-release/npm', pkgRoot}]},
        logger: t.context.logger,
      }
    )
  );

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.code, 'EINVALIDPKGROOT');
});

test.serial('Publish the package', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'publish', version: '0.0.0', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);

  await t.context.m.publish({}, {logger: t.context.logger, nextRelease: {version: '1.0.0'}});

  t.is((await readJson('./package.json')).version, '1.0.0');
  t.false(await pathExists(`./${pkg.name}-1.0.0.tgz`));
  t.is((await execa('npm', ['view', pkg.name, 'version'])).stdout, '1.0.0');
});

test.serial('Publish the package from a sub-directory', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'publish-sub-dir', version: '0.0.0', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./dist/package.json', pkg);

  await t.context.m.publish({pkgRoot: 'dist'}, {logger: t.context.logger, nextRelease: {version: '1.0.0'}});

  t.is((await readJson('./dist/package.json')).version, '1.0.0');
  t.false(await pathExists(`./${pkg.name}-1.0.0.tgz`));
  t.is((await execa('npm', ['view', pkg.name, 'version'])).stdout, '1.0.0');
});

test.serial('Create the package and skip publish', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  // Delete the authentication to make sure they are not required when skipping publish to registry
  delete process.env.NPM_TOKEN;
  delete process.env.NPM_USERNAME;
  delete process.env.NPM_PASSWORD;
  delete process.env.NPM_EMAIL;

  const pkg = {name: 'skip-publish', version: '0.0.0', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);

  await t.context.m.publish(
    {npmPublish: false, tarballDir: 'tarball'},
    {logger: t.context.logger, nextRelease: {version: '1.0.0'}}
  );

  t.is((await readJson('./package.json')).version, '1.0.0');
  t.true(await pathExists(`./tarball/${pkg.name}-1.0.0.tgz`));
  await t.throws(execa('npm', ['view', pkg.name, 'version']));
});

test.serial('Create the package and skip publish from a sub-directory', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'skip-publish-sub-dir', version: '0.0.0', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./dist/package.json', pkg);

  await t.context.m.publish(
    {npmPublish: false, tarballDir: './tarball', pkgRoot: './dist'},
    {logger: t.context.logger, nextRelease: {version: '1.0.0'}}
  );

  t.is((await readJson('./dist/package.json')).version, '1.0.0');
  t.true(await pathExists(`./tarball/${pkg.name}-1.0.0.tgz`));
  await t.throws(execa('npm', ['view', pkg.name, 'version']));
});

test.serial('Verify token and set up auth only on the fist call', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'test-module', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);

  await t.notThrows(t.context.m.verifyConditions({}, {options: {}, logger: t.context.logger}));

  let nextRelease = await t.context.m.getLastRelease({}, {options: {}, logger: t.context.logger});
  t.falsy(nextRelease);

  await t.context.m.publish({}, {logger: t.context.logger, nextRelease: {version: '1.0.0'}});

  nextRelease = await t.context.m.getLastRelease({}, {options: {}, logger: t.context.logger});
  t.is(nextRelease.version, '1.0.0');
});

test.serial('Retrieve gitHead with tag for package released on a git repository with packed-refs', async t => {
  Object.assign(process.env, npmRegistry.authEnv);
  const pkg = {name: 'test-packed-ref', version: '0.0.0-dev', publishConfig: {registry: npmRegistry.url}};
  await outputJson('./package.json', pkg);
  // Add commits to the master branch
  const commit = await gitCommit('First');
  await gitPackRefs();
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('1.0.0');
  await t.context.m.publish({}, {logger: t.context.logger, nextRelease: {version: '1.0.0'}});

  const nextRelease = await t.context.m.getLastRelease({}, {options: {}, logger: t.context.logger});
  t.is(nextRelease.gitHead.substring(0, 7), commit.hash);
});
