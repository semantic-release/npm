const readPkg = require('read-pkg');
const AggregateError = require('aggregate-error');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = async pkgRoot => {
  const errors = [];
  let pkg;

  try {
    pkg = await readPkg(pkgRoot);

    if (!pkg.name) {
      errors.push(new SemanticReleaseError('No "name" found in package.json.', 'ENOPKGNAME'));
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      errors.push(new SemanticReleaseError('A package.json file is required to release on npm.', 'ENOPKG'));
    } else {
      errors.push(err);
    }
  }
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
  return pkg;
};
