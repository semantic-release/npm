import test from "ava";
import * as td from "testdouble";
import AggregateError from "aggregate-error";
import { OFFICIAL_REGISTRY } from "../lib/definitions/constants.js";

let execa, verifyAuth, getRegistry, setNpmrcAuth, oidcContextEstablished;
const DEFAULT_NPM_REGISTRY = OFFICIAL_REGISTRY;
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
  ({ default: oidcContextEstablished } = await td.replaceEsm("../lib/trusted-publishing/oidc-context.js"));
  td.when(oidcContextEstablished()).thenReturn(false);

  ({ default: verifyAuth } = await import("../lib/verify-auth.js"));
});

test.afterEach.always((t) => {
  td.reset();
});

test.serial(
  "that the auth context for the official registry is considered valid when trusted publishing is established",
  async (t) => {
    td.when(getRegistry(pkg, context)).thenReturn(DEFAULT_NPM_REGISTRY);
    td.when(oidcContextEstablished(DEFAULT_NPM_REGISTRY, pkg, context)).thenResolve(true);

    await t.notThrowsAsync(verifyAuth(npmrc, pkg, {}, context));
  }
);

test.serial(
  "that the provided token is verified with `npm whoami` when trusted publishing is not established for the official registry",
  async (t) => {
    td.when(getRegistry(pkg, context)).thenReturn(DEFAULT_NPM_REGISTRY);
    td.when(oidcContextEstablished(DEFAULT_NPM_REGISTRY, pkg, context)).thenResolve(false);
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

    await t.notThrowsAsync(verifyAuth(npmrc, pkg, {}, context));
  }
);

test.serial(
  "that the auth context for the official registry is considered invalid when no token is provided and trusted publishing is not established",
  async (t) => {
    td.when(getRegistry(pkg, context)).thenReturn(DEFAULT_NPM_REGISTRY);
    td.when(oidcContextEstablished(DEFAULT_NPM_REGISTRY, pkg, context)).thenResolve(false);
    td.when(
      execa("npm", ["whoami", "--userconfig", npmrc, "--registry", DEFAULT_NPM_REGISTRY], {
        cwd,
        env: otherEnvVars,
        preferLocal: true,
      })
    ).thenThrow(new Error());

    const {
      errors: [error],
    } = await t.throwsAsync(verifyAuth(npmrc, pkg, {}, context));

    t.is(error.name, "SemanticReleaseError");
    t.is(error.code, "EINVALIDNPMTOKEN");
    t.is(error.message, "Invalid npm token.");
  }
);

test.serial(
  "that a publish dry run is performed to validate token presence when publishing to a custom registry",
  async (t) => {
    const otherRegistry = "https://other.registry.org";
    const execaResult = Promise.resolve({
      stderr: ["foo", "bar", "baz"],
    });
    execaResult.stderr = { pipe: () => undefined };
    execaResult.stdout = { pipe: () => undefined };
    td.when(getRegistry(pkg, context)).thenReturn(otherRegistry);
    td.when(oidcContextEstablished(DEFAULT_NPM_REGISTRY, pkg, context)).thenResolve(false);
    td.when(
      execa(
        "npm",
        [
          "publish",
          cwd,
          "--dry-run",
          "--tag=semantic-release-auth-check",
          "--userconfig",
          npmrc,
          "--registry",
          otherRegistry,
        ],
        {
          cwd,
          env: otherEnvVars,
          preferLocal: true,
          lines: true,
        }
      )
    ).thenReturn(execaResult);

    await t.notThrowsAsync(verifyAuth(npmrc, pkg, {}, context));
  }
);

test.serial(
  "that a publish dry run is performed to validate token presence when publishing to a custom registry from a sub-directory",
  async (t) => {
    const otherRegistry = "https://other.registry.org";
    const pkgRoot = "/dist";
    const execaResult = Promise.resolve({
      stderr: ["foo", "bar", "baz"],
    });
    execaResult.stderr = { pipe: () => undefined };
    execaResult.stdout = { pipe: () => undefined };
    td.when(getRegistry(pkg, context)).thenReturn(otherRegistry);
    td.when(oidcContextEstablished(DEFAULT_NPM_REGISTRY, pkg, context)).thenResolve(false);
    td.when(
      execa(
        "npm",
        [
          "publish",
          pkgRoot,
          "--dry-run",
          "--tag=semantic-release-auth-check",
          "--userconfig",
          npmrc,
          "--registry",
          otherRegistry,
        ],
        {
          cwd,
          env: otherEnvVars,
          preferLocal: true,
          lines: true,
        }
      )
    ).thenReturn(execaResult);

    await t.notThrowsAsync(verifyAuth(npmrc, pkg, { pkgRoot }, context));
  }
);

// since alternative registries are not consistent in implementing `npm whoami`,
// the best we can attempt to verify is to do a dry run publish and check for auth warnings
test.serial(
  "that the token is considered invalid when the publish dry run fails when publishing to a custom registry",
  async (t) => {
    const otherRegistry = "https://other.registry.org";
    const execaResult = Promise.resolve({
      stderr: ["foo", "bar", "baz", `This command requires you to be logged in to ${otherRegistry}`, "qux"],
    });
    execaResult.stderr = { pipe: () => undefined };
    execaResult.stdout = { pipe: () => undefined };
    td.when(getRegistry(pkg, context)).thenReturn(otherRegistry);
    td.when(oidcContextEstablished(otherRegistry, pkg, context)).thenResolve(false);
    td.when(
      execa(
        "npm",
        [
          "publish",
          cwd,
          "--dry-run",
          "--tag=semantic-release-auth-check",
          "--userconfig",
          npmrc,
          "--registry",
          otherRegistry,
        ],
        {
          cwd,
          env: otherEnvVars,
          preferLocal: true,
          lines: true,
        }
      )
    ).thenReturn(execaResult);

    const {
      errors: [error],
    } = await t.throwsAsync(verifyAuth(npmrc, pkg, {}, context));

    t.is(error.name, "SemanticReleaseError");
    t.is(error.code, "EINVALIDNPMAUTH");
    t.is(error.message, "Invalid npm authentication.");
  }
);

test.serial("that errors from setting up auth bubble through this function", async (t) => {
  const registry = DEFAULT_NPM_REGISTRY;
  const thrownError = new Error();
  td.when(getRegistry(pkg, context)).thenReturn(registry);
  td.when(oidcContextEstablished(registry, pkg, context)).thenResolve(false);
  td.when(setNpmrcAuth(npmrc, registry, context)).thenThrow(new AggregateError([thrownError]));

  const {
    errors: [error],
  } = await t.throwsAsync(verifyAuth(npmrc, pkg, {}, context));

  t.is(error, thrownError);
});
