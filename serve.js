// Tiny static file server WITH HTTP Range support (needed for scroll-scrubbed video).
// Usage: node serve.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.argv[2] || 5566;
const TYPES = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8', '.json':'application/json',
  '.mp4':'video/mp4', '.jpeg':'image/jpeg', '.jpg':'image/jpeg',
  '.png':'image/png', '.svg':'image/svg+xml', '.webp':'image/webp', '.ico':'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
    const type = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const total = stat.size;
    const range = req.headers.range;

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] ? parseInt(m[1], 10) : 0;
      let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end >= total) end = total - 1;
      if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${total}` }).end(); return; }
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': type,
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': total, 'Content-Type': type,
        'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

// Graceful start: if the port is taken, try the next few before giving up.
let port = parseInt(PORT, 10) || 5566;
let attempts = 0;
function start() {
  server.listen(port, () => console.log(`Serving ${ROOT}\n-> http://localhost:${port}\n(Ctrl+C to stop)`));
}
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (attempts === 0) {
      console.log(`Port ${port} is already in use - a server may already be running there.`);
      console.log(`If it's this project's server, just open http://localhost:${port}`);
    }
    if (attempts++ < 5) { port++; console.log(`Trying port ${port}...`); start(); }
    else { console.log('No free port found in range. Stop the other server, then retry.'); process.exit(1); }
  } else {
    console.error('Server error:', err.message); process.exit(1);
  }
});
start();
