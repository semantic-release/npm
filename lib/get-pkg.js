const path = require('path');
const readPkg = require('read-pkg');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');

module.exports = async ({pkgRoot}, {cwd}) => {
  const errors = [];
  let pkg;

  try {
    pkg = await readPkg({cwd: pkgRoot ? path.resolve(cwd, String(pkgRoot)) : cwd});

    if (!pkg.name) {
      errors.push(getError('ENOPKGNAME'));
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      errors.push(getError('ENOPKG'));
    } else {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  return pkg;
};
