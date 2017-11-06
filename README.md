# @semantic-release/npm

Set of [semantic-release](https://github.com/semantic-release/semantic-release) plugins for publishing to a [npm](https://www.npmjs.com/) registry.

[![Travis](https://img.shields.io/travis/semantic-release/npm.svg)](https://travis-ci.org/semantic-release/npm)
[![Codecov](https://img.shields.io/codecov/c/github/semantic-release/npm.svg)](https://codecov.io/gh/semantic-release/npm)
[![Greenkeeper badge](https://badges.greenkeeper.io/semantic-release/npm.svg)](https://greenkeeper.io/)

## verifyConditions

Verify the presence of the `NPM_TOKEN` environment variable, create or update the `.npmrc` file with the token and verify the token is valid.

## getLastRelease

Determine the last release of the package on the `npm` registry.

## publish

Publish the package on the `npm` registry.

## Configuration

For each plugin, the `npm` authentication token has to be configured with the environment variable `NPM_TOKEN`.

All the plugins are based on `npm` and will use the configuration from `.npmrc`. Any parameter returned by `npm config list` will be used by each plugin.

The registry and dist-tag can be configured in the `package.json` and will take precedence on the configuration in `.npmrc`:
```json
{
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "tag": "latest"
  }
}
```
The plugins are used by default by [semantic-release](https://github.com/semantic-release/semantic-release) so no specific configuration is requiered to use them.

Each individual plugin can be disabled, replaced or used with other plugins in the `package.json`:
```json
{
  "release": {
    "verifyConditions": ["@semantic-release/npm", "verify-other-condition"],
    "getLastRelease": "custom-get-last-release",
    "publish": ["@semantic-release/npm", "custom-publish"]
  }
}
```
