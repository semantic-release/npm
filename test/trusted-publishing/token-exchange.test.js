import test from "ava";
import * as td from "testdouble";

import { OFFICIAL_REGISTRY } from "../../lib/definitions/constants.js";

// https://api-docs.npmjs.com/#tag/registry.npmjs.org/operation/exchangeOidcToken

let exchangeToken, getIDToken;
const packageName = "@scope/some-package";
const pkg = { name: packageName };
const idToken = "id-token-value";
const token = "token-value";

test.beforeEach(async (t) => {
  await td.replace(globalThis, "fetch");
  ({ getIDToken } = await td.replaceEsm("@actions/core"));

  ({ default: exchangeToken } = await import("../../lib/trusted-publishing/token-exchange.js"));
});

test.afterEach.always((t) => {
  td.reset();
});

test.serial("that an access token is returned when token exchange succeeds", async (t) => {
  td.when(getIDToken("npm:registry.npmjs.org")).thenResolve(idToken);
  td.when(
    fetch(`${OFFICIAL_REGISTRY}-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(packageName)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    })
  ).thenResolve(
    new Response(JSON.stringify({ token }), { status: 201, headers: { "Content-Type": "application/json" } })
  );

  t.is(await exchangeToken(pkg), token);
});

test.serial("that `undefined` is returned when token exchange fails", async (t) => {
  td.when(getIDToken("npm:registry.npmjs.org")).thenResolve(idToken);
  td.when(
    fetch(`${OFFICIAL_REGISTRY}-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(packageName)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    })
  ).thenResolve(
    new Response(JSON.stringify({ message: "foo" }), { status: 401, headers: { "Content-Type": "application/json" } })
  );

  t.is(await exchangeToken(pkg), undefined);
});
