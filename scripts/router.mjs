#!/usr/bin/env node
/**
 * scripts/router.mjs — Zero-Dependency Dev Server & Page Router for Toggle Calendar
 *
 * Routes:
 *  - /                -> landing.html (Marketing landing page & branding)
 *  - /landing         -> landing.html
 *  - /app             -> index.html   (Full calendar application)
 *  - /calendar        -> index.html
 *  - /*.css, /*.js    -> Static assets with accurate MIME types
 *
 * Run with: npm run dev
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

// Route mapping table
const PAGE_ROUTES = {
  '/': 'landing.html',
  '/home': 'landing.html',
  '/landing': 'landing.html',
  '/landing.html': 'landing.html',
  '/app': 'index.html',
  '/calendar': 'index.html',
  '/index.html': 'index.html',
};

function serveFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      serve404(res);
      return;
    }

    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
  });
}

function serve404(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>404 — Page Not Found | Toggle Calendar</title>
      <link rel="stylesheet" href="/style.css" />
      <style>
        body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--s1, #f8fafc); font-family: sans-serif; }
        .card { background: #fff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        h1 { font-size: 2rem; color: #0f172a; margin-bottom: 12px; }
        p { color: #64748b; margin-bottom: 24px; font-size: 0.95rem; }
        .links { display: flex; gap: 12px; justify-content: center; }
        a { text-decoration: none; padding: 10px 20px; border-radius: 9999px; font-weight: 600; font-size: 0.88rem; }
        .btn-primary { background: #059669; color: #fff; }
        .btn-secondary { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>404</h1>
        <p>The requested route was not found on Toggle Calendar.</p>
        <div class="links">
          <a href="/" class="btn-primary">Go to Landing Page</a>
          <a href="/app" class="btn-secondary">Launch Calendar App</a>
        </div>
      </div>
    </body>
    </html>
  `);
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Strip trailing slashes unless root
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // 1. Check Page Router mapping
  if (PAGE_ROUTES[pathname]) {
    const targetFile = path.join(ROOT_DIR, PAGE_ROUTES[pathname]);
    serveFile(res, targetFile);
    return;
  }

  // 2. Check Static Files in project root
  const safePath = path.normalize(path.join(ROOT_DIR, pathname));

  // Security check: ensure path is within ROOT_DIR
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(res, safePath);
    } else {
      serve404(res);
    }
  });
});

function startServer(port, maxAttempts = 10) {
  server.listen(port, () => {
    console.log(`
  \x1b[32m🌙 Toggle Calendar Dev Server & Page Router\x1b[0m
  ──────────────────────────────────────────────────
  \x1b[1m➜  Landing Page:\x1b[0m  \x1b[36mhttp://localhost:${port}/\x1b[0m
  \x1b[1m➜  Calendar App:\x1b[0m  \x1b[36mhttp://localhost:${port}/app\x1b[0m
  \x1b[1m➜  Local:\x1b[0m         \x1b[90mhttp://127.0.0.1:${port}/\x1b[0m
  ──────────────────────────────────────────────────
  \x1b[90mPress Ctrl+C to stop the server\x1b[0m
`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && maxAttempts > 0) {
      console.log(`\x1b[33mPort ${port} is in use, trying ${port + 1}...\x1b[0m`);
      startServer(port + 1, maxAttempts - 1);
    } else {
      console.error('\x1b[31mFailed to start dev server:\x1b[0m', err.message);
      process.exit(1);
    }
  });
}

startServer(DEFAULT_PORT);
