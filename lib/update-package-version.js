const {readJson, writeJson, pathExists} = require('fs-extra');

module.exports = async (version, logger) => {
  const pkg = await readJson('./package.json');

  await writeJson('./package.json', Object.assign(pkg, {version}));
  logger.log('Wrote version %s to package.json', version);

  if (await pathExists('./npm-shrinkwrap.json')) {
    const shrinkwrap = await readJson('./npm-shrinkwrap.json');
    shrinkwrap.version = version;
    await writeJson('./npm-shrinkwrap.json', shrinkwrap);
    logger.log('Wrote version %s to npm-shrinkwrap.json', version);
  }
};
