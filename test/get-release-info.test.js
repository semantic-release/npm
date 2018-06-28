import test from 'ava';
import getReleaseInfo from '../lib/get-release-info';

test('Default registry and scoped module', async t => {
  t.deepEqual(await getReleaseInfo({name: '@scope/module'}, {env: {}}, 'latest', 'https://registry.npmjs.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: 'https://www.npmjs.com/package/@scope/module',
  });
});

test('Custom registry and scoped module', async t => {
  t.deepEqual(await getReleaseInfo({name: '@scope/module'}, {env: {}}, 'latest', 'https://custom.registry.org/'), {
    name: 'npm package (@latest dist-tag)',
    url: undefined,
  });
});
