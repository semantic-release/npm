const path = require('path');
const {move} = require('fs-extra');
const execa = require('execa');
const updatePackageVersion = require('./update-package-version');

module.exports = async ({tarballDir, pkgRoot}, {nextRelease: {version}, logger}) => {
  const basePath = pkgRoot || '.';
  await updatePackageVersion(version, basePath, logger);

  if (tarballDir) {
    logger.log('Creating npm package version %s', version);
    const tarball = (await execa.stdout('npm', ['pack', `./${basePath}`])).split('\n').pop();
    await move(tarball, path.join(tarballDir.trim(), tarball));
  }
};
