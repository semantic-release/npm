const path = require('path');
const parseJson = require('parse-json');
const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline');
const {readFile, writeJson, pathExists} = require('fs-extra');

const DEFAULT_INDENT = 2;
const DEFAULT_NEWLINE = '\n';

module.exports = async (version, basePath, logger) => {
  const packagePath = path.join(basePath, 'package.json');
  const shrinkwrapPath = path.join(basePath, 'npm-shrinkwrap.json');
  const packageLockPath = path.join(basePath, 'package-lock.json');
  const pkg = await readFile(packagePath, 'utf8');

  await writeJson(packagePath, {...parseJson(pkg), ...{version}}, getWriteOptions(pkg));
  logger.log('Wrote version %s to %s', version, packagePath);

  if (await pathExists(shrinkwrapPath)) {
    const shrinkwrap = await readFile(shrinkwrapPath, 'utf8');
    await writeJson(shrinkwrapPath, {...parseJson(shrinkwrap), ...{version}}, getWriteOptions(shrinkwrap));
    logger.log('Wrote version %s to %s', version, shrinkwrapPath);
  }

  if (await pathExists(packageLockPath)) {
    const packageLock = await readFile(packageLockPath, 'utf8');
    await writeJson(packageLockPath, {...parseJson(packageLock), ...{version}}, getWriteOptions(packageLock));
    logger.log('Wrote version %s to %s', version, packageLockPath);
  }
};

function getWriteOptions(content) {
  return {spaces: detectIndent(content).indent || DEFAULT_INDENT, EOL: detectNewline(content) || DEFAULT_NEWLINE};
}
