import test from 'ava';
import {gitTagHead, unshallow} from '../lib/git';
import {gitRepo, gitCommit, gitTagVersion, gitShallowClone, gitLog} from './helpers/git-utils';

// Save the current working diretory
const cwd = process.cwd();

test.afterEach.always(() => {
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Get the commit sha for a given tag or "null" if the tag does not exists', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commit = await gitCommit('First');
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');

  t.is((await gitTagHead('v1.0.0')).substring(0, 7), commit.hash);
  t.falsy(await gitTagHead('missing_tag'));
});

test.serial('Unshallow repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repo = await gitRepo();
  // Add commits to the master branch
  await gitCommit('First');
  await gitCommit('Second');
  // Create a shallow clone with only 1 commit
  await gitShallowClone(repo);

  // Verify the shallow clone contains only one commit
  t.is((await gitLog()).length, 1);

  await unshallow();

  // Verify the shallow clone contains all the commits
  t.is((await gitLog()).length, 2);
});

test.serial('Do not throw error when unshallow a complete repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommit('First');
  await t.notThrows(unshallow());
});
