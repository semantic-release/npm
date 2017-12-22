const debug = require('debug')('semantic-release:npm');
const {gitTagHead, unshallow} = require('./git');

module.exports = async version => {
  let tagHead = (await gitTagHead(`v${version}`)) || (await gitTagHead(version));

  // Check if tagHead is found
  if (tagHead) {
    debug('Use tagHead: %s', tagHead);
    return tagHead;
  }
  await unshallow();

  // Check if tagHead is found
  tagHead = (await gitTagHead(`v${version}`)) || (await gitTagHead(version));
  if (tagHead) {
    debug('Use tagHead: %s', tagHead);
    return tagHead;
  }
};
