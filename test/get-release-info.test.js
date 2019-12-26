import test from 'ava';
import {writeFile} from 'fs-extra';
import tempy from 'tempy';
import getReleaseInfo from '../lib/get-release-info';

test.beforeEach(() => {
  // Delete all `npm_config` environment variable set by CI as they take precedence over the `.npmrc` because the process that runs the tests is started before the `.npmrc` is created
  for (let i = 0, keys = Object.keys(process.env); i < keys.length; i++) {
    if (keys[i].startsWith('npm_')) {
      delete process.env[keys[i]];
    }
  }
});

test('Default registry and tag', async t => {
  const cwd = tempy.directory();
  const npmrc = tempy.file({name: '.npmrc'});

  t.deepEqual(
    await getReleaseInfo(
      npmrc,
      {name: 'module'},
      {cwd, env: {}, nextRelease: {version: '1.0.0'}},
      'https://registry.npmjs.org/'
    ),
    {
      name: 'npm package (@latest dist-tag)',
      url: 'https://www.npmjs.com/package/module/v/1.0.0',
    }
  );
});

test('Default registry, tag and scoped module', async t => {
  const cwd = tempy.directory();
  const npmrc = tempy.file({name: '.npmrc'});

  t.deepEqual(
    await getReleaseInfo(
      npmrc,
      {name: '@scope/module'},
      {cwd, env: {}, nextRelease: {version: '1.0.0'}},
      'https://registry.npmjs.org/'
    ),
    {
      name: 'npm package (@latest dist-tag)',
      url: 'https://www.npmjs.com/package/@scope/module/v/1.0.0',
    }
  );
});

test('Custom registry, tag and scoped module', async t => {
  const cwd = tempy.directory();
  const npmrc = tempy.file({name: '.npmrc'});

  t.deepEqual(
    await getReleaseInfo(
      npmrc,
      {name: '@scope/module'},
      {cwd, env: {}, nextRelease: {version: '1.0.0'}},
      'https://custom.registry.org/'
    ),
    {
      name: 'npm package (@latest dist-tag)',
      url: undefined,
    }
  );
});

test('Default registry and tag from .npmrc', async t => {
  const cwd = tempy.directory();
  const npmrc = tempy.file({name: '.npmrc'});
  await writeFile(npmrc, 'tag=npmrc');

  t.deepEqual(
    await getReleaseInfo(
      npmrc,
      {name: 'module', publishConfig: {}},
      {cwd, env: {}, nextRelease: {version: '1.0.0'}},
      'https://registry.npmjs.org/'
    ),
    {
      name: 'npm package (@npmrc dist-tag)',
      url: 'https://www.npmjs.com/package/module/v/1.0.0',
    }
  );
});

test('Default registry and tag from package.json', async t => {
  const cwd = tempy.directory();
  const npmrc = tempy.file({name: '.npmrc'});

  await writeFile(npmrc, 'tag=npmrc');

  t.deepEqual(
    await getReleaseInfo(
      npmrc,
      {name: 'module', publishConfig: {tag: 'pkg'}},
      {cwd, env: {}, nextRelease: {version: '1.0.0'}},
      'https://registry.npmjs.org/'
    ),
    {name: 'npm package (@pkg dist-tag)', url: 'https://www.npmjs.com/package/module/v/1.0.0'}
  );
});

test('Default tag', async t => {
  const cwd = tempy.directory();
  const npmrc = tempy.file({name: '.npmrc'});

  await writeFile(npmrc, 'tag=');

  t.deepEqual(
    await getReleaseInfo(
      npmrc,
      {name: 'module', publishConfig: {}},
      {cwd, env: {}, nextRelease: {version: '1.0.0'}},
      'https://registry.npmjs.org/'
    ),
    {
      name: 'npm package (@latest dist-tag)',
      url: 'https://www.npmjs.com/package/module/v/1.0.0',
    }
  );
});
