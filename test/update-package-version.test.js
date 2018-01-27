import test from 'ava';
import {outputJson, readJson} from 'fs-extra';
import tempy from 'tempy';
import execa from 'execa';
import {stub} from 'sinon';
import updatePackageVersion from '../lib/update-package-version';

// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(t => {
  process.chdir(tempy.directory());

  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test.afterEach.always(() => {
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Updade package.json', async t => {
  // Create package.json in repository root
  await outputJson('./package.json', {version: '0.0.0-dev'});

  await updatePackageVersion('1.0.0', '.', t.context.logger);

  // Verify package.json has been updated
  t.is((await readJson('./package.json')).version, '1.0.0');

  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', 'package.json']);
});

test.serial('Updade package.json and npm-shrinkwrap.json', async t => {
  // Create package.json in repository root
  await outputJson('./package.json', {version: '0.0.0-dev'});
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap']);

  await updatePackageVersion('1.0.0', '.', t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, '1.0.0');
  t.is((await readJson('./npm-shrinkwrap.json')).version, '1.0.0');
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', 'package.json']);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to %s', '1.0.0', 'npm-shrinkwrap.json']);
});


test.serial('Updade package.json and npm-shrinkwrap.json in a sub-directory', async t => {
  // Create package.json in repository root
  await outputJson('./dist/package.json', {version: '0.0.0-dev'});
  process.chdir('dist');
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap']);
  process.chdir('..');

  await updatePackageVersion('1.0.0', 'dist', t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./dist/package.json')).version, '1.0.0');
  t.is((await readJson('./dist/npm-shrinkwrap.json')).version, '1.0.0');
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', 'dist/package.json']);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to %s', '1.0.0', 'dist/npm-shrinkwrap.json']);
});
