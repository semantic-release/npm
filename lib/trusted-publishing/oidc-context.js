import { OFFICIAL_REGISTRY } from "../definitions/constants.js";
import trustedCiProvider from "./supported-ci-provider.js";

export default function oidcContextEstablished(registry) {
  return OFFICIAL_REGISTRY === registry && trustedCiProvider();
}
