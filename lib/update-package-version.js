const {readFile, writeFile, pathExists} = require('fs-extra');

module.exports = async (version, logger) => {
  const pkg = (await readFile('./package.json')).toString();

  await writeFile('./package.json', replaceVersion(pkg, version));
  logger.log('Wrote version %s to package.json', version);

  if (await pathExists('./npm-shrinkwrap.json')) {
    const shrinkwrap = (await readFile('./npm-shrinkwrap.json')).toString();
    await writeFile('./npm-shrinkwrap.json', replaceVersion(shrinkwrap, version));
    logger.log('Wrote version %s to npm-shrinkwrap.json', version);
  }
};

function replaceVersion(json, version) {
  return json.replace(/("version"\s*:\s*")\S+?(\s*")/, `$1${version}$2`);
}
