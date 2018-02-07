const {castArray} = require('lodash');
const AggregateError = require('aggregate-error');
const setLegacyToken = require('./lib/set-legacy-token');
const getPkg = require('./lib/get-pkg');
const verifyNpmConfig = require('./lib/verify-config');
const verifyNpmAuth = require('./lib/verify-auth');
const publishNpm = require('./lib/publish');

let verified;

async function verifyConditions(pluginConfig, {options: {publish}, logger}) {
  // If the npm publish plugin is used and has `npmPublish`, `tarballDir` or `pkgRoot` configured, validate them now in order to prevent any release if the configuration is wrong
  if (publish) {
    const publishPlugin =
      castArray(publish).find(config => config.path && config.path === '@semantic-release/npm') || {};

    pluginConfig.npmPublish = pluginConfig.npmPublish || publishPlugin.npmPublish;
    pluginConfig.tarballDir = pluginConfig.tarballDir || publishPlugin.tarballDir;
    pluginConfig.pkgRoot = pluginConfig.pkgRoot || publishPlugin.pkgRoot;
  }

  const errors = verifyNpmConfig(pluginConfig);

  try {
    const pkg = await getPkg(pluginConfig.pkgRoot);

    // Verify the npm authentication only if `npmPublish` is not false
    if (pluginConfig.npmPublish !== false) {
      setLegacyToken();
      await verifyNpmAuth(pluginConfig, pkg, logger);
    }
  } catch (err) {
    errors.push(...err);
  }
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
  verified = true;
}

async function publish(pluginConfig, {nextRelease: {version}, logger}) {
  let pkg;
  const errors = verifyNpmConfig(pluginConfig);

  setLegacyToken();

  try {
    // Reload package.json in case a previous external step updated it
    pkg = await getPkg(pluginConfig.pkgRoot);
    if (!verified && pluginConfig.npmPublish !== false) {
      await verifyNpmAuth(pluginConfig, pkg, logger);
    }
  } catch (err) {
    errors.push(...err);
  }
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
  return publishNpm(pluginConfig, pkg, version, logger);
}

module.exports = {verifyConditions, publish};
