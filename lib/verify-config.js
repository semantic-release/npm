const {isString, isUndefined, isBoolean} = require('lodash');
const getError = require('./get-error');

const isNonEmptyString = value => isString(value) && value.trim();

const VALIDATORS = {
  npmPublish: isBoolean,
  tarballDir: isNonEmptyString,
  pkgRoot: isNonEmptyString,
};

module.exports = options => {
  const errors = Object.entries(options).reduce(
    (errors, [option, value]) =>
      !isUndefined(value) && value !== false && !VALIDATORS[option](value)
        ? [...errors, getError(`EINVALID${option.toUpperCase()}`, {[option]: value})]
        : errors,
    []
  );

  return errors;
};
