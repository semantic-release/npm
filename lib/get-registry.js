const getRegistryUrl = require('registry-auth-token/registry-url');

module.exports = async ({registry} = {}, name) => (registry ? registry : getRegistryUrl(name.split('/')[0]));
