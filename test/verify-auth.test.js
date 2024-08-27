import path from "path";
import test from "ava";
import fs from "fs-extra";
import { temporaryDirectory, temporaryFile } from "tempy";
import { execa } from "execa";
import { stub } from "sinon";
import { WritableStreamBuffer } from "stream-buffers";
import verifyNpmAuth from "../lib/verify-auth.js";

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
    accessListPackages: async () => ({}),
  };

  await t.notThrowsAsync(() =>
    verifyNpmAuth(
      npmrc,
      pkg,
      {
        cwd,
        env: {},
        stdout: t.context.stdout,
        stderr: t.context.stderr,
        nextRelease: { version: "1.0.0" },
        logger: t.context.logger,
      },
      npm
    )
  );
});
