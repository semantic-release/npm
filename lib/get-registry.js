const getRegistryUrl = require('registry-auth-token/registry-url');

module.exports = async (publishConfig, name) =>
  publishConfig && publishConfig.registry ? publishConfig.registry : getRegistryUrl(name.split('/')[0]);
