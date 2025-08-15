import { execa } from "execa";
import normalizeUrl from "normalize-url";
import AggregateError from "aggregate-error";
import getRegistry from "./get-registry.js";
import setNpmrcAuth from "./set-npmrc-auth.js";
import getError from "./get-error.js";

function registryIsDefault(registry, DEFAULT_NPM_REGISTRY) {
  return normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY);
}

function targetingDefaultRegistryButNoTokenProvided(registry, DEFAULT_NPM_REGISTRY, errors) {
  return registryIsDefault(registry, DEFAULT_NPM_REGISTRY) && errors.length === 1 && errors[0].code === "ENONPMTOKEN";
}

export default async function (npmrc, pkg, context) {
  const {
    cwd,
    env: { DEFAULT_NPM_REGISTRY = "https://registry.npmjs.org/", ...env },
    stdout,
    stderr,
    logger,
  } = context;
  const registry = getRegistry(pkg, context);

  try {
    logger.log("setting npmrc auth for registry", registry);
    await setNpmrcAuth(npmrc, registry, context);
  } catch (aggregateError) {
    const { errors } = aggregateError;

    if (targetingDefaultRegistryButNoTokenProvided(registry, DEFAULT_NPM_REGISTRY, errors)) {
      logger.log("NPM_TOKEN was not provided for the default npm registry.");
    } else {
      throw aggregateError;
    }
  }

  if (registryIsDefault(registry, DEFAULT_NPM_REGISTRY)) {
    const publishDryRunResult = execa(
      "npm",
      ["publish", "--dry-run", "--tag=semantic-release-auth-check", "--userconfig", npmrc, "--registry", registry],
      { cwd, env, preferLocal: true, lines: true }
    );

    publishDryRunResult.stdout.pipe(stdout, { end: false });
    publishDryRunResult.stderr.pipe(stderr, { end: false });

    (await publishDryRunResult).stderr.forEach((line) => {
      if (line.includes("This command requires you to be logged in to ")) {
        throw new AggregateError([getError("EINVALIDNPMAUTH")]);
      }
    });
  }
}
