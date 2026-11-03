// Local preview server. Vercel runs the handlers in api/ directly.
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const meta = require('./lib/meta.cjs');

const root = process.cwd();
const port = Number(process.env.PORT || 8765);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/api/status') return meta.status(req, res);
  if (pathname === '/api/analyze-station') return meta.analyze(req, res);
  if (pathname === '/api/synthesize-report') return meta.synthesize(req, res);
  try {
    const target = path.resolve(root, pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const content = await fs.readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}).listen(port, '127.0.0.1', () => process.stdout.write(`PlantScout running at http://127.0.0.1:${port}/\n`));
