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

export function mock(packageName, matchHeader, basicAuth) {
  let req = nock(REGISTRY_URL);
  if (matchHeader) {
    req = req.matchHeader.apply(req, matchHeader);
  }
  req = req.get(`/${packageName.replace('/', '%2F')}`);
  if (basicAuth) {
    req = req.basicAuth(basicAuth);
  }
  return req;
}

export function available(packageName, matchHeader, basicAuth) {
  return mock(packageName, matchHeader, basicAuth).reply(200, availableModule);
}

export function unpublished(packageName, matchHeader, basicAuth) {
  return mock(packageName, matchHeader, basicAuth).reply(200, unpublishedModule);
}
