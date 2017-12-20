const path = require('path');
const {readFile, writeFile, pathExists} = require('fs-extra');

module.exports = async (version, basePath, logger) => {
  const packagePath = path.join(basePath, 'package.json');
  const shrinkwrapPath = path.join(basePath, 'npm-shrinkwrap.json');
  const pkg = (await readFile(packagePath)).toString();

  await writeFile(packagePath, replaceVersion(pkg, version));
  logger.log('Wrote version %s to %s', version, packagePath);

  if (await pathExists(shrinkwrapPath)) {
    const shrinkwrap = (await readFile(shrinkwrapPath)).toString();
    await writeFile(shrinkwrapPath, replaceVersion(shrinkwrap, version));
    logger.log('Wrote version %s to %s', version, shrinkwrapPath);
  }
};

function replaceVersion(json, version) {
  return json.replace(/("version"\s*:\s*")\S+?(\s*")/, `$1${version}$2`);
}
