/**
 * Static server used by the e2e visual-regression tests.
 *
 * Serves the built bundle from dist/ and the test fixture at /fixture.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../dist');
const fixturePath = path.resolve(__dirname, './fixture.html');
const port = process.env.E2E_PORT || 8787;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const url = req.url === '/' || req.url === '/fixture' ? '/fixture' : req.url;

  if (url === '/fixture') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(fixturePath).pipe(res);
    return;
  }

  const filePath = path.join(root, url);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`E2E server ready at http://localhost:${port}`);
});
