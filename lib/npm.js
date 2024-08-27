export default {
  whoami: async ({ userconfig, registry }, execaOpts) => {
    const whoamiResult = execa(
      "npm",
      ["whoami", ...(userconfig ? ["--userconfig", userconfig] : []), ...(registry ? ["--registry", registry] : [])],
      execaOpts
    );
    whoamiResult.stdout.pipe(stdout, { end: false });
    whoamiResult.stderr.pipe(stderr, { end: false });
    return (await whoamiResult).stdout.split("\n").pop();
  },
  accessListPackages: async ({ principal, pkg, userconfig, registry }, execaOpts) => {
    const accessResult = execa(
      "npm",
      [
        "access",
        "list",
        "packages",
        principal,
        pkg,
        ...(userconfig ? ["--userconfig", userconfig] : []),
        ...(registry ? ["--registry", registry] : []),
      ],
      execaOpts
    );
    accessResult.stdout.pipe(stdout, { end: false });
    accessResult.stderr.pipe(stderr, { end: false });
    return Object.fromEntries((await accessResult).stdout.split("\n").map((line) => line.split(/\s*:\s*/)));
  },
};
