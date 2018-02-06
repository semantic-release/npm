const {castArray} = require('lodash');
const setLegacyToken = require('./lib/set-legacy-token');
const getPkg = require('./lib/get-pkg');
const verifyNpmConfig = require('./lib/verify-config');
const verifyNpmAuth = require('./lib/verify-auth');
const publishNpm = require('./lib/publish');

let verified;

async function verifyConditions(pluginConfig, {options: {publish}, logger}) {
  // If the npm publish plugin is used and has `npmPublish`, `tarballDir` or `pkgRoot` configured, validate them now in order to prevent any release if the configuration is wrong
  if (publish) {
    const publishPlugin = castArray(publish).find(config => config.path && config.path === '@semantic-release/npm');
    if (publishPlugin && publishPlugin.npmPublish) {
      pluginConfig.npmPublish = publishPlugin.npmPublish;
    }
    if (publishPlugin && publishPlugin.tarballDir) {
      pluginConfig.tarballDir = publishPlugin.tarballDir;
    }
    if (publishPlugin && publishPlugin.pkgRoot) {
      pluginConfig.pkgRoot = publishPlugin.pkgRoot;
    }
  }

  const pkg = await getPkg(pluginConfig.pkgRoot);
  await verifyNpmConfig(pluginConfig, pkg, logger);

  // Verify the npm authentication only if `npmPublish` is not false
  if (pluginConfig.npmPublish !== false) {
    setLegacyToken();
    await verifyNpmAuth(pluginConfig, pkg, logger);
  }
  verified = true;
}

async function publish(pluginConfig, {nextRelease: {version}, logger}) {
  setLegacyToken();
  // Reload package.json in case a previous external step updated it
  const pkg = await getPkg(pluginConfig.pkgRoot);
  if (!verified) {
    await verifyNpmConfig(pluginConfig, pkg, logger);
    if (pluginConfig.npmPublish !== false) {
      await verifyNpmAuth(pluginConfig, pkg, logger);
    }
    verified = true;
  }
  return publishNpm(pluginConfig, pkg, version, logger);
}

module.exports = {verifyConditions, publish};
