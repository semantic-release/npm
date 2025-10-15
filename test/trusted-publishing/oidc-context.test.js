import test from "ava";
import * as td from "testdouble";

import { OFFICIAL_REGISTRY } from "../../lib/definitions/constants.js";

let oidcContextEstablished, exchangeToken;
const pkg = {};
const context = {};

test.beforeEach(async (t) => {
  ({ default: exchangeToken } = await td.replaceEsm("../../lib/trusted-publishing/token-exchange.js"));
  td.when(exchangeToken(pkg, context)).thenResolve(undefined);

  ({ default: oidcContextEstablished } = await import("../../lib/trusted-publishing/oidc-context.js"));
});

test.afterEach.always((t) => {
  td.reset();
});

test.serial(
  "that `true` is returned when a trusted-publishing context has been established with the official registry",
  async (t) => {
    td.when(exchangeToken(pkg, context)).thenResolve("token-value");

    t.true(await oidcContextEstablished(OFFICIAL_REGISTRY, pkg, context));
  }
);

test.serial("that `false` is returned when OIDC token exchange fails in a supported CI provider", async (t) => {
  td.when(exchangeToken(pkg, context)).thenResolve(undefined);

  t.false(await oidcContextEstablished(OFFICIAL_REGISTRY, pkg, context));
});

test.serial("that `false` is returned when a custom registry is targeted", async (t) => {
  t.false(await oidcContextEstablished("https://custom.registry.org/", pkg, context));
});
