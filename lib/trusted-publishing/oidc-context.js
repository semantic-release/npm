import { OFFICIAL_REGISTRY } from "../definitions/constants.js";
import exchangeToken from "./token-exchange.js";

export default async function oidcContextEstablished(registry, pkg) {
  return OFFICIAL_REGISTRY === registry && !!(await exchangeToken(pkg));
}
