const verifyNpm = require('./lib/verify');
const publishNpm = require('./lib/publish');
const getLastReleaseNpm = require('./lib/get-last-release');

let verified;

async function verifyConditions(pluginConfig, {pkg, logger}) {
  await verifyNpm(pkg, logger);
  verified = true;
}

async function getLastRelease(pluginConfig, {pkg, logger}) {
  if (!verified) {
    await verifyNpm(pkg, logger);
    verified = true;
  }
  return getLastReleaseNpm(pkg, logger);
}

async function publish(pluginConfig, {pkg, nextRelease: {version}, logger}) {
  if (!verified) {
    await verifyNpm(pkg, logger);
    verified = true;
  }
  await publishNpm(version, logger);
}

module.exports = {verifyConditions, getLastRelease, publish};
