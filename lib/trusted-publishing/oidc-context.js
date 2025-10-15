import { OFFICIAL_REGISTRY } from "../definitions/constants.js";
import trustedCiProvider from "./supported-ci-provider.js";
import tokenExchange from "./token-exchange.js";

export default async function oidcContextEstablished(registry, pkg) {
  return OFFICIAL_REGISTRY === registry && trustedCiProvider() && !!(await tokenExchange(pkg));
}
