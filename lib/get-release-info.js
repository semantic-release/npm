const normalizeUrl = require('normalize-url');

module.exports = async ({name}, {env: {DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/'}}, distTag, registry) => ({
  name: `npm package (@${distTag} dist-tag)`,
  url:
    normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY) ? `https://www.npmjs.com/package/${name}` : undefined,
});
