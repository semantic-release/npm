const execa = require('execa');
const normalizeUrl = require('normalize-url');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');
const getRegistry = require('./get-registry');
const setNpmrcAuth = require('./set-npmrc-auth');

const DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/';

module.exports = async (
  pluginConfig,
  {publishConfig, name},
  {logger},
  defaultRegistry = process.env.DEFAULT_NPM_REGISTRY || DEFAULT_NPM_REGISTRY
) => {
  const registry = await getRegistry(publishConfig, name);
  await setNpmrcAuth(registry, logger);

  if (normalizeUrl(registry) === normalizeUrl(defaultRegistry)) {
    try {
      await execa('npm', ['whoami', '--registry', registry]);
    } catch (err) {
      throw new AggregateError([getError('EINVALIDNPMTOKEN', {registry})]);
    }
  }
};
