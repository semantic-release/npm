import test from "ava";
import * as td from "testdouble";

import { OFFICIAL_REGISTRY } from "../../lib/definitions/constants.js";

let oidcContextEstablished, trustedCiProvider;

test.beforeEach(async (t) => {
  ({ default: trustedCiProvider } = await td.replaceEsm("../../lib/trusted-publishing/supported-ci-provider.js"));

  ({ default: oidcContextEstablished } = await import("../../lib/trusted-publishing/oidc-context.js"));
});

test.afterEach.always((t) => {
  td.reset();
});

test("that `true` is returned when a trusted-publishing context has been established with the official registry", async (t) => {
  td.when(trustedCiProvider()).thenResolve(true);

  t.true(await oidcContextEstablished(OFFICIAL_REGISTRY));
});

test("that `false` is returned when the official registry is targeted, but outside the context of a supported CI provider", async (t) => {
  td.when(trustedCiProvider()).thenResolve(false);

  t.false(await oidcContextEstablished(OFFICIAL_REGISTRY));
});

test("that `false` is returned when a custom registry is targeted", async (t) => {
  t.false(await oidcContextEstablished("https://custom.registry.org/"));
});
