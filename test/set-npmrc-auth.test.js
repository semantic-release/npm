import {readFile, appendFile} from 'fs-extra';
import test from 'ava';
import {stub} from 'sinon';
import tempy from 'tempy';
import setNpmrcAuth from '../lib/set-npmrc-auth';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(t => {
  // Delete env paramaters that could have been set on the machine running the tests
  delete process.env.NPM_TOKEN;
  delete process.env.NPM_USERNAME;
  delete process.env.NPM_PASSWORD;
  delete process.env.NPM_EMAIL;
  // Change current working directory to a temp directory
  process.chdir(tempy.directory());
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

test.serial('Set auth with "NPM_TOKEN"', async t => {
  process.env.NPM_TOKEN = 'npm_token';
  await setNpmrcAuth('http://custom.registry.com', t.context.logger);

  const npmrc = (await readFile('.npmrc')).toString();
  t.regex(npmrc, /\/\/custom.registry.com\/:_authToken = \$\{NPM_TOKEN\}/);
  t.deepEqual(t.context.log.args[1], ['Wrote NPM_TOKEN to .npmrc.']);
});

test.serial('Set auth with "NPM_USERNAME", "NPM_PASSWORD" and "NPM_EMAIL"', async t => {
  process.env.NPM_USERNAME = 'npm_username';
  process.env.NPM_PASSWORD = 'npm_pasword';
  process.env.NPM_EMAIL = 'npm_email';

  await setNpmrcAuth('http://custom.registry.com', t.context.logger);

  const npmrc = (await readFile('.npmrc')).toString();
  t.is(npmrc, `\n_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`);
  t.deepEqual(t.context.log.args[1], ['Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to .npmrc.']);
});

test.serial('Do not modify ".npmrc" if auth is already configured', async t => {
  await appendFile('./.npmrc', `//custom.registry.com/:_authToken = \${NPM_TOKEN}`);
  await setNpmrcAuth('http://custom.registry.com', t.context.logger);

  t.is(t.context.log.callCount, 1);
});

test.serial('Do not modify ".npmrc" if auth is already configured for a scoped package', async t => {
  await appendFile(
    './.npmrc',
    `@scope:registry=http://custom.registry.com\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
  );
  await setNpmrcAuth('http://custom.registry.com', t.context.logger);

  t.is(t.context.log.callCount, 1);
});

test.serial('Throw error if "NPM_TOKEN" is missing', async t => {
  const error = await t.throws(setNpmrcAuth('http://custom.registry.com', t.context.logger));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test.serial('Throw error if "NPM_USERNAME" is missing', async t => {
  process.env.NPM_PASSWORD = 'npm_pasword';
  process.env.NPM_EMAIL = 'npm_email';
  const error = await t.throws(setNpmrcAuth('http://custom.registry.com', t.context.logger));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test.serial('Throw error if "NPM_PASSWORD" is missing', async t => {
  process.env.NPM_USERNAME = 'npm_username';
  process.env.NPM_EMAIL = 'npm_email';
  const error = await t.throws(setNpmrcAuth('http://custom.registry.com', t.context.logger));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});

test.serial('Throw error if "NPM_EMAIL" is missing', async t => {
  process.env.NPM_USERNAME = 'npm_username';
  process.env.NPM_PASSWORD = 'npm_password';
  const error = await t.throws(setNpmrcAuth('http://custom.registry.com', t.context.logger));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'No npm token specified.');
  t.is(error.code, 'ENONPMTOKEN');
});
