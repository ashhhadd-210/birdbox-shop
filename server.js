/* Hollow & Home — zero-dependency Node storefront.
   Start: node server.js      Then open http://localhost:4700  */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 4700;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const CATALOG_FILE = path.join(DATA, 'products.json');
const ORDERS_FILE = path.join(DATA, 'orders.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/* ---------- data access ---------- */

const readCatalog = () => JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));

const readOrders = () => {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const writeOrders = (orders) =>
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

/* Stock lives in products.json, so a placed order writes it back. */
const decrementStock = (lines) => {
  const catalog = readCatalog();
  for (const line of lines) {
    const p = catalog.products.find((x) => x.id === line.id);
    if (p) p.stock = Math.max(0, p.stock - line.qty);
  }
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));
};

const orderRef = () => {
  const n = crypto.randomInt(1000, 9999);
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `HH-${stamp}-${n}`;
};

/* ---------- helpers ---------- */

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
};

const sendJson = (res, status, obj) =>
  send(res, status, JSON.stringify(obj), { 'Content-Type': MIME['.json'] });

const readBody = (req, limit = 1e6) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > limit) {
        reject(new Error('payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });

const serveStatic = (res, urlPath) => {
  const rel = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath).replace(/^\/+/, '');
  const file = path.join(PUBLIC, rel);
  // never serve outside public/
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      // unknown path: hand back the app shell so client-side routes work on refresh
      return fs.readFile(path.join(PUBLIC, 'index.html'), (e2, html) =>
        e2 ? send(res, 404, 'Not found') : send(res, 200, html, { 'Content-Type': MIME['.html'] })
      );
    }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    fs.readFile(file, (e3, buf) =>
      e3 ? send(res, 500, 'Read error') : send(res, 200, buf, { 'Content-Type': type })
    );
  });
};

/* ---------- order validation ---------- */

const REQUIRED = ['name', 'email', 'address1', 'city', 'postcode'];

const validateOrder = (payload) => {
  const errors = [];
  const c = payload && payload.customer;
  if (!c || typeof c !== 'object') return ['Customer details are missing.'];
  for (const f of REQUIRED) {
    if (!c[f] || String(c[f]).trim().length < 2) errors.push(`${f} is required.`);
  }
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(c.email))) {
    errors.push('email looks invalid.');
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('The basket is empty.');
  }
  return errors;
};

/* Price server-side from the catalog: never trust prices sent by the browser. */
const priceOrder = (items) => {
  const catalog = readCatalog();
  const lines = [];
  const problems = [];
  for (const item of items) {
    const p = catalog.products.find((x) => x.id === item.id);
    const qty = Math.max(1, Math.min(20, Number(item.qty) || 1));
    if (!p) {
      problems.push(`Unknown product: ${item.id}`);
      continue;
    }
    if (p.stock < qty) {
      problems.push(`${p.name}: only ${p.stock} left in stock.`);
      continue;
    }
    lines.push({ id: p.id, name: p.name, price: p.price, qty, lineTotal: +(p.price * qty).toFixed(2) });
  }
  const subtotal = +lines.reduce((s, l) => s + l.lineTotal, 0).toFixed(2);
  const shipping = catalog.shipping.freeAll ? 0 : 4.95;
  return { lines, subtotal, shipping, total: +(subtotal + shipping).toFixed(2), problems };
};

/* ---------- routes ---------- */

const routes = {
  'GET /api/catalog': (req, res) => sendJson(res, 200, readCatalog()),

  'GET /api/orders': (req, res) => {
    const orders = readOrders();
    sendJson(res, 200, {
      count: orders.length,
      revenue: +orders.reduce((s, o) => s + o.total, 0).toFixed(2),
      orders: orders.slice().reverse(),
    });
  },

  'POST /api/orders': async (req, res) => {
    let payload;
    try {
      payload = JSON.parse(await readBody(req));
    } catch {
      return sendJson(res, 400, { ok: false, errors: ['Could not read the order.'] });
    }

    const errors = validateOrder(payload);
    if (errors.length) return sendJson(res, 400, { ok: false, errors });

    const priced = priceOrder(payload.items);
    if (priced.problems.length) return sendJson(res, 409, { ok: false, errors: priced.problems });

    const c = payload.customer;
    const order = {
      ref: orderRef(),
      placedAt: new Date().toISOString(),
      customer: {
        name: String(c.name).trim(),
        email: String(c.email).trim(),
        phone: String(c.phone || '').trim(),
        address1: String(c.address1).trim(),
        address2: String(c.address2 || '').trim(),
        city: String(c.city).trim(),
        postcode: String(c.postcode).trim().toUpperCase(),
        notes: String(c.notes || '').trim().slice(0, 500),
      },
      items: priced.lines,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
      treesPlanted: priced.lines.reduce((s, l) => s + l.qty * 2, 0),
      status: 'received',
    };

    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);
    decrementStock(priced.lines);

    console.log(`  order ${order.ref} — ${order.customer.name} — £${order.total.toFixed(2)}`);
    sendJson(res, 201, { ok: true, order });
  },
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const key = `${req.method} ${url.pathname}`;

  if (routes[key]) {
    Promise.resolve(routes[key](req, res)).catch((err) => {
      console.error('handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { ok: false, errors: ['Server error.'] });
    });
    return;
  }

  if (url.pathname.startsWith('/api/')) return sendJson(res, 404, { ok: false, errors: ['No such endpoint.'] });
  if (req.method !== 'GET') return send(res, 405, 'Method not allowed');

  serveStatic(res, url.pathname);
});

server.listen(PORT, () => {
  const { brand, products } = readCatalog();
  console.log('');
  console.log(`  ${brand.name} — ${products.length} products, ${readOrders().length} orders on file`);
  console.log(`  Storefront   http://localhost:${PORT}`);
  console.log(`  Orders desk  http://localhost:${PORT}/admin.html`);
  console.log('');
});
