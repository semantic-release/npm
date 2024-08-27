import { execa } from "execa";
import normalizeUrl from "normalize-url";
import AggregateError from "aggregate-error";
import getError from "./get-error.js";
import getRegistry from "./get-registry.js";
import setNpmrcAuth from "./set-npmrc-auth.js";
import defaultNpm from "./npm.js";

export default async function (npmrc, pkg, context, npm = defaultNpm) {
  const {
    cwd,
    env: { DEFAULT_NPM_REGISTRY = "https://registry.npmjs.org/", ...env },
    stdout,
    stderr,
  } = context;
  const registry = getRegistry(pkg, context);

  if (context.lastRelease?.version && normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY)) {
    let user;
    try {
      user = await npm.whoami(
        { userconfig: npmrc, registry },
        {
          cwd,
          env,
          preferLocal: true,
        }
      );
    } catch {
      throw new AggregateError([getError("EINVALIDNPMTOKEN", { registry })]);
    }

    let packages;
    try {
      packages = await npm.accessListPackages(
        {
          principal: user,
          pkg: pkg.name,
          userconfig: npmrc,
          registry,
        },
        {
          cwd,
          env,
          preferLocal: true,
        }
      );
    } catch {
      throw new AggregateError([getError("EINVALIDNPMTOKEN", { registry })]);
    }
    if (packages[pkg.name] !== "read-write") {
      throw new AggregateError([getError("EINVALIDNPMTOKEN", { registry })]);
    }
  }
}
