import { execa } from "execa";
import normalizeUrl from "normalize-url";
import AggregateError from "aggregate-error";
import getError from "./get-error.js";
import getRegistry from "./get-registry.js";
import setNpmrcAuth from "./set-npmrc-auth.js";

export default async function (npmrc, pkg, context) {
  const {
    cwd,
    env: { DEFAULT_NPM_REGISTRY = "https://registry.npmjs.org/", ...env },
    stdout,
    stderr,
  } = context;
  const registry = getRegistry(pkg, context);

  // await setNpmrcAuth(npmrc, registry, context);

  if (normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY)) {
  //   try {
    const publishDryRunResult = execa("npm", ["publish", "--dry-run", "--tag=semantic-release-auth-check"], {cwd, env, preferLocal: true});
  //     const whoamiResult = execa("npm", ["whoami", "--userconfig", npmrc, "--registry", registry], {
  //       cwd,
  //       env,
  //       preferLocal: true,
  //     });
  //     whoamiResult.stdout.pipe(stdout, { end: false });
  //     whoamiResult.stderr.pipe(stderr, { end: false });
  //     await whoamiResult;
    publishDryRunResult.stdout.pipe(stdout, { end: false });
    publishDryRunResult.stderr.pipe(stderr, { end: false, lines: true });
    const {stdout} = await publishDryRunResult;
    stdout.forEach((line) => {
      if (line.includes("warn This command requires you to be logged in to https://registry.npmjs.org/")) {
        throw new AggregateError([new Error('no auth context')]);
      }
    })
  //   } catch {
  //     throw new AggregateError([getError("EINVALIDNPMTOKEN", { registry })]);
  //   }
  }
}
