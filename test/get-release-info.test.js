import test from "ava";
import getReleaseInfo from "../lib/get-release-info.js";
import { OFFICIAL_REGISTRY } from "../lib/definitions/constants.js";

test("Default registry and scoped module", async (t) => {
  t.deepEqual(
    await getReleaseInfo(
      { name: "@scope/module" },
      { env: {}, nextRelease: { version: "1.0.0" } },
      "latest",
      OFFICIAL_REGISTRY
    ),
    {
      name: "npm package (@latest dist-tag)",
      url: "https://www.npmjs.com/package/@scope/module/v/1.0.0",
      channel: "latest",
    }
  );
});

test("Custom registry and scoped module", async (t) => {
  t.deepEqual(
    await getReleaseInfo(
      { name: "@scope/module" },
      { env: {}, nextRelease: { version: "1.0.0" } },
      "latest",
      "https://custom.registry.org/"
    ),
    {
      name: "npm package (@latest dist-tag)",
      url: undefined,
      channel: "latest",
    }
  );
});
