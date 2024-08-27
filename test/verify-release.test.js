import path from "path";
import test from "ava";
import fs from "fs-extra";
import { temporaryDirectory, temporaryFile } from "tempy";
import { execa } from "execa";
import { stub } from "sinon";
import { WritableStreamBuffer } from "stream-buffers";
import verifyNpmRelease from "../lib/verify-release.js";

test.beforeEach((t) => {
  t.context.log = stub();
  t.context.logger = { log: t.context.log };
  t.context.stdout = new WritableStreamBuffer();
  t.context.stderr = new WritableStreamBuffer();
});

test("Verify valid token and access", async (t) => {
  const cwd = temporaryDirectory();
  const npmrc = temporaryFile({ name: ".npmrc" });
  const packagePath = path.resolve(cwd, "package.json");
  const pkg = { name: "foo", version: "0.0.0-dev" };
  await fs.outputJson(packagePath, pkg);

  const npm = {
    whoami: async () => "bob",
    accessListPackages: async ({ principal, pkg }) => {
      t.is(principal, "bob");
      t.is(pkg, "foo");
      return Object.fromEntries(
        [
          ["foo", "read-write"],
          ["bar", "read"],
        ].filter((entry) => !pkg || entry[0] === pkg)
      );
    },
  };

  await verifyNpmRelease(
    npmrc,
    pkg,
    {
      cwd,
      env: {},
      stdout: t.context.stdout,
      stderr: t.context.stderr,
      lastRelease: { version: "1.0.0" },
      nextRelease: { version: "1.0.1" },
      logger: t.context.logger,
    },
    npm
  );
});

test("Rejects when user only has read access", async (t) => {
  const cwd = temporaryDirectory();
  const npmrc = temporaryFile({ name: ".npmrc" });
  const packagePath = path.resolve(cwd, "package.json");
  const pkg = { name: "foo", version: "0.0.0-dev" };
  await fs.outputJson(packagePath, pkg);

  const npm = {
    whoami: async () => "bob",
    accessListPackages: async ({ principal, pkg }) => {
      t.is(principal, "bob");
      t.is(pkg, "foo");
      return Object.fromEntries(
        [
          ["foo", "read"],
          ["bar", "read"],
        ].filter((entry) => !pkg || entry[0] === pkg)
      );
    },
  };

  const {
    errors: [error],
  } = await t.throwsAsync(
    verifyNpmRelease(
      npmrc,
      pkg,
      {
        cwd,
        env: {},
        stdout: t.context.stdout,
        stderr: t.context.stderr,
        lastRelease: { version: "1.0.0" },
        nextRelease: { version: "1.0.1" },
        logger: t.context.logger,
      },
      npm
    )
  );

  t.is(error.code, "EINVALIDNPMTOKEN");
});

test("Rejects when package isn't found", async (t) => {
  const cwd = temporaryDirectory();
  const npmrc = temporaryFile({ name: ".npmrc" });
  const packagePath = path.resolve(cwd, "package.json");
  const pkg = { name: "foo", version: "0.0.0-dev" };
  await fs.outputJson(packagePath, pkg);

  const npm = {
    whoami: async () => "bob",
    accessListPackages: async ({ principal, pkg }) => {
      t.is(principal, "bob");
      t.is(pkg, "foo");
      return Object.fromEntries([["bar", "read"]].filter((entry) => !pkg || entry[0] === pkg));
    },
  };

  const {
    errors: [error],
  } = await t.throwsAsync(
    verifyNpmRelease(
      npmrc,
      pkg,
      {
        cwd,
        env: {},
        stdout: t.context.stdout,
        stderr: t.context.stderr,
        lastRelease: { version: "1.0.0" },
        nextRelease: { version: "1.0.1" },
        logger: t.context.logger,
      },
      npm
    )
  );

  t.is(error.code, "EINVALIDNPMTOKEN");
});

test("Doesn't check for package if there is no last release", async (t) => {
  const cwd = temporaryDirectory();
  const npmrc = temporaryFile({ name: ".npmrc" });
  const packagePath = path.resolve(cwd, "package.json");
  const pkg = { name: "foo", version: "0.0.0-dev" };
  await fs.outputJson(packagePath, pkg);

  const npm = {
    whoami: async () => "bob",
    accessListPackages: async ({ principal, pkg }) => {
      t.is(principal, "bob");
      t.is(pkg, "foo");
      return Object.fromEntries([["bar", "read"]].filter((entry) => !pkg || entry[0] === pkg));
    },
  };

  await t.notThrowsAsync(
    verifyNpmRelease(
      npmrc,
      pkg,
      {
        cwd,
        env: {},
        stdout: t.context.stdout,
        stderr: t.context.stderr,
        lastRelease: {},
        nextRelease: { version: "1.0.0" },
        logger: t.context.logger,
      },
      npm
    )
  );
});
