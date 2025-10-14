import { OFFICIAL_REGISTRY } from "../definitions/constants.js";

export default function oidcContextEstablished(registry) {
  return OFFICIAL_REGISTRY === registry;
}
