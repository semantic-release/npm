const {isString, isUndefined, isBoolean} = require('lodash');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = async ({npmPublish, tarballDir, pkgRoot}) => {
  if (!isUndefined(npmPublish) && !isBoolean(npmPublish)) {
    throw new SemanticReleaseError('The "npmPublish" options, if defined, must be a Boolean.', 'EINVALIDNPMPUBLISH');
  }

  if (!isUndefined(tarballDir) && !isString(tarballDir)) {
    throw new SemanticReleaseError('The "tarballDir" options, if defined, must be a String.', 'EINVALIDTARBALLDIR');
  }

  if (!isUndefined(pkgRoot) && !isString(pkgRoot)) {
    throw new SemanticReleaseError('The "pkgRoot" options, if defined, must be a String.', 'EINVALIDPKGROOT');
  }
};
