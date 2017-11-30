const execa = require('execa');
const getRegistry = require('./get-registry');
const updatePackageVersion = require('./update-package-version');

module.exports = async ({publishConfig, name}, version, logger) => {
  const registry = await getRegistry(publishConfig, name);
  await updatePackageVersion(version, logger);

  logger.log('Publishing version %s to npm registry', version);
  const shell = await execa('npm', ['publish', '--registry', registry]);
  process.stdout.write(shell.stdout);
};
