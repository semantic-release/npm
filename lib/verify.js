const execa = require('execa');
const SemanticReleaseError = require('@semantic-release/error');
const setNpmrcAuth = require('./set-npmrc-auth');

module.exports = async (pkg, logger) => {
  await setNpmrcAuth(pkg, logger);
  try {
    await execa('npm', ['whoami']);
  } catch (err) {
    throw new SemanticReleaseError('Invalid npm token.', 'EINVALIDNPMTOKEN');
  }
};
