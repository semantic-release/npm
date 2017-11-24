const getPkg = require('./lib/get-pkg');
const verifyNpm = require('./lib/verify');
const publishNpm = require('./lib/publish');
const getLastReleaseNpm = require('./lib/get-last-release');

let verified;

async function verifyConditions(pluginConfig, {logger}) {
  const pkg = await getPkg();
  await verifyNpm(pkg, logger);
  verified = true;
}

async function getLastRelease(pluginConfig, {logger}) {
  // Reload package.json in case a previous external step updated it
  const pkg = await getPkg();
  if (!verified) {
    await verifyNpm(pkg, logger);
    verified = true;
  }
  return getLastReleaseNpm(pkg, logger);
}

async function publish(pluginConfig, {nextRelease: {version}, logger}) {
  // Reload package.json in case a previous external step updated it
  const pkg = await getPkg();
  if (!verified) {
    await verifyNpm(pkg, logger);
    verified = true;
  }
  await publishNpm(version, logger);
}

module.exports = {verifyConditions, getLastRelease, publish};
