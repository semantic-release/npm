import test from 'ava';
import {stub} from 'sinon';
import verify from '../lib/verify-config';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Verify "npmPublish", "tarballDir" and "pkgRoot" options', async t => {
  await t.notThrows(verify({npmPublish: true, tarballDir: 'release', pkgRoot: 'dist'}, {}, t.context.logger));
});

test('Throw SemanticReleaseError if "npmPublish" option is not a Boolean', async t => {
  const npmPublish = 42;
  const error = await t.throws(verify({npmPublish}, {}, t.context.logger));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.code, 'EINVALIDNPMPUBLISH');
});

test('Throw SemanticReleaseError if "tarballDir" option is not a String', async t => {
  const tarballDir = 42;
  const error = await t.throws(verify({tarballDir}, {}, t.context.logger));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.code, 'EINVALIDTARBALLDIR');
});

test('Throw SemanticReleaseError if "pkgRoot" option is not a String', async t => {
  const pkgRoot = 42;
  const error = await t.throws(verify({pkgRoot}, {}, t.context.logger));

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.code, 'EINVALIDPKGROOT');
});
