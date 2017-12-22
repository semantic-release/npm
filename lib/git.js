const execa = require('execa');
const debug = require('debug')('semantic-release:npm');

/**
 * Get the commit sha for a given tag.
 *
 * @param {string} tagName Tag name for which to retrieve the commit sha.
 *
 * @return {string} The commit sha of the tag in parameter or `null`.
 */
async function gitTagHead(tagName) {
  try {
    return await execa.stdout('git', ['rev-list', '-1', tagName]);
  } catch (err) {
    debug(err);
    return null;
  }
}

/**
 * Unshallow the git repository (retriving every commits and tags).
 */
async function unshallow() {
  await execa('git', ['fetch', '--unshallow', '--tags'], {reject: false});
}

module.exports = {gitTagHead, unshallow};
