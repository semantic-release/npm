const execa = require('execa');
const SemanticReleaseError = require('@semantic-release/error');
const getRegistry = require('./get-registry');
const setNpmrcAuth = require('./set-npmrc-auth');

module.exports = async (pkg, logger) => {
  const registry = await getRegistry(pkg.publishConfig, pkg.name);
  await setNpmrcAuth(registry, logger);
  try {
    await execa('npm', ['whoami', '--registry', registry]);
  } catch (err) {
    throw new SemanticReleaseError('Invalid npm token.', 'EINVALIDNPMTOKEN');
  }
};
