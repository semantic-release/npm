import test from "ava";
import { stub } from "sinon";
import publish from "../lib/publish.js";
import addChannel from "../lib/add-channel.js";

const context = (t) => ({
  cwd: process.cwd(),
  env: {},
  stdout: process.stdout,
  stderr: process.stderr,
  logger: { log: t.context.log },
  nextRelease: { version: "1.0.0", channel: "latest" },
});

test.beforeEach((t) => {
  t.context.log = stub();
  t.context.logger = { log: t.context.log };
});

test("Skips publishing when package.private is the string 'true'", async (t) => {
  const result = await publish({}, {}, { name: "private-string", private: "true" }, context(t));

  t.false(result);
});

test("Skips adding a channel when package.private is the string 'true'", async (t) => {
  const result = await addChannel({}, {}, { name: "private-string", private: "true" }, context(t));

  t.false(result);
});
