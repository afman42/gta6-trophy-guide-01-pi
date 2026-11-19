import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(fileURLToPath(new URL('./app/', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const portValue = portArg < 0 ? 8080 : Number(process.argv[portArg + 1]);
const port = Number.isInteger(portValue) && portValue > 0 && portValue < 65536 ? portValue : 8080;
const types = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp']
]);

function resolveRequest(requestUrl) {
  let decoded;
  try { decoded = decodeURIComponent(new URL(requestUrl || '/', 'http://localhost').pathname); }
  catch { return null; }
  const path = decoded === '/' ? '/index.html' : decoded;
  const fullPath = resolve(webRoot, `.${path}`);
  return fullPath === webRoot || fullPath.startsWith(webRoot + sep) ? fullPath : null;
}

createServer((request, response) => {
  const file = resolveRequest(request.url);
  if (!file) { response.writeHead(400).end('Bad request'); return; }
  let size;
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error('Not a file');
    size = info.size;
  } catch { response.writeHead(404).end('Not found'); return; }
  response.writeHead(200, {
    'content-type': types.get(extname(file).toLowerCase()) || 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Local guide: http://127.0.0.1:${port}`));
