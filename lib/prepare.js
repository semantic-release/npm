const path = require('path');
const {move} = require('fs-extra');
const execa = require('execa');
const AggregateError = require("aggregate-error");
const getError = require("./get-error");
const getPkg = require("./get-pkg");

async function getPackages(cwd, packages) {
  return Promise.all(packages.map(async (pkg) => {
    return (await getPkg(pkg, {cwd})).name
  }))
}

module.exports = async (npmrc, packages, {cwd, env, stdout, stderr, nextRelease: {version}, logger}) => {
  const pkgs = await getPackages(cwd, packages)

  packages.forEach(({ pkgRoot }) => {
    const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;

    logger.log('Write version %s to package.json in %s', version, basePath);
  })
  // {tarballDir, pkgRoot}

  const workspaces = pkgs.map(pkg => ['--workspace', pkg]).reduce((acc, val) => acc.concat(val), [])

  const versionResult = execa(
    'npm',
    ['version', version, '--userconfig', npmrc, '--no-git-tag-version', '--allow-same-version'].concat(workspaces),
    {
      cwd,
      env,
      preferLocal: true,
    }
  );
  versionResult.stdout.pipe(stdout, {end: false});
  versionResult.stderr.pipe(stderr, {end: false});

  await versionResult;

  await Promise.all(packages.map(async ({tarballDir, pkgRoot}) => {
    if (tarballDir) {
      const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;
      logger.log('Creating npm package version %s', version);
      const packResult = execa('npm', ['pack', basePath, '--userconfig', npmrc], {cwd, env, preferLocal: true});
      packResult.stdout.pipe(stdout, {end: false});
      packResult.stderr.pipe(stderr, {end: false});

      const tarball = (await packResult).stdout.split('\n').pop();
      const tarballSource = path.resolve(cwd, tarball);
      const tarballDestination = path.resolve(cwd, tarballDir.trim(), tarball);

      // Only move the tarball if we need to
      // Fixes: https://github.com/semantic-release/npm/issues/169
      if (tarballSource !== tarballDestination) {
        await move(tarballSource, tarballDestination);
      }
    }
  }))
};
