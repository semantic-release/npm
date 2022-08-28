const {defaultTo, isString, uniqBy} = require('lodash');

module.exports = (pluginConfig) => {
  const {npmPublish, tarballDir, pkgRoot, packages} = pluginConfig;

  return uniqBy(
    (Array.isArray(packages)
      ? packages
      : [
          {
            npmPublish,
            tarballDir,
            pkgRoot,
          },
        ]
    ).map((config) => {
      if (isString(config)) {
        return {
          npmPublish,
          tarballDir,
          pkgRoot: config,
        };
      }

      config.pkgRoot = defaultTo(config.pkgRoot, pkgRoot);
      config.npmPublish = defaultTo(config.npmPublish, npmPublish);
      config.tarballDir = defaultTo(config.tarballDir, tarballDir);

      return config;
    }),
    'pkgRoot'
  );
};
