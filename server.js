import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/vendor/three.module.js', ['vendor/three.module.js', 'text/javascript; charset=utf-8']],
]);
const port = Number(process.env.PORT || 3000);

createServer(async (request, response) => {
  const route = routes.get(request.url.split('?')[0]);
  if (!route) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(new URL(route[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': route[1] }).end(body);
  } catch {
    response.writeHead(500).end('Unable to load page');
  }
}).listen(port, () => {
  console.log(`Hello World server listening on port ${port}`);
});
