import {writeFile} from 'fs-extra';
import test from 'ava';
import tempy from 'tempy';
import getReleaseInfo from '../lib/get-release-info';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(() => {
  // Change current working directory to a temp directory
  process.chdir(tempy.directory());
  // Delete all `npm_config` environment variable set by CI as they take precedence over the `.npmrc` because the process that runs the tests is started before the `.npmrc` is created
  for (let i = 0, keys = Object.keys(process.env); i < keys.length; i++) {
    if (keys[i].startsWith('npm_')) {
      delete process.env[keys[i]];
    }
  }
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Default registry and tag', async t => {
  t.deepEqual(await getReleaseInfo('module', null, 'https://registry.npmjs.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: 'https://www.npmjs.com/package/module',
  });
});

test.serial('Default registry, tag and scoped module', async t => {
  t.deepEqual(await getReleaseInfo('@scope/module', null, 'https://registry.npmjs.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: 'https://www.npmjs.com/package/@scope/module',
  });
});

test.serial('Custom registry, tag and scoped module', async t => {
  t.deepEqual(await getReleaseInfo('@scope/module', null, 'https://custom.registry.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: undefined,
  });
});

test.serial('Default registry and tag from .npmrc', async t => {
  await writeFile('./.npmrc', 'tag=npmrc');
  t.deepEqual(await getReleaseInfo('module', {}, 'https://registry.npmjs.org/'), {
    name: 'npm package (@npmrc dist-tag)',
    url: 'https://www.npmjs.com/package/module',
  });
});

test.serial('Default registry and tag from package.json', async t => {
  await writeFile('./.npmrc', 'tag=npmrc');
  t.deepEqual(await getReleaseInfo('module', {tag: 'pkg'}, 'https://registry.npmjs.org/'), {
    name: 'npm package (@pkg dist-tag)',
    url: 'https://www.npmjs.com/package/module',
  });
});

test.serial('Default tag', async t => {
  await writeFile('./.npmrc', 'tag=');
  t.deepEqual(await getReleaseInfo('module', {}, 'https://registry.npmjs.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: 'https://www.npmjs.com/package/module',
  });
});
