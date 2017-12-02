const path = require('path');
const {move} = require('fs-extra');
const execa = require('execa');
const getRegistry = require('./get-registry');
const updatePackageVersion = require('./update-package-version');

module.exports = async ({npmPublish, tarballDir}, {publishConfig, name}, version, logger) => {
  const registry = await getRegistry(publishConfig, name);
  await updatePackageVersion(version, logger);

  if (tarballDir) {
    logger.log('Creating npm package version %s', version);
    const tarball = await execa.stdout('npm', ['pack']);
    await move(tarball, path.join(tarballDir.trim(), tarball));
  }

  if (npmPublish !== false) {
    logger.log('Publishing version %s to npm registry', version);
    const shell = await execa('npm', ['publish', '--registry', registry]);
    process.stdout.write(shell.stdout);
  }
};
