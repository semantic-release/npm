const path = require('path');
const rc = require('rc');
const {outputFile, copy, readFile} = require('fs-extra');
const getAuthToken = require('registry-auth-token');
const nerfDart = require('nerf-dart');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');

const readFileIfExists = async path => {
  try {
    return await readFile(path);
  } catch (_) {
    return '';
  }
};

module.exports = async (
  npmrc,
  registry,
  {cwd, env: {NPM_TOKEN, NPM_CONFIG_USERCONFIG, NPM_USERNAME, NPM_PASSWORD, NPM_EMAIL}, logger}
) => {
  logger.log('Verify authentication for registry %s', registry);
  const config = NPM_CONFIG_USERCONFIG || path.resolve(cwd, '.npmrc');
  if (getAuthToken(registry, {npmrc: rc('npm', {registry: 'https://registry.npmjs.org/'}, {config})})) {
    await copy(config, npmrc);
    return;
  }

  if (NPM_USERNAME && NPM_PASSWORD && NPM_EMAIL) {
    await outputFile(npmrc, `${await readFileIfExists(config)}\n_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`);
    logger.log(`Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to ${npmrc}`);
  } else if (NPM_TOKEN) {
    await outputFile(npmrc, `${await readFileIfExists(config)}\n${nerfDart(registry)}:_authToken = \${NPM_TOKEN}`);
    logger.log(`Wrote NPM_TOKEN to ${npmrc}`);
  } else {
    throw new AggregateError([getError('ENONPMTOKEN', {registry})]);
  }
};
