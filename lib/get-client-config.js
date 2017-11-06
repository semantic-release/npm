module.exports = config => {
  // Form https://github.com/npm/npm/blob/d081cc6c8d73f2aa698aab36605377c95e916224/lib/cache/caching-client.js#L194
  return {
    proxy: {
      http: config.get('proxy'),
      https: config.get('https-proxy'),
      localAddress: config.get('local-address'),
    },
    ssl: {
      certificate: config.get('cert'),
      key: config.get('key'),
      ca: config.get('ca'),
      strict: config.get('strict-ssl'),
    },
    retry: {
      retries: parseInt(config.get('fetch-retries'), 10),
      factor: parseInt(config.get('fetch-retry-factor'), 10),
      minTimeout: parseInt(config.get('fetch-retry-mintimeout'), 10),
      maxTimeout: parseInt(config.get('fetch-retry-maxtimeout'), 10),
    },
    userAgent: config.get('user-agent'),
    defaultTag: config.get('tag'),
    couchToken: config.get('_token'),
    maxSockets: parseInt(config.get('maxsockets'), 10),
  };
};
