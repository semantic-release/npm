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

Update the `package.json` version, [create](https://docs.npmjs.com/cli/pack) the `npm` package tarball and [publish](https://docs.npmjs.com/cli/publish) to the `npm` registry.

## Configuration

### Npm registry authentication

The `npm` authentication configuration is **required** and can be set via [environment variables](#environment-variables).

Both the [token](https://docs.npmjs.com/getting-started/working_with_tokens) and the legacy (`username`, `password` and `email`) authentication are supported. It is recommended to use the [token](https://docs.npmjs.com/getting-started/working_with_tokens) authentication. The legacy authentication is supported as the alternative npm registries [Artifactory](https://www.jfrog.com/open-source/#os-arti) and [npm-registry-couchapp](https://github.com/npm/npm-registry-couchapp) only supports that form of authentication at this point.

**Note**: Only the `auth-only` [level of npm two-factor authentication](https://docs.npmjs.com/getting-started/using-two-factor-authentication#levels-of-authentication) is supported, semantic-release will not work with the default `auth-and-writes` level.

### Environment variables

| Variable       | Description                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `NPM_TOKEN`    | Npm token created via [npm token create](https://docs.npmjs.com/getting-started/working_with_tokens#how-to-create-new-tokens) |
| `NPM_USERNAME` | Npm username created via [npm adduser](https://docs.npmjs.com/cli/adduser) or on [npmjs.com](https://www.npmjs.com)           |
| `NPM_PASSWORD` | Password of the npm user.                                                                                                     |
| `NPM_EMAIL`    | Email address associated with the npm user                                                                                    |

Use either `NPM_TOKEN` for token authentication or `NPM_USERNAME`, `NPM_PASSWORD` and `NPM_EMAIL` for legacy authentication

### Options

| Options      | Description                                                                                                         | Default |
|--------------|---------------------------------------------------------------------------------------------------------------------|---------|
| `npmPublish` | Whether to publish the `npm` package to the registry. If `false` the `package.json` version will still be updated.  | `true`  |
| `pkgRoot`    | Directory path to publish.                                                                                          | `.`     |
| `tarballDir` | Directory path in which to write the the package tarball. If `false` the tarball is not be kept on the file system. | `false` |

**Note**: The `pkgRoot` directory must contains a `package.json`. The version will be updated only in the `package.json` and `npm-shrinkwrap.json` within the `pkgRoot` directory.

### Npm configuration

The plugins are based on `npm` and will use the configuration from [`.npmrc`](https://docs.npmjs.com/files/npmrc). See [npm config](https://docs.npmjs.com/misc/config) for the option list.

The [`registry`](https://docs.npmjs.com/misc/registry) and [`dist-tag`](https://docs.npmjs.com/cli/dist-tag) can be configured in the `package.json` and will take precedence over the configuration in `.npmrc`:
```json
{
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "tag": "latest"
  }
}
```

### Usage

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

The `npmPublish` and `tarballDir` option can be used to skip the publishing to the `npm` registry and instead, release the package tarball with another plugin. For example with the [github](https://github.com/semantic-release/github) plugin:

```json
{
  "release": {
    "verifyConditions": ["@semantic-release/npm", "@semantic-release/git", "@semantic-release/github"],
    "getLastRelease": "@semantic-release/git",
    "publish": [
      {
        "path": "@semantic-release/npm",
        "npmPublish": false,
        "tarballDir": "dist"
      },
      {
        "path": "@semantic-release/github",
        "assets": "dist/*.tgz"
      },
    ]
  }
}
```

When publishing from a sub-directory with the `pkgRoot` option, the `package.json` and `npm-shrinkwrap.json` updated with the new version can be moved to another directory with a `postpublish` [npm script](https://docs.npmjs.com/misc/scripts). For example with the [git](https://github.com/semantic-release/git) plugin:

```json
{
  "release": {
    "verifyConditions": ["@semantic-release/npm", "@semantic-release/git"],
    "getLastRelease": "@semantic-release/npm",
    "publish": [
      {
        "path": "@semantic-release/npm",
        "pkgRoot": "dist"
      },
      {
        "path": "@semantic-release/git",
        "assets": ["package.json", "npm-shrinkwrap.json"]
      },
    ]
  },
  "scripts": {
    "postpublish": "cp -r dist/package.json . && cp -r dist/npm-shrinkwrap.json ."
  }
}
```
