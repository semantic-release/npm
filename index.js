const {defaultTo, castArray} = require('lodash');
const AggregateError = require('aggregate-error');
const tempy = require('tempy');
const setLegacyToken = require('./lib/set-legacy-token');
const getPkg = require('./lib/get-pkg');
const verifyNpmConfig = require('./lib/verify-config');
const verifyNpmAuth = require('./lib/verify-auth');
const addChannelNpm = require('./lib/add-channel');
const prepareNpm = require('./lib/prepare');
const publishNpm = require('./lib/publish');
const transformPluginConfig = require('./lib/transform-plugin-config');

let verified;
let prepared;
const npmrc = tempy.file({name: '.npmrc'});

function verifyPackagesNpmConfig(packages) {
  return packages.reduce((array, config) => [...array, ...verifyNpmConfig(config)], []);
}

function verifyPackagesNpmAuth(packages, context) {
  return Promise.all(
    packages.map(async (config) => {
      const pkg = await getPkg(config, context);

      // Verify the npm authentication only if `npmPublish` is not false and `pkg.private` is not `true`
      if (!verified && config.npmPublish !== false && pkg.private !== true) {
        await verifyNpmAuth(npmrc, pkg, context);
      }
    })
  );
}

async function verifyConditions(pluginConfig, context) {
  // If the npm publish plugin is used and has `npmPublish`, `tarballDir` or `pkgRoot` configured, validate them now in order to prevent any release if the configuration is wrong
  if (context.options.publish) {
    const publishPlugin =
      castArray(context.options.publish).find(
        (config) => config.path && config.path === 'semantic-release-multi-npm'
      ) || {};

    pluginConfig.npmPublish = defaultTo(pluginConfig.npmPublish, publishPlugin.npmPublish);
    pluginConfig.tarballDir = defaultTo(pluginConfig.tarballDir, publishPlugin.tarballDir);
    pluginConfig.pkgRoot = defaultTo(pluginConfig.pkgRoot, publishPlugin.pkgRoot);
  }

  const publishPackages = transformPluginConfig(pluginConfig);

  const errors = verifyPackagesNpmConfig(publishPackages);

  setLegacyToken(context);

  try {
    await verifyPackagesNpmAuth(publishPackages, context);
  } catch (error) {
    errors.push(...error);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  verified = true;
}

async function prepare(pluginConfig, context) {
  const publishPackages = transformPluginConfig(pluginConfig);

  const errors = verified ? [] : verifyPackagesNpmConfig(publishPackages);

  setLegacyToken(context);

  try {
    // Reload package.json in case a previous external step updated it
    await verifyPackagesNpmAuth(publishPackages, context);
  } catch (error) {
    errors.push(...error);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  await Promise.all(
    publishPackages.map(async (config) => {
      await prepareNpm(npmrc, config, context);
    })
  );
  prepared = true;
}

async function publish(pluginConfig, context) {
  const publishPackages = transformPluginConfig(pluginConfig);

  const errors = verified ? [] : verifyPackagesNpmConfig(publishPackages);

  setLegacyToken(context);

  try {
    // Reload package.json in case a previous external step updated it
    await verifyPackagesNpmAuth(publishPackages, context);
  } catch (error) {
    errors.push(...error);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  if (!prepared) {
    await Promise.all(
      publishPackages.map(async (config) => {
        await prepareNpm(npmrc, config, context);
      })
    );
  }

  return Promise.all(
    publishPackages.map(async (config) => {
      const pkg = await getPkg(config, context);
      await publishNpm(npmrc, config, pkg, context);
    })
  );
}

async function addChannel(pluginConfig, context) {
  const publishPackages = transformPluginConfig(pluginConfig);

  const errors = verified ? [] : verifyPackagesNpmConfig(publishPackages);

  setLegacyToken(context);

  try {
    // Reload package.json in case a previous external step updated it
    await verifyPackagesNpmAuth(publishPackages, context);
  } catch (error) {
    errors.push(...error);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  return Promise.all(
    publishPackages.map(async (config) => {
      const pkg = await getPkg(config, context);

      await addChannelNpm(npmrc, config, pkg, context);
    })
  );
}

module.exports = {verifyConditions, prepare, publish, addChannel};
