const readPkgUp = require('read-pkg-up');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = async () => {
  const {pkg} = await readPkgUp();

  if (!pkg) {
    throw new SemanticReleaseError('A package.json file is required to release on npm.', 'ENOPKG');
  }

  if (!pkg.name) {
    throw new SemanticReleaseError('No "name" found in package.json.', 'ENOPKGNAME');
  }

  return pkg;
};
