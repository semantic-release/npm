import { execa } from "execa";
import normalizeUrl from "normalize-url";
import AggregateError from "aggregate-error";
import getRegistry from "./get-registry.js";
import setNpmrcAuth from "./set-npmrc-auth.js";
import getError from "./get-error.js";

function registryIsDefault(registry, DEFAULT_NPM_REGISTRY) {
  return normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY);
}

export default async function (npmrc, pkg, context) {
  const {
    cwd,
    env: { DEFAULT_NPM_REGISTRY = "https://registry.npmjs.org/", ...env },
    stdout,
    stderr,
  } = context;
  const registry = getRegistry(pkg, context);

  // await setNpmrcAuth(npmrc, registry, context);

  if (registryIsDefault(registry, DEFAULT_NPM_REGISTRY)) {
  //   try {
    const publishDryRunResult = execa("npm", ["publish", "--dry-run", "--tag=semantic-release-auth-check"], {cwd, env, preferLocal: true, lines: true});
  //     const whoamiResult = execa("npm", ["whoami", "--userconfig", npmrc, "--registry", registry], {
  //       cwd,
  //       env,
  //       preferLocal: true,
  //     });
  //     whoamiResult.stdout.pipe(stdout, { end: false });
  //     whoamiResult.stderr.pipe(stderr, { end: false });
  //     await whoamiResult;
    publishDryRunResult.stdout.pipe(stdout, { end: false });
    publishDryRunResult.stderr.pipe(stderr, { end: false });

    (await publishDryRunResult).stderr.forEach((line) => {
      if (line.includes("This command requires you to be logged in to ")) {
        throw new AggregateError([getError("EINVALIDNPMAUTH" )]);
      }
    })
  //   } catch {
  //     throw new AggregateError([getError("EINVALIDNPMAUTH", { registry })]);
  //   }
  }
}
