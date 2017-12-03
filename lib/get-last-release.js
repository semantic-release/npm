const {promisify} = require('util');
const {resolve: urlResolve} = require('url');
const npmConf = require('npm-conf');
const RegClient = require('npm-registry-client');
const getClientConfig = require('./get-client-config');
const getRegistry = require('./get-registry');
const toNerfDart = require('./nerf-dart');

function getAlwaysAuth(registry, config) {
  const nerfed = toNerfDart(registry);
  const registryAuth = config.get(`${nerfed}:always-auth`);

  if (registryAuth !== undefined) {
    return registryAuth;
  }

  return config.get('always-auth');
}

module.exports = async ({publishConfig, name}, logger) => {
  const config = npmConf();
  const tag = (publishConfig || {}).tag || config.get('tag');
  const {NPM_TOKEN, NPM_USERNAME, NPM_PASSWORD, NPM_EMAIL} = process.env;
  const client = new RegClient(getClientConfig(config));
  const registry = await getRegistry(publishConfig, name);

  try {
    const uri = urlResolve(registry, name.replace('/', '%2F'));
    const auth = NPM_TOKEN ? {token: NPM_TOKEN} : {username: NPM_USERNAME, password: NPM_PASSWORD, email: NPM_EMAIL};
    auth.alwaysAuth = getAlwaysAuth(registry, config);
    const data = await promisify(client.get.bind(client))(uri, {auth});
    if (data && !data['dist-tags']) {
      logger.log('No version found of package %s found on %s', name, registry);
      return;
    }
    const distTags = data['dist-tags'];
    let version;
    if (distTags[tag]) {
      version = distTags[tag];
      logger.log('Found version %s of package %s with dist-tag %s', version, name, tag);
    } else {
      version = distTags.latest;
      logger.log('Found version %s of package %s with dist-tag %s', version, name, 'latest');
    }
    return {version, gitHead: data.versions[version].gitHead};
  } catch (err) {
    if (err.statusCode === 404 || /not found/i.test(err.message)) {
      logger.log('No version found of package %s found on %s', name, registry);
      return;
    }
    throw err;
  }
};
