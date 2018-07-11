const path = require('path');
const execa = require('execa');
const getRegistry = require('./get-registry');
const getReleaseInfo = require('./get-release-info');

module.exports = async ({npmPublish, pkgRoot}, pkg, context) => {
  const {
    cwd,
    env,
    nextRelease: {version},
    logger,
  } = context;

  if (npmPublish !== false && pkg.private !== true) {
    const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;
    const registry = getRegistry(pkg, context);

    logger.log('Publishing version %s to npm registry', version);
    const shell = await execa('npm', ['publish', basePath, '--registry', registry], {cwd, env});

    logger.stdout(shell.stdout);
    return getReleaseInfo(pkg, context, registry);
  }
  logger.log(
    'Skip publishing to npm registry as %s is %s',
    ...(npmPublish === false ? ['npmPublish', false] : ["package.json's private property", true])
  );
};
