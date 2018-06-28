const execa = require('execa');
const getRegistry = require('./get-registry');
const getChannel = require('./get-channel');
const getReleaseInfo = require('./get-release-info');

module.exports = async ({npmPublish}, pkg, context) => {
  const {
    cwd,
    env,
    stdout,
    stderr,
    nextRelease: {version, channel},
    logger,
  } = context;

  if (npmPublish !== false && pkg.private !== true) {
    const registry = getRegistry(pkg, context);
    const distTag = getChannel(channel);

    logger.log(`Adding version ${version} to npm registry on dist-tag ${distTag}`);
    const result = execa('npm', ['dist-tag', 'add', `${pkg.name}@${version}`, distTag, '--registry', registry], {
      cwd,
      env,
    });
    result.stdout.pipe(
      stdout,
      {end: false}
    );
    result.stderr.pipe(
      stderr,
      {end: false}
    );
    await result;

    logger.log(`Published ${pkg.name}@${version} on ${registry}`);

    return getReleaseInfo(pkg, context, distTag, registry);
  }

  logger.log(
    `Skip adding to npm channel as ${
      npmPublish === false ? 'npmPublish' : "package.json's private property"
    } is ${npmPublish !== false}`
  );
};
