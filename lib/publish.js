const execa = require('execa');
const getRegistry = require('./get-registry');
const getReleaseInfo = require('./get-release-info');

module.exports = async (
  {npmPublish, pkgRoot},
  {publishConfig, name, private: priv},
  {nextRelease: {version}, logger}
) => {
  if (npmPublish !== false && priv !== true) {
    const basePath = pkgRoot || '.';
    const registry = await getRegistry(publishConfig, name);

    logger.log('Publishing version %s to npm registry', version);
    const shell = await execa('npm', ['publish', `./${basePath}`, '--registry', registry]);

    process.stdout.write(shell.stdout);
    return getReleaseInfo(name, publishConfig, registry);
  }
  logger.log(
    'Skip publishing to npm registry as %s is %s',
    ...(npmPublish === false ? ['npmPublish', false] : ["package.json's private property", true])
  );
};
