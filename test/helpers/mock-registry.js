import nock from 'nock';

const REGISTRY_URL = 'http://registry.npmjs.org/';
const availableModule = {
  'dist-tags': {latest: '1.33.7', foo: '0.8.15'},
  versions: {'0.8.15': {gitHead: 'bar'}, '1.33.7': {gitHead: 'HEAD'}},
};
const unpublishedModule = {
  name: 'i-am-completely-unpublished',
  time: {'2.0.0': '2016-12-01T17:50:30.699Z', unpublished: {time: '2016-12-01T17:53:45.940Z'}},
};

export const registry = REGISTRY_URL;

export function mock(packageName) {
  return nock(REGISTRY_URL).get(`/${packageName.replace('/', '%2F')}`);
}

export function available(packageName) {
  return mock(packageName).reply(200, availableModule);
}

export function unpublished(packageName) {
  return mock(packageName).reply(200, unpublishedModule);
}
