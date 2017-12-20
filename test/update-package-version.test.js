import test from 'ava';
import {outputFile, readFile} from 'fs-extra';
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
  const pkg = `{
  "name": "test",
  "description": "pacakage description",
  "version":
       "0.0.0-dev"   ,
  "arr": [
    1,
        2, 3
      ]
}
`;

  // Create package.json in repository root
  await outputFile('./package.json', pkg);

  await updatePackageVersion('1.0.0', '.', t.context.logger);

  // Verify package.json has been updated
  t.is((await readFile('./package.json')).toString(), pkg.replace('0.0.0-dev', '1.0.0'));

  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', 'package.json']);
});

test.serial('Updade package.json and npm-shrinkwrap.json', async t => {
  const pkg = `{
    "name": "test"
    ,    "description":
"pacakage description",

    "version":      "0.0.0-dev"
  }`;
  // Create package.json in repository root
  await outputFile('./package.json', pkg);
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap']);
  const shrinkwrap = (await readFile('./npm-shrinkwrap.json')).toString();

  await updatePackageVersion('1.0.0', '.', t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readFile('./package.json')).toString(), pkg.replace('0.0.0-dev', '1.0.0'));
  t.is((await readFile('./npm-shrinkwrap.json')).toString(), shrinkwrap.replace('0.0.0-dev', '1.0.0'));
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', 'package.json']);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to %s', '1.0.0', 'npm-shrinkwrap.json']);
});

test.serial('Updade package.json and npm-shrinkwrap.json in a sub-directory', async t => {
  const pkg = `{
    "name": "test","description":"pacakage description","version":"0.0.0-dev"
  }`;

  // Create package.json in repository root
  await outputFile('./dist/package.json', pkg);
  process.chdir('dist');
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap']);
  process.chdir('..');
  const shrinkwrap = (await readFile('./dist/npm-shrinkwrap.json')).toString();

  await updatePackageVersion('1.0.0', 'dist', t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readFile('./dist/package.json')).toString(), pkg.replace('0.0.0-dev', '1.0.0'));
  t.is((await readFile('./dist/npm-shrinkwrap.json')).toString(), shrinkwrap.replace('0.0.0-dev', '1.0.0'));
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to %s', '1.0.0', 'dist/package.json']);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to %s', '1.0.0', 'dist/npm-shrinkwrap.json']);
});
