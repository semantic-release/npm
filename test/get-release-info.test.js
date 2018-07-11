import path from 'path';
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

  t.deepEqual(await getReleaseInfo({name: 'module'}, {cwd, env: {}}, 'https://registry.npmjs.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: 'https://www.npmjs.com/package/module',
  });
});

test('Default registry, tag and scoped module', async t => {
  const cwd = tempy.directory();

  t.deepEqual(await getReleaseInfo({name: '@scope/module'}, {cwd, env: {}}, 'https://registry.npmjs.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: 'https://www.npmjs.com/package/@scope/module',
  });
});

test('Custom registry, tag and scoped module', async t => {
  const cwd = tempy.directory();

  t.deepEqual(await getReleaseInfo({name: '@scope/module'}, {cwd, env: {}}, 'https://custom.registry.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: undefined,
  });
});

test('Default registry and tag from .npmrc', async t => {
  const cwd = tempy.directory();
  await writeFile(path.resolve(cwd, '.npmrc'), 'tag=npmrc');

  t.deepEqual(
    await getReleaseInfo({name: 'module', publishConfig: {}}, {cwd, env: {}}, 'https://registry.npmjs.org/'),
    {
      name: 'npm package (@npmrc dist-tag)',
      url: 'https://www.npmjs.com/package/module',
    }
  );
});

test('Default registry and tag from package.json', async t => {
  const cwd = tempy.directory();

  await writeFile(path.resolve(cwd, '.npmrc'), 'tag=npmrc');

  t.deepEqual(
    await getReleaseInfo({name: 'module', publishConfig: {tag: 'pkg'}}, {cwd, env: {}}, 'https://registry.npmjs.org/'),
    {name: 'npm package (@pkg dist-tag)', url: 'https://www.npmjs.com/package/module'}
  );
});

test('Default tag', async t => {
  const cwd = tempy.directory();

  await writeFile(path.resolve(cwd, '.npmrc'), 'tag=');

  t.deepEqual(
    await getReleaseInfo({name: 'module', publishConfig: {}}, {cwd, env: {}}, 'https://registry.npmjs.org/'),
    {
      name: 'npm package (@latest dist-tag)',
      url: 'https://www.npmjs.com/package/module',
    }
  );
});
