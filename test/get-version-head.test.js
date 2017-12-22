import test from 'ava';
import getVersionHead from '../lib/get-version-head';
import {gitRepo, gitCommit, gitTagVersion, gitShallowClone} from './helpers/git-utils';

// Save the current working diretory
const cwd = process.cwd();

test.afterEach.always(() => {
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Get the commit sha for corresponding the version', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commit = await gitCommit('First');
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('1.0.0');

  t.is((await getVersionHead('1.0.0')).substring(0, 7), commit.hash);
});

test.serial('Get the commit sha for corresponding the version (starting with v)', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commit = await gitCommit('First');
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');

  t.is((await getVersionHead('1.0.0')).substring(0, 7), commit.hash);
});

test.serial('Get the commit sha for corresponding the version on a shallow repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repo = await gitRepo();
  // Add commits to the master branch
  const commit = await gitCommit('First');
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('1.0.0');
  // Add additionnal commits
  await gitCommit('Second');
  await gitCommit('Third');
  // Create a shallow clone with only 1 commit
  await gitShallowClone(repo);

  t.is((await getVersionHead('1.0.0')).substring(0, 7), commit.hash);
});
