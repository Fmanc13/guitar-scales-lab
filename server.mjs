// Zero-dependency static server: node server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 5173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  let urlPath = '/';
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    // Malformed percent-encoding ('/%ZZ') is a bad request, not a reason to die:
    // unhandled, this rejection takes the whole process down.
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad Request');
    return;
  }
  const rel = normalize(urlPath === '/' ? 'index.html' : urlPath).replace(/^([/\\])+/, '') || 'index.html';
  // Keep every request inside ROOT.
  const file = join(ROOT, rel);
  if (!file.startsWith(ROOT + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Guitar scales lab -> http://localhost:${PORT}`));
