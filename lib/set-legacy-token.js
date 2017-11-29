module.exports = () => {
  // Set the environment variable `LEGACY_TOKEN` when user use the legacy auth, so it can be resolved by npm CLI
  if (process.env.NPM_USERNAME && process.env.NPM_PASSWORD && process.env.NPM_EMAIL) {
    process.env.LEGACY_TOKEN = Buffer.from(`${process.env.NPM_USERNAME}:${process.env.NPM_PASSWORD}`, 'utf8').toString(
      'base64'
    );
  }
};
