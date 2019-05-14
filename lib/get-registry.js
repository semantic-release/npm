const path = require('path');
const rc = require('rc');
const getRegistryUrl = require('registry-auth-token/registry-url');

module.exports = (pluginConfig, {publishConfig: {registry} = {}, name}, {cwd}) => {
  if (pluginConfig.registry) {
    return pluginConfig.registry;
  }

  if (registry) {
    return registry;
  }

  return getRegistryUrl(
    name.split('/')[0],
    rc('npm', {registry: 'https://registry.npmjs.org/'}, {config: path.resolve(cwd, '.npmrc')})
  );
};
