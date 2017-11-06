import test from 'ava';
import SemanticReleaseError from '@semantic-release/error';
import verify from '../lib/verify-pkg';

test('Verify name and repository', t => {
  t.notThrows(() => verify({name: 'package'}));
});

test('Return error for missing package name', t => {
  const error = t.throws(() => verify({repository: {url: 'http://github.com/whats/up.git'}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'ENOPKGNAME');
});
