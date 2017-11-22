import Docker from 'dockerode';
import getStream from 'get-stream';
import got from 'got';
import delay from 'delay';

const SERVER_PORT = 5984;
const SERVER_HOST = 'localhost';
const NPM_USERNAME = 'integration';
const NPM_PASSWORD = 'suchsecure';
const NPM_EMAIL = 'integration@test.com';
const docker = new Docker();
let container;

async function start() {
  await getStream(await docker.pull('npmjs/npm-docker-couchdb:1.6.1'));

  container = await docker.createContainer({
    Image: 'npmjs/npm-docker-couchdb:1.6.1',
    PortBindings: {[`${SERVER_PORT}/tcp`]: [{HostPort: `${SERVER_PORT}`}]},
  });

  await container.start();
  // Add a delay as the registry take some time to be ready even if the docker container is started
  await delay(5000);

  // Create user
  await got(`http://${SERVER_HOST}:${SERVER_PORT}/_users/org.couchdb.user:${NPM_USERNAME}`, {
    json: true,
    auth: 'admin:admin',
    method: 'PUT',
    body: {
      _id: `org.couchdb.user:${NPM_USERNAME}`,
      name: NPM_USERNAME,
      roles: [],
      type: 'user',
      password: NPM_PASSWORD,
      email: NPM_EMAIL,
    },
  });
}

const url = `http://${SERVER_HOST}:${SERVER_PORT}/registry/_design/app/_rewrite/`;

const authEnv = {
  npm_config_registry: url, // eslint-disable-line camelcase
  NPM_USERNAME,
  NPM_PASSWORD,
  NPM_EMAIL,
};

async function stop() {
  return container.stop();
}

export default {start, stop, authEnv, url};
