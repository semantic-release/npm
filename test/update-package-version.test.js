import test from 'ava';
import {writeJson, readJson} from 'fs-extra';
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
  await writeJson('./package.json', {version: '0.0.0-dev'});

  await updatePackageVersion('1.0.0', t.context.logger);

  // Verify package.json has been updated
  t.is((await readJson('./package.json')).version, '1.0.0');
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to package.json', '1.0.0']);
});

test.serial('Updade package.json and npm-shrinkwrap.json', async t => {
  // Create package.json in repository root
  await writeJson('./package.json', {version: '0.0.0-dev'});
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap']);

  await updatePackageVersion('1.0.0', t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, '1.0.0');
  t.is((await readJson('./npm-shrinkwrap.json')).version, '1.0.0');
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to package.json', '1.0.0']);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to npm-shrinkwrap.json', '1.0.0']);
});
