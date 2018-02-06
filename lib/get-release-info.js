const execa = require('execa');
const normalizeUrl = require('normalize-url');

const DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/';

module.exports = async (
  name,
  publishConfig,
  registry,
  defaultRegistry = process.env.DEFAULT_NPM_REGISTRY || DEFAULT_NPM_REGISTRY
) => {
  const distTag =
    (publishConfig && publishConfig.tag) || (await execa.stdout('npm', ['config', 'get', 'tag'])) || 'latest';

  return {
    name: `npm package (@${distTag} dist-tag)`,
    url: normalizeUrl(registry) === normalizeUrl(defaultRegistry) ? `https://www.npmjs.com/package/${name}` : undefined,
  };
};
