import test from 'ava';
import {appendFile} from 'fs-extra';
import tempy from 'tempy';
import getRegistry from '../lib/get-registry';

// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(() => {
  // Change current working directory to a temp directory
  process.chdir(tempy.directory());
});

test.afterEach.always(() => {
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Get default registry', async t => {
  t.is(await getRegistry(undefined, 'package-name'), 'https://registry.npmjs.org/');
  t.is(await getRegistry({}, 'package-name'), 'https://registry.npmjs.org/');
});

test.serial('Get the registry configured in ".npmrc" and normalize trailing slash', async t => {
  await appendFile('./.npmrc', 'registry = https://custom1.registry.com');

  t.is(await getRegistry({}, 'package-name'), 'https://custom1.registry.com/');
});

test.serial('Get the registry configured from "publishConfig"', async t => {
  t.is(await getRegistry({registry: 'https://custom2.registry.com/'}, 'package-name'), 'https://custom2.registry.com/');
});

test.serial('Get the registry configured in ".npmrc" for scoped package', async t => {
  await appendFile('./.npmrc', '@scope:registry = https://custom3.registry.com');

  t.is(await getRegistry({}, '@scope/package-name'), 'https://custom3.registry.com/');
});
