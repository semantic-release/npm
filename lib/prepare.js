const path = require('path');
const {move} = require('fs-extra');
const execa = require('execa');
const updatePackageVersion = require('./update-package-version');

module.exports = async ({tarballDir, pkgRoot}, {cwd, env, stdout, stderr, nextRelease: {version}, logger}) => {
  const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;
  await updatePackageVersion(version, basePath, logger);

  if (tarballDir) {
    logger.log('Creating npm package version %s', version);
    const result = execa('npm', ['pack', basePath], {cwd, env});
    result.stdout.pipe(
      stdout,
      {end: false}
    );
    result.stderr.pipe(
      stderr,
      {end: false}
    );

    const tarball = (await result).stdout.split('\n').pop();
    await move(path.resolve(cwd, tarball), path.resolve(cwd, tarballDir.trim(), tarball));
  }
};
