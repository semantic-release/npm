import test from "ava";

import { OFFICIAL_REGISTRY } from "../../lib/definitions/constants.js";
import oidcContextEstablished from "../../lib/trusted-publishing/oidc-context.js";

test("that `true` is returned when a trusted-publishing context has been established with the official registry", async (t) => {
  t.true(await oidcContextEstablished(OFFICIAL_REGISTRY));
});

test("that `false` is returned when a custom registry is targeted", async (t) => {
  t.false(await oidcContextEstablished("https://custom.registry.org/"));
});
