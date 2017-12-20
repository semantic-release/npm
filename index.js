const {castArray} = require('lodash');
const setLegacyToken = require('./lib/set-legacy-token');
const getPkg = require('./lib/get-pkg');
const verifyNpm = require('./lib/verify');
const publishNpm = require('./lib/publish');
const getLastReleaseNpm = require('./lib/get-last-release');

let verified;

async function verifyConditions(pluginConfig, {options, logger}) {
  // If the npm publish plugin is used and has `npmPublish`, `tarballDir` or `pkgRoot` configured, validate them now in order to prevent any release if the configuration is wrong
  if (options.publish) {
    const publishPlugin = castArray(options.publish).find(
      config => config.path && config.path === '@semantic-release/npm'
    );
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
  setLegacyToken();
  const pkg = await getPkg(pluginConfig.pkgRoot);
  await verifyNpm(pluginConfig, pkg, logger);
  verified = true;
}

async function getLastRelease(pluginConfig, {options, logger}) {
  setLegacyToken();
  // Reload package.json in case a previous external step updated it
  const pkg = await getPkg(pluginConfig.pkgRoot);
  if (!verified) {
    if (options.publish) {
      const publishPlugin = castArray(options.publish).find(
        config => config.path && config.path === '@semantic-release/npm'
      );
      if (publishPlugin && publishPlugin.pkgRoot) {
        pluginConfig.pkgRoot = publishPlugin.pkgRoot;
      }
    }
    await verifyNpm(pluginConfig, pkg, logger);
    verified = true;
  }
  return getLastReleaseNpm(pkg, logger);
}

async function publish(pluginConfig, {nextRelease: {version}, logger}) {
  setLegacyToken();
  // Reload package.json in case a previous external step updated it
  const pkg = await getPkg(pluginConfig.pkgRoot);
  if (!verified) {
    await verifyNpm(pluginConfig, pkg, logger);
    verified = true;
  }
  await publishNpm(pluginConfig, pkg, version, logger);
}

module.exports = {verifyConditions, getLastRelease, publish};
