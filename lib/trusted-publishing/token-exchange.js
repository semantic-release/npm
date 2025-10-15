import { getIDToken } from "@actions/core";
import envCi from "env-ci";

import {
  OFFICIAL_REGISTRY,
  GITHUB_ACTIONS_PROVIDER_NAME,
  GITLAB_PIPELINES_PROVIDER_NAME,
} from "../definitions/constants.js";

async function exchangeIdToken(idToken, packageName) {
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

async function exchangeGithubActionsToken(packageName) {
  let idToken;

  try {
    idToken = await getIDToken("npm:registry.npmjs.org");
  } catch (e) {
    return undefined;
  }

  return exchangeIdToken(idToken, packageName);
}

async function exchangeGitlabPipelinesToken(packageName) {
  const idToken = process.env.NPM_ID_TOKEN;

  if (!idToken) {
    return undefined;
  }

  return await exchangeIdToken(idToken, packageName);
}

export default async function exchangeToken(pkg) {
  const { name: ciProviderName } = envCi();

  if (GITHUB_ACTIONS_PROVIDER_NAME === ciProviderName) {
    return await exchangeGithubActionsToken(pkg.name);
  }

  if (GITLAB_PIPELINES_PROVIDER_NAME === ciProviderName) {
    return await exchangeGitlabPipelinesToken(pkg.name);
  }

  return undefined;
}
