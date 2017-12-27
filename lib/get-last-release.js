const {promisify} = require('util');
const {resolve: urlResolve} = require('url');
const npmConf = require('npm-conf');
const RegClient = require('npm-registry-client');
const SemanticReleaseError = require('@semantic-release/error');
const getClientConfig = require('./get-client-config');
const getRegistry = require('./get-registry');
const getVersionHead = require('./get-version-head');

module.exports = async ({publishConfig, name}, branch, logger) => {
  const config = npmConf();
  const tag = (publishConfig || {}).tag || config.get('tag');
  const {NPM_TOKEN, NPM_USERNAME, NPM_PASSWORD, NPM_EMAIL} = process.env;
  const client = new RegClient(getClientConfig(config));
  const registry = await getRegistry(publishConfig, name);

  try {
    const uri = urlResolve(registry, name.replace('/', '%2F'));
    const auth = NPM_TOKEN ? {token: NPM_TOKEN} : {username: NPM_USERNAME, password: NPM_PASSWORD, email: NPM_EMAIL};
    auth.alwaysAuth = config.get('always-auth');
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
    // Due to npm/read-package-json#77 the gitHead is missing for some packages
    // In such case attempt to retrieve the gitHead based on a git tag named after the version
    const gitHead = data.versions[version].gitHead || (await getVersionHead(version));
    if (version && !gitHead) {
      logger.log(`The commit the last release of this package was derived from cannot be determined from the release metadata nor from the repository tags.
This means semantic-release can not extract the commits between now and then.
This is usually caused by releasing from outside the repository directory or with innaccessible git metadata.

You can recover from this error by creating a tag for the version "${version}" on the commit corresponding to this release:
$ git tag -f v${version} <commit sha1 corresponding to last release>
$ git push -f --tags origin ${branch}
`);
      throw new SemanticReleaseError('There is no commit associated with last release', 'ENOGITHEAD');
    }
    return {version, gitHead: data.versions[version].gitHead || (await getVersionHead(version))};
  } catch (err) {
    if (err.statusCode === 404 || /not found/i.test(err.message)) {
      logger.log('No version found of package %s found on %s', name, registry);
      return;
    }
    throw err;
  }
};
