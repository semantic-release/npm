const {isString, isUndefined, isBoolean} = require('lodash');
const getError = require('./get-error');

module.exports = ({npmPublish, tarballDir, pkgRoot}) => {
  const errors = [];
  if (!isUndefined(npmPublish) && !isBoolean(npmPublish)) {
    errors.push(getError('EINVALIDNPMPUBLISH', {npmPublish}));
  }

  if (!isUndefined(tarballDir) && !isString(tarballDir)) {
    errors.push(getError('EINVALIDTARBALLDIR', {tarballDir}));
  }

  if (!isUndefined(pkgRoot) && !isString(pkgRoot)) {
    errors.push(getError('EINVALIDPKGROOT', {pkgRoot}));
  }

  return errors;
};
