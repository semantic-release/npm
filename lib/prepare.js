const path = require('path');
const {move} = require('fs-extra');
const execa = require('execa');
const updatePackageVersion = require('./update-package-version');

module.exports = async ({tarballDir, pkgRoot}, {cwd, nextRelease: {version}, logger}) => {
  const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;
  await updatePackageVersion(version, basePath, logger);

  if (tarballDir) {
    logger.log('Creating npm package version %s', version);
    const tarball = (await execa.stdout('npm', ['pack', basePath], {cwd})).split('\n').pop();
    await move(path.resolve(cwd, tarball), path.resolve(cwd, tarballDir.trim(), tarball));
  }
};
