// Copied from https://github.com/npm/npm/blob/0cc9d89ed2d46745f91d746fda9d205fd39d3daa/lib/config/nerf-dart.js

const url = require('url');

module.exports = toNerfDart;

/**
 * Maps a URL to an identifier.
 *
 * Name courtesy schiffertronix media LLC, a New Jersey corporation
 *
 * @param {String} uri The URL to be nerfed.
 *
 * @returns {String} A nerfed URL.
 */
function toNerfDart(uri) {
  const parsed = url.parse(uri);
  delete parsed.protocol;
  delete parsed.auth;
  delete parsed.query;
  delete parsed.search;
  delete parsed.hash;

  return url.resolve(url.format(parsed), '.');
}
