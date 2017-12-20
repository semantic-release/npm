const readPkg = require('read-pkg');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = async pkgRoot => {
  try {
    const pkg = await readPkg(pkgRoot);
    if (!pkg.name) {
      throw new SemanticReleaseError('No "name" found in package.json.', 'ENOPKGNAME');
    }

    return pkg;
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new SemanticReleaseError('A package.json file is required to release on npm.', 'ENOPKG');
    }
    throw err;
  }
};
