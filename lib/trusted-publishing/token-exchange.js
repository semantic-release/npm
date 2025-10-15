import { getIDToken } from "@actions/core";

import { OFFICIAL_REGISTRY } from "../definitions/constants.js";

const GITHUB_ACTIONS_PROVIDER_NAME = "GitHub Actions";
const GITLAB_PIPELINES_PROVIDER_NAME = "GitLab CI/CD";

async function exchangeGithubActionsToken(packageName) {
  const idToken = await getIDToken("npm:registry.npmjs.org");
  const response = await fetch(
    `${OFFICIAL_REGISTRY}-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(packageName)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    }
  );

  if (response.ok) {
    return (await response.json()).token;
  }

  return undefined;
}

export default async function exchangeToken(pkg) {
  return await exchangeGithubActionsToken(pkg.name);
}
