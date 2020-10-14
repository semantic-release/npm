const {isString, isNil, isBoolean} = require('lodash');
const getError = require('./get-error');

const isNonEmptyString = (value) => isString(value) && value.trim();

const VALIDATORS = {
  npmPublish: isBoolean,
  tarballDir: isNonEmptyString,
  pkgRoot: isNonEmptyString,
  usesAutomationToken: isBoolean,
};

module.exports = ({npmPublish, tarballDir, pkgRoot, usesAutomationToken}) => {
  const errors = Object.entries({npmPublish, tarballDir, pkgRoot, usesAutomationToken}).reduce(
    (errors, [option, value]) =>
      !isNil(value) && !VALIDATORS[option](value)
        ? [...errors, getError(`EINVALID${option.toUpperCase()}`, {[option]: value})]
        : errors,
    []
  );

  return errors;
};
