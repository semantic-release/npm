import test from 'ava';
import {writeFile, readFile} from 'fs-extra';
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
  await writeFile('./package.json', pkg);

  await updatePackageVersion('1.0.0', t.context.logger);

  // Verify package.json has been updated
  t.is((await readFile('./package.json')).toString(), pkg.replace('0.0.0-dev', '1.0.0'));

  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to package.json', '1.0.0']);
});

test.serial('Updade package.json and npm-shrinkwrap.json', async t => {
  const pkg = `{
    "name": "test"
    ,    "description":
"pacakage description",

    "version":      "0.0.0-dev"
  }`;
  // Create package.json in repository root
  await writeFile('./package.json', pkg);
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap']);
  const shrinkwrap = (await readFile('./npm-shrinkwrap.json')).toString();

  await updatePackageVersion('1.0.0', t.context.logger);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readFile('./package.json')).toString(), pkg.replace('0.0.0-dev', '1.0.0'));
  t.is((await readFile('./npm-shrinkwrap.json')).toString(), shrinkwrap.replace('0.0.0-dev', '1.0.0'));
  // Verify the logger has been called with the version updated
  t.deepEqual(t.context.log.args[0], ['Wrote version %s to package.json', '1.0.0']);
  t.deepEqual(t.context.log.args[1], ['Wrote version %s to npm-shrinkwrap.json', '1.0.0']);
});
