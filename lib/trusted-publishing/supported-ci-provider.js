import envCi from "env-ci";

export default function trustedCiProvider() {
  const { name } = envCi();

  return "GitHub Actions" === name || "GitLab CI/CD" === name;
}
