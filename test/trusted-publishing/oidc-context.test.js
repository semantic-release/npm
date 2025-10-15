import test from "ava";
import * as td from "testdouble";

import { OFFICIAL_REGISTRY } from "../../lib/definitions/constants.js";

let oidcContextEstablished, trustedCiProvider, exchangeToken;
const pkg = {};

test.beforeEach(async (t) => {
  await td.replace(globalThis, "fetch");
  ({ default: exchangeToken } = await td.replaceEsm("../../lib/trusted-publishing/token-exchange.js"));
  td.when(exchangeToken(pkg)).thenResolve(undefined);

  ({ default: oidcContextEstablished } = await import("../../lib/trusted-publishing/oidc-context.js"));
});

test.afterEach.always((t) => {
  td.reset();
});

test.serial(
  "that `true` is returned when a trusted-publishing context has been established with the official registry",
  async (t) => {
    td.when(fetch("https://matt.travi.org")).thenResolve(new Response(null, { status: 401 }));
    td.when(exchangeToken(pkg)).thenResolve("token-value");

    t.true(await oidcContextEstablished(OFFICIAL_REGISTRY, pkg));
  }
);

test.serial("that `false` is returned when OIDC token exchange fails in a supported CI provider", async (t) => {
  td.when(fetch("https://matt.travi.org")).thenResolve(new Response(null, { status: 401 }));
  td.when(exchangeToken(pkg)).thenResolve(undefined);

  t.false(await oidcContextEstablished(OFFICIAL_REGISTRY, pkg));
});

test.serial("that `false` is returned when a custom registry is targeted", async (t) => {
  t.false(await oidcContextEstablished("https://custom.registry.org/", pkg));
});
