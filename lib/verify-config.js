const {isString, isUndefined, isBoolean} = require('lodash');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = ({npmPublish, tarballDir, pkgRoot}) => {
  const errors = [];
  if (!isUndefined(npmPublish) && !isBoolean(npmPublish)) {
    errors.push(
      new SemanticReleaseError('The "npmPublish" options, if defined, must be a Boolean.', 'EINVALIDNPMPUBLISH')
    );
  }

  if (!isUndefined(tarballDir) && !isString(tarballDir)) {
    errors.push(
      new SemanticReleaseError('The "tarballDir" options, if defined, must be a String.', 'EINVALIDTARBALLDIR')
    );
  }

  if (!isUndefined(pkgRoot) && !isString(pkgRoot)) {
    errors.push(new SemanticReleaseError('The "pkgRoot" options, if defined, must be a String.', 'EINVALIDPKGROOT'));
  }
  return errors;
};
