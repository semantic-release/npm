const path = require('path');
const {readJson, writeJson, pathExists} = require('fs-extra');

module.exports = async (version, basePath, logger) => {
  const packagePath = path.join(basePath, 'package.json');
  const shrinkwrapPath = path.join(basePath, 'npm-shrinkwrap.json');
  const packageLockPath = path.join(basePath, 'package-lock.json');
  const pkg = await readJson(packagePath);

  await writeJson(packagePath, {...pkg, ...{version}}, {spaces: 2});
  logger.log('Wrote version %s to %s', version, packagePath);

  if (await pathExists(shrinkwrapPath)) {
    const shrinkwrap = await readJson(shrinkwrapPath);
    await writeJson(shrinkwrapPath, {...shrinkwrap, ...{version}}, {spaces: 2});
    logger.log('Wrote version %s to %s', version, shrinkwrapPath);
  }

  if (await pathExists(packageLockPath)) {
    const packageLock = await readJson(packageLockPath);
    await writeJson(packageLockPath, {...packageLock, ...{version}}, {spaces: 2});
    logger.log('Wrote version %s to %s', version, packageLockPath);
  }
};
