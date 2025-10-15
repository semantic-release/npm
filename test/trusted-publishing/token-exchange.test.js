import test from "ava";
import * as td from "testdouble";

import tokenExchange from '../../lib/trusted-publishing/token-exchange.js';
import { OFFICIAL_REGISTRY } from "../../lib/definitions/constants.js";

// https://api-docs.npmjs.com/#tag/registry.npmjs.org/operation/exchangeOidcToken

const packageName = "some-package";
const pkg = { name: packageName };

test.beforeEach(async (t) => {
  await td.replace(globalThis, "fetch");
});

test.afterEach.always((t) => {
  td.reset();
});

test.serial("that an access token is returned when token exchange succeeds", async (t) => {
  const token = "token-value";
  td.when(fetch(`${OFFICIAL_REGISTRY}-/npm/v1/oidc/token/exchange/package/${packageName}`, {method: 'POST'}))
    .thenResolve(new Response(JSON.stringify({token}), {status: 201, headers: {'Content-Type': 'application/json'}}));

  t.is(await tokenExchange(pkg), token);
});

test.serial("that `undefined` is returned when token exchange fails", async (t) => {
  td.when(fetch(`${OFFICIAL_REGISTRY}-/npm/v1/oidc/token/exchange/package/${packageName}`, {method: 'POST'}))
    .thenResolve(new Response(JSON.stringify({message: 'foo'}), {status: 401, headers: {'Content-Type': 'application/json'}}));

  t.is(await tokenExchange(pkg), undefined);
});
