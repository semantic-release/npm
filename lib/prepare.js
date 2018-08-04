const path = require('path');
const {move} = require('fs-extra');
const execa = require('execa');
const updatePackageVersion = require('./update-package-version');

module.exports = async ({tarballDir, pkgRoot}, {cwd, env, stdout, stderr, nextRelease: {version}, logger}) => {
  const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;
  await updatePackageVersion(version, basePath, logger);

  if (tarballDir) {
    logger.log('Creating npm package version %s', version);
    const {stdout: npmStdout, stderr: npmStderr} = await execa('npm', ['pack', basePath], {cwd, env});
    stdout.write(npmStdout);
    stderr.write(npmStderr);

    const tarball = npmStdout.split('\n').pop();
    await move(path.resolve(cwd, tarball), path.resolve(cwd, tarballDir.trim(), tarball));
  }
};
