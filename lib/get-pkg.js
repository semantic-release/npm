const path = require('path');
const {readPackageAsync} = require('read-pkg');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');

module.exports = async ({pkgRoot}, {cwd}) => {
  try {
    const pkg = await readPackageAsync({cwd: pkgRoot ? path.resolve(cwd, String(pkgRoot)) : cwd});

    if (!pkg.name) {
      throw getError('ENOPKGNAME');
    }

    return pkg;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AggregateError([getError('ENOPKG')]);
    }

    throw new AggregateError([error]);
  }
};
