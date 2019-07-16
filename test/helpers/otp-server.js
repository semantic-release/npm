import http from 'http';

let server;

async function start() {
  server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('this-is-my-otp');
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function stop() {
  return new Promise(resolve => {
    server.close(() => resolve());
  });
}

function address() {
  return server.address();
}

export default {start, stop, address};
