const readPkg = require('read-pkg');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');

module.exports = async pkgRoot => {
  const errors = [];
  let pkg;

  try {
    pkg = await readPkg({cwd: pkgRoot ? String(pkgRoot) : process.cwd()});

    if (!pkg.name) {
      errors.push(getError('ENOPKGNAME'));
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      errors.push(getError('ENOPKG'));
    } else {
      errors.push(err);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  return pkg;
};
