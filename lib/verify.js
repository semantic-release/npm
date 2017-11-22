const execa = require('execa');
const SemanticReleaseError = require('@semantic-release/error');
const verifyPkg = require('./verify-pkg');
const setNpmrcAuth = require('./set-npmrc-auth');

module.exports = async (pkg, logger) => {
  verifyPkg(pkg);
  await setNpmrcAuth(pkg, logger);
  try {
    await execa('npm', ['whoami']);
  } catch (err) {
    throw new SemanticReleaseError('Invalid npm token.', 'EINVALIDNPMTOKEN');
  }
};
