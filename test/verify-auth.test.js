const test = require('ava');
const {stub} = require('sinon');
const tempy = require('tempy');

const getRegistryPath = require.resolve('../lib/get-registry');
const verifyAuthPath = require.resolve('../lib/verify-auth');
const setNmprcAuthPath = require.resolve('../lib/set-npmrc-auth');
const execaPath = require.resolve('execa');

const resetModuleCache = () => {
  require.cache[getRegistryPath] = undefined;
  require.cache[verifyAuthPath] = undefined;
  require.cache[setNmprcAuthPath] = undefined;
  require.cache[execaPath] = undefined;
};

test.before(resetModuleCache);
test.after(resetModuleCache);

test('Verify `npm-whoami` calls memoization', async (t) => {
  const pkg = {};
  const context = {cwd: tempy.directory(), env: {}};
  const fakeExeca = stub().returns({stdout: {pipe() {}}, stderr: {pipe() {}}});

  require.cache[getRegistryPath] = {id: getRegistryPath, exports: () => 'https://registry.npmjs.org/'};
  require.cache[setNmprcAuthPath] = {id: setNmprcAuthPath, exports: () => {}};
  require.cache[execaPath] = {id: execaPath, exports: fakeExeca};

  const verifyAuth = require('../lib/verify-auth');

  await verifyAuth('foo', pkg, context);
  await verifyAuth('foo', pkg, context);
  await verifyAuth('foo', pkg, context);

  t.assert(fakeExeca.calledOnce);

  fakeExeca.resetHistory();

  await verifyAuth('foo', pkg, context);
  await verifyAuth('bar', pkg, context);

  t.assert(fakeExeca.calledTwice);
});
