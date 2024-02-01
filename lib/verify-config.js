import { isBoolean, isNil, isString } from "lodash-es";
import getError from "./get-error.js";

const isNonEmptyString = (value) => isString(value) && value.trim();
const isPackageManager = (value) => value === 'npm' || value === 'pnpm';

const VALIDATORS = {
  npmPublish: isBoolean,
  tarballDir: isNonEmptyString,
  pkgRoot: isNonEmptyString,
  packageManager: isPackageManager,
};

export default function ({ npmPublish, tarballDir, pkgRoot, packageManager }) {
  const errors = Object.entries({ npmPublish, tarballDir, pkgRoot, packageManager }).reduce(
    (errors, [option, value]) =>
      !isNil(value) && !VALIDATORS[option](value)
        ? [...errors, getError(`EINVALID${option.toUpperCase()}`, { [option]: value })]
        : errors,
    []
  );

  return errors;
}
