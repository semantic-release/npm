import { OFFICIAL_REGISTRY } from "../definitions/constants.js";

export default async function tokenExchange(pkg) {
  const response = await fetch(`${OFFICIAL_REGISTRY}-/npm/v1/oidc/token/exchange/package/${pkg.name}`, { method: 'POST' });

  if (response.ok) {
    return (await response.json()).token;
  }

  return undefined;
}
