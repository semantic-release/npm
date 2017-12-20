import test from 'ava';
import {outputJson, writeFile} from 'fs-extra';
import tempy from 'tempy';
import getPkg from '../lib/get-pkg';

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

test.serial('Verify name and return parsed package.json', async t => {
  const pkg = {name: 'package', version: '0.0.0'};
  await outputJson('./package.json', pkg);

  const result = await getPkg();
  t.is(pkg.name, result.name);
  t.is(pkg.version, result.version);
});

test.serial('Verify name and return parsed package.json from a sub-directory', async t => {
  const pkg = {name: 'package', version: '0.0.0'};
  await outputJson('./dist/package.json', pkg);

  const result = await getPkg('dist');
  t.is(pkg.name, result.name);
  t.is(pkg.version, result.version);
});

test.serial('Throw error if missing package.json', async t => {
  const error = await t.throws(getPkg());

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.code, 'ENOPKG');
});

test.serial('Throw error if missing package name', async t => {
  await outputJson('./package.json', {version: '0.0.0'});

  const error = await t.throws(getPkg());

  t.is(error.name, 'SemanticReleaseError');
  t.is(error.code, 'ENOPKGNAME');
});

test.serial('Throw error if package.json is malformed', async t => {
  await writeFile('./package.json', "{name: 'package',}");

  const error = await t.throws(getPkg());

  t.is(error.name, 'JSONError');
});
