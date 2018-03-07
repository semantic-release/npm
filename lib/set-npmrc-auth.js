const {appendFile} = require('fs-extra');
const getAuthToken = require('registry-auth-token');
const nerfDart = require('nerf-dart');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');

module.exports = async (registry, logger) => {
  logger.log('Verify authentication for registry %s', registry);
  const {NPM_TOKEN, NPM_USERNAME, NPM_PASSWORD, NPM_EMAIL} = process.env;

  if (getAuthToken(registry)) {
    return;
  }
  if (NPM_USERNAME && NPM_PASSWORD && NPM_EMAIL) {
    await appendFile('./.npmrc', `\n_auth = ${Buffer.from(`\${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`)}`);
    logger.log('Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to .npmrc.');
  } else if (NPM_TOKEN) {
    await appendFile('./.npmrc', `\n${nerfDart(registry)}:_authToken = \${NPM_TOKEN}`);
    logger.log('Wrote NPM_TOKEN to .npmrc.');
  } else {
    throw new AggregateError([getError('ENONPMTOKEN', {registry})]);
  }
};
