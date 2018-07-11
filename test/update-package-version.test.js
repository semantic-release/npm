import path from 'path';
import test from 'ava';
import {outputJson, readJson, outputFile, readFile} from 'fs-extra';
import tempy from 'tempy';
import execa from 'execa';
import {stub} from 'sinon';
import updatePackageVersion from '../lib/update-package-version';

test.beforeEach(t => {
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Updade package.json', async t => {
  const cwd = tempy.directory();
  const packagePath = path.resolve(cwd, 'package.json');
  await outputJson(packagePath, {version: '0.0.0-dev'});

  await updatePackageVersion('1.0.0', cwd, t.context.logger);

  // Verify package.json has been updated
  t.is((await readJson(packagePath)).version, '1.0.0');

  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', packagePath]);
});

test('Updade package.json and npm-shrinkwrap.json', async t => {
  const cwd = tempy.directory();
  const packagePath = path.resolve(cwd, 'package.json');
  const shrinkwrapPath = path.resolve(cwd, 'npm-shrinkwrap.json');
  await outputJson(packagePath, {version: '0.0.0-dev'});
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap'], {cwd});

  await updatePackageVersion('1.0.0', cwd, t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson(packagePath)).version, '1.0.0');
  t.is((await readJson(shrinkwrapPath)).version, '1.0.0');
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', packagePath]);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to %s', '1.0.0', shrinkwrapPath]);
});

test('Updade package.json and package-lock.json', async t => {
  const cwd = tempy.directory();
  const packagePath = path.resolve(cwd, 'package.json');
  const packageLockPath = path.resolve(cwd, 'package-lock.json');
  await outputJson(packagePath, {version: '0.0.0-dev'});
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['install'], {cwd});

  await updatePackageVersion('1.0.0', cwd, t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson(packagePath)).version, '1.0.0');
  t.is((await readJson(packageLockPath)).version, '1.0.0');
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', packagePath]);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to %s', '1.0.0', packageLockPath]);
});

test('Updade package.json and npm-shrinkwrap.json in a sub-directory', async t => {
  const cwd = tempy.directory();
  const pkgRoot = 'dist';
  const packagePath = path.resolve(cwd, pkgRoot, 'package.json');
  const shrinkwrapPath = path.resolve(cwd, pkgRoot, 'npm-shrinkwrap.json');
  await outputJson(packagePath, {version: '0.0.0-dev'});
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap'], {cwd: path.resolve(cwd, pkgRoot)});

  await updatePackageVersion('1.0.0', path.resolve(cwd, pkgRoot), t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson(packagePath)).version, '1.0.0');
  t.is((await readJson(path.resolve(cwd, 'dist', 'npm-shrinkwrap.json'))).version, '1.0.0');
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', packagePath]);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to %s', '1.0.0', shrinkwrapPath]);
});

test('Preserve indentation and newline', async t => {
  const cwd = tempy.directory();
  const packagePath = path.resolve(cwd, 'package.json');
  await outputFile(packagePath, `{\r\n        "name": "package-name",\r\n        "version": "0.0.0-dev"\r\n}\r\n`);

  await updatePackageVersion('1.0.0', cwd, t.context.logger);

  // Verify package.json has been updated
  t.is(
    await readFile(packagePath, 'utf-8'),
    `{\r\n        "name": "package-name",\r\n        "version": "1.0.0"\r\n}\r\n`
  );

  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', packagePath]);
});

test('Use default indentation and newline if it cannot be detected', async t => {
  const cwd = tempy.directory();
  const packagePath = path.resolve(cwd, 'package.json');
  await outputFile(packagePath, `{"name": "package-name","version": "0.0.0-dev"}`);

  await updatePackageVersion('1.0.0', cwd, t.context.logger);

  // Verify package.json has been updated
  t.is(await readFile(packagePath, 'utf-8'), `{\n  "name": "package-name",\n  "version": "1.0.0"\n}\n`);

  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', packagePath]);
});
