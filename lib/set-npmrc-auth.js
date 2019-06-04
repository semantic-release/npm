const path = require('path');
const rc = require('rc');
const {appendFile} = require('fs-extra');
const getAuthToken = require('registry-auth-token');
const nerfDart = require('nerf-dart');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');

module.exports = async (
  registry,
  {cwd, env: {NPM_TOKEN, NPM_CONFIG_USERCONFIG, NPM_USERNAME, NPM_PASSWORD, NPM_EMAIL, GITHUB_TOKEN}, logger}
) => {
  logger.log('Verify authentication for registry %s', registry);
  const config = NPM_CONFIG_USERCONFIG || path.resolve(cwd, '.npmrc');

  console.log(
    `-------- getAuthToken(registry, {npmrc: rc('npm', {registry: 'https://registry.npmjs.org/'}, {config})}) -------- `
  );
  console.log(Boolean(getAuthToken(registry, {npmrc: rc('npm', {registry: 'https://registry.npmjs.org/'}, {config})})));

  if (getAuthToken(registry, {npmrc: rc('npm', {registry: 'https://registry.npmjs.org/'}, {config})})) {
    return;
  }

  console.log(`-------- GITHUB_TOKEN? -------- `);
  console.log(Boolean(GITHUB_TOKEN));
  console.log(`-------- registry -------- `);
  console.log(registry);

  if (NPM_USERNAME && NPM_PASSWORD && NPM_EMAIL) {
    await appendFile(config, `\n_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`);
    logger.log(`Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to ${config}`);
  } else if (NPM_TOKEN) {
    await appendFile(config, `\n${nerfDart(registry)}:_authToken = \${NPM_TOKEN}`);
    logger.log(`Wrote NPM_TOKEN to ${config}`);
  } else if (GITHUB_TOKEN && registry === 'https://npm.pkg.github.com/') {
    await appendFile(config, `\n${nerfDart(registry)}:_authToken = \${GITHUB_TOKEN}`);
    logger.log(`Wrote GITHUB_TOKEN to ${config}`);
  } else {
    throw new AggregateError([getError('ENONPMTOKEN', {registry})]);
  }
};
