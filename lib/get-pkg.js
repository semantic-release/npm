import path from "path";
import rpj from "read-package-json-fast";
import AggregateError from "aggregate-error";
import getError from "./get-error.js";

export default async function ({ pkgRoot }, { cwd }) {
  try {
    const normalizedCwd = pkgRoot ? path.resolve(cwd, String(pkgRoot)) : cwd;
    const pathToPkg = path.join(normalizedCwd, "package.json");
    const pkg = await rpj(pathToPkg);

    if (!pkg.name) {
      throw getError("ENOPKGNAME");
    }

    return pkg;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new AggregateError([getError("ENOPKG")]);
    }

    throw new AggregateError([error]);
  }
}
