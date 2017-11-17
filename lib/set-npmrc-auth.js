const {appendFile} = require('fs-extra');
const getAuthToken = require('registry-auth-token');
const nerfDart = require('nerf-dart');
const SemanticReleaseError = require('@semantic-release/error');
const getRegistry = require('./get-registry');

module.exports = async ({publishConfig, name}, logger) => {
  const registry = await getRegistry(publishConfig, name);
  logger.log('Verify authentication for registry %s', registry);
  const {NPM_TOKEN, NPM_USERNAME, NPM_PASSWORD, NPM_EMAIL} = process.env;

  if (getAuthToken(registry)) {
    return;
  }
  if (NPM_USERNAME && NPM_PASSWORD && NPM_EMAIL) {
    // Using the old auth token format is not considered part of the public API
    // This might go away anytime (i.e. once we have a better testing strategy)
    await appendFile(
      './.npmrc',
      `_auth = ${Buffer.from(`${NPM_USERNAME}:${NPM_PASSWORD}`, 'utf8').toString('base64')}\nemail = \${NPM_EMAIL}`
    );
    logger.log('Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to .npmrc.');
  } else if (NPM_TOKEN) {
    await appendFile('./.npmrc', `${nerfDart(registry)}:_authToken = \${NPM_TOKEN}`);
    logger.log('Wrote NPM_TOKEN to .npmrc.');
  } else {
    throw new SemanticReleaseError('No npm token specified.', 'ENONPMTOKEN');
  }
};
