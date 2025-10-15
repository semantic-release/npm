import test from "ava";
import * as td from "testdouble";

import {
  OFFICIAL_REGISTRY,
  GITHUB_ACTIONS_PROVIDER_NAME,
  GITLAB_PIPELINES_PROVIDER_NAME,
} from "../../lib/definitions/constants.js";

// https://api-docs.npmjs.com/#tag/registry.npmjs.org/operation/exchangeOidcToken

let exchangeToken, getIDToken, envCi;
const packageName = "@scope/some-package";
const pkg = { name: packageName };
const idToken = "id-token-value";
const token = "token-value";

test.beforeEach(async (t) => {
  await td.replace(globalThis, "fetch");
  ({ getIDToken } = await td.replaceEsm("@actions/core"));
  ({ default: envCi } = await td.replaceEsm("env-ci"));

  ({ default: exchangeToken } = await import("../../lib/trusted-publishing/token-exchange.js"));
});

test.afterEach.always((t) => {
  td.reset();

  delete process.env.NPM_ID_TOKEN;
});

test.serial("that an access token is returned when token exchange succeeds on GitHub Actions", async (t) => {
  td.when(envCi()).thenReturn({ name: GITHUB_ACTIONS_PROVIDER_NAME });
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

test.serial("that `undefined` is returned when ID token retrieval fails on GitHub Actions", async (t) => {
  td.when(envCi()).thenReturn({ name: GITHUB_ACTIONS_PROVIDER_NAME });
  td.when(getIDToken("npm:registry.npmjs.org")).thenThrow(
    new Error("Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable")
  );

  t.is(await exchangeToken(pkg), undefined);
});

test.serial("that `undefined` is returned when token exchange fails on GitHub Actions", async (t) => {
  td.when(envCi()).thenReturn({ name: GITHUB_ACTIONS_PROVIDER_NAME });
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

test.serial("that an access token is returned when token exchange succeeds on GitLab Pipelines", async (t) => {
  process.env.NPM_ID_TOKEN = idToken;
  td.when(envCi()).thenReturn({ name: GITLAB_PIPELINES_PROVIDER_NAME });
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

test.serial("that `undefined` is returned when ID token is not available on GitLab Pipelines", async (t) => {
  td.when(envCi()).thenReturn({ name: GITLAB_PIPELINES_PROVIDER_NAME });

  t.is(await exchangeToken(pkg), undefined);
});

test.serial("that `undefined` is returned when token exchange fails on GitLab Pipelines", async (t) => {
  process.env.NPM_ID_TOKEN = idToken;
  td.when(envCi()).thenReturn({ name: GITLAB_PIPELINES_PROVIDER_NAME });
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

test.serial("that `undefined` is returned when no supported CI provider is detected", async (t) => {
  td.when(envCi()).thenReturn({ name: "Other Service" });

  t.is(await exchangeToken(pkg), undefined);
});
