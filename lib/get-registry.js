import path from "path";
import rc from "rc";
import getRegistryUrl from "registry-auth-token/registry-url.js";
import { OFFICIAL_REGISTRY } from "./definitions/constants.js";

// Registries resolved from `.npmrc` already end with a slash; align the other
// sources so every caller (e.g. the trusted-publishing check against
// OFFICIAL_REGISTRY) sees one canonical form.
const withTrailingSlash = (registry) => (registry.endsWith("/") ? registry : `${registry}/`);

export default function ({ publishConfig: { registry } = {}, name }, { cwd, env }) {
  const configured = registry || env.NPM_CONFIG_REGISTRY;

  if (configured) {
    return withTrailingSlash(configured);
  }

  return getRegistryUrl(
    name.split("/")[0],
    rc("npm", { registry: OFFICIAL_REGISTRY }, { config: env.NPM_CONFIG_USERCONFIG || path.resolve(cwd, ".npmrc") })
  );
}
