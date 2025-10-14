import test from "ava";
import * as td from "testdouble";

//https://docs.npmjs.com/trusted-publishers#supported-cicd-providers

let envCi, trustedCiProvider;

test.beforeEach(async (t) => {
  ({ default: envCi } = await td.replaceEsm("env-ci"));

  ({ default: trustedCiProvider } = await import("../../lib/trusted-publishing/supported-ci-provider.js"));
});

test.afterEach.always((t) => {
  td.reset();
});

test("that `true` is returned when GitHub Actions is detected", async (t) => {
  td.when(envCi()).thenReturn({ name: "GitHub Actions" });

  t.true(await trustedCiProvider());
});

test("that `true` is returned when GitLab Pipelines is detected", async (t) => {
  td.when(envCi()).thenReturn({ name: "GitLab CI/CD" });

  t.true(await trustedCiProvider());
});

test("that `false` is returned when no supported CI provider is detected", async (t) => {
  td.when(envCi()).thenReturn({ name: "Other Service" });

  t.false(await trustedCiProvider());
});
