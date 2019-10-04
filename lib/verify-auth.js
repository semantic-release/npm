const execa = require('execa');
const normalizeUrl = require('normalize-url');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');
const getRegistry = require('./get-registry');
const setNpmrcAuth = require('./set-npmrc-auth');

module.exports = async (npmrc, pkg, context) => {
  const {
    cwd,
    env: {DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/', ...env},
  } = context;
  const registry = getRegistry(pkg, context);

  await setNpmrcAuth(npmrc, registry, context);

  if (normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY)) {
    try {
      await execa('npm', ['whoami', '--userconfig', npmrc, '--registry', registry], {cwd, env});
    } catch (_) {
      throw new AggregateError([getError('EINVALIDNPMTOKEN', {registry})]);
    }
  }
};
