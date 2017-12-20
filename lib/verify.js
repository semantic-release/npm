const {isString, isUndefined, isBoolean} = require('lodash');
const execa = require('execa');
const SemanticReleaseError = require('@semantic-release/error');
const getRegistry = require('./get-registry');
const setNpmrcAuth = require('./set-npmrc-auth');

module.exports = async ({npmPublish, tarballDir, pkgRoot}, pkg, logger) => {
  if (!isUndefined(npmPublish) && !isBoolean(npmPublish)) {
    throw new SemanticReleaseError('The "npmPublish" options, if defined, must be a Boolean.', 'EINVALIDNPMPUBLISH');
  }

  if (!isUndefined(tarballDir) && !isString(tarballDir)) {
    throw new SemanticReleaseError('The "tarballDir" options, if defined, must be a String.', 'EINVALIDTARBALLDIR');
  }

  if (!isUndefined(pkgRoot) && !isString(pkgRoot)) {
    throw new SemanticReleaseError('The "pkgRoot" options, if defined, must be a String.', 'EINVALIDPKGROOT');
  }

  const registry = await getRegistry(pkg.publishConfig, pkg.name);
  await setNpmrcAuth(registry, logger);
  try {
    await execa('npm', ['whoami', '--registry', registry]);
  } catch (err) {
    throw new SemanticReleaseError('Invalid npm token.', 'EINVALIDNPMTOKEN');
  }
};
