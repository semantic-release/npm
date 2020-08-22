const {resolve} = require('path');
const isWindows = () => /^(msys|cygwin)$/.test(process.env.OSTYPE) || process.platform === 'win32';

module.exports = () => {
  const cmd = isWindows() ? 'npm.cmd' : 'npm';

  return resolve(require.resolve('npm'), '../../../.bin', cmd);
};
