const test = require('ava');
const transformConfig = require('../lib/transform-plugin-config');

test('Support the same config as the plugin', (t) => {
  const config = {};

  const result = transformConfig(config);
  t.is(result.length, 1);
});

test('Support multi config', (t) => {
  let config = {
    packages: [
      {npmPublish: false, tarballDir: './tarball', pkgRoot: './dist-a'},
      {npmPublish: false, tarballDir: './tarball', pkgRoot: './dist-b'},
    ],
  };

  let result = transformConfig(config);
  t.is(result.length, 2);

  config = {
    packages: ['./dist-a', './dist-b'],
  };

  result = transformConfig(config);

  t.is(result.length, 2);
  t.deepEqual(result, [
    {npmPublish: undefined, tarballDir: undefined, pkgRoot: './dist-a'},
    {npmPublish: undefined, tarballDir: undefined, pkgRoot: './dist-b'},
  ]);
});

test('Support cover the config', (t) => {
  const config = {
    npmPublish: false,
    tarballDir: './tarball',
    packages: [{npmPublish: false, tarballDir: './tarball', pkgRoot: './dist-a'}, './dist-b'],
  };

  const result = transformConfig(config);

  t.is(result.length, 2);
  t.deepEqual(result, [
    {npmPublish: false, tarballDir: './tarball', pkgRoot: './dist-a'},
    {npmPublish: false, tarballDir: './tarball', pkgRoot: './dist-b'},
  ]);
});
