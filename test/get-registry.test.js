const path = require('path');
const test = require('ava');
const {appendFile} = require('fs-extra');
const tempy = require('tempy');
const getRegistry = require('../lib/get-registry');

test('Get default registry', (t) => {
  const cwd = tempy.directory();
  t.is(getRegistry({name: 'package-name'}, {cwd, env: {}}), 'https://registry.npmjs.org/');
  t.is(getRegistry({name: 'package-name', publishConfig: {}}, {cwd, env: {}}), 'https://registry.npmjs.org/');
});

test('Get the registry configured in ".npmrc" and normalize trailing slash', async (t) => {
  const cwd = tempy.directory();
  await appendFile(path.resolve(cwd, '.npmrc'), 'registry = https://custom1.registry.com');

  t.is(getRegistry({name: 'package-name'}, {cwd, env: {}}), 'https://custom1.registry.com/');
});

test('Get the registry configured from "publishConfig"', async (t) => {
  const cwd = tempy.directory();
  await appendFile(path.resolve(cwd, '.npmrc'), 'registry = https://custom2.registry.com');

  t.is(
    getRegistry({name: 'package-name', publishConfig: {registry: 'https://custom3.registry.com/'}}, {cwd, env: {}}),
    'https://custom3.registry.com/'
  );
});

test('Get the registry configured in "NPM_CONFIG_REGISTRY"', (t) => {
  const cwd = tempy.directory();

  t.is(
    getRegistry({name: 'package-name'}, {cwd, env: {NPM_CONFIG_REGISTRY: 'https://custom1.registry.com/'}}),
    'https://custom1.registry.com/'
  );
});

test('Get the registry configured in ".npmrc" for scoped package', async (t) => {
  const cwd = tempy.directory();
  await appendFile(path.resolve(cwd, '.npmrc'), '@scope:registry = https://custom3.registry.com');

  t.is(getRegistry({name: '@scope/package-name'}, {cwd, env: {}}), 'https://custom3.registry.com/');
});

test.serial('Get the registry configured via "NPM_CONFIG_USERCONFIG" for scoped package', async (t) => {
  const cwd = tempy.directory();
  await appendFile(path.resolve(cwd, '.custom-npmrc'), '@scope:registry = https://custom4.registry.com');

  t.is(
    getRegistry(
      {
        name: '@scope/package-name',
      },
      {
        cwd,
        env: {NPM_CONFIG_USERCONFIG: path.resolve(cwd, '.custom-npmrc')},
      }
    ),
    'https://custom4.registry.com/'
  );
});
