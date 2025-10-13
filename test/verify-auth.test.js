import test from "ava";
import * as td from "testdouble";

let execa, verifyAuth, getRegistry, setNpmrcAuth;
const DEFAULT_NPM_REGISTRY = "https://registry.npmjs.org/";
const npmrc = "npmrc contents";
const pkg = {};
const otherEnvVars = { foo: "bar" };
const env = { DEFAULT_NPM_REGISTRY, ...otherEnvVars };
const cwd = "./path/to/current/working/directory";
const context = { env, cwd };

test.beforeEach(async (t) => {
  ({ execa } = await td.replaceEsm("execa"));
  ({ default: getRegistry } = await td.replaceEsm("../lib/get-registry.js"));
  ({ default: setNpmrcAuth } = await td.replaceEsm("../lib/set-npmrc-auth.js"));

  ({ default: verifyAuth } = await import("../lib/verify-auth.js"));
});

test.afterEach.always((t) => {
  td.reset();
});

test.serial(
  "that the provided token is verified with `npm whoami` when trusted publishing is not established for the official registry",
  async (t) => {
    td.when(getRegistry(pkg, context)).thenReturn(DEFAULT_NPM_REGISTRY);
    td.when(
      execa("npm", ["whoami", "--userconfig", npmrc, "--registry", DEFAULT_NPM_REGISTRY], {
        cwd,
        env: otherEnvVars,
        preferLocal: true,
      })
    ).thenReturn({
      stdout: { pipe: () => undefined },
      stderr: { pipe: () => undefined },
    });

    await t.notThrowsAsync(verifyAuth(npmrc, pkg, context));
  }
);

test.serial(
  "that the auth context for the official registry is considered invalid when no token is provided and trusted publishing is not established",
  async (t) => {
    td.when(getRegistry(pkg, context)).thenReturn(DEFAULT_NPM_REGISTRY);
    td.when(
      execa("npm", ["whoami", "--userconfig", npmrc, "--registry", DEFAULT_NPM_REGISTRY], {
        cwd,
        env: otherEnvVars,
        preferLocal: true,
      })
    ).thenThrow(new Error());

    const {
      errors: [error],
    } = await t.throwsAsync(verifyAuth(npmrc, pkg, context));

    t.is(error.name, "SemanticReleaseError");
    t.is(error.code, "EINVALIDNPMTOKEN");
    t.is(error.message, "Invalid npm token.");
  }
);

// since alternative registries are not consistent in implementing `npm whoami`,
// we do not attempt to verify the provided token when publishing to them
test.serial("that `npm whoami` is not invoked when publishing to a custom registry", async (t) => {
  td.when(getRegistry(pkg, context)).thenReturn("https://other.registry.org");

  await t.notThrowsAsync(verifyAuth(npmrc, pkg, context));
});
