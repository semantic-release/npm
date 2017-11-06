const SemanticReleaseError = require('@semantic-release/error');

module.exports = ({name}) => {
  if (!name) {
    throw new SemanticReleaseError('No "name" found in package.json.', 'ENOPKGNAME');
  }
};
