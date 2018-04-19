const execa = require('execa');
const getRegistry = require('./get-registry');
const getReleaseInfo = require('./get-release-info');

module.exports = async ({npmPublish, pkgRoot, registry: _registry}, {publishConfig, name}, version, logger) => {
  if (npmPublish !== false) {
    const basePath = pkgRoot || '.';
    const registry = _registry || (await getRegistry(publishConfig, name));
    logger.log('Publishing version %s to npm registry', version);
    const shell = await execa('npm', ['publish', `./${basePath}`, '--registry', registry]);
    process.stdout.write(shell.stdout);
    return getReleaseInfo(name, publishConfig, registry);
  }
};
