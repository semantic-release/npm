import path from "path";
import rc from "rc";
import getRegistryUrl from "registry-auth-token/registry-url.js";

export default function ({ publishConfig = {}, name }, { cwd, env }) {
  const scope = name.split("/")[0];
  const publishRegistry = publishConfig[`${scope}:registry`] ?? publishConfig.registry;

  return (
    publishRegistry ||
    env.NPM_CONFIG_REGISTRY ||
    getRegistryUrl(
      scope,
      rc(
        "npm",
        { registry: "https://registry.npmjs.org/" },
        { config: env.NPM_CONFIG_USERCONFIG || path.resolve(cwd, ".npmrc") }
      )
    )
  );
}
