#!/usr/bin/env node
/**
 * Smoke test for the commerce buy path (COD).
 * Requires API running with DB seeded.
 *
 * Usage:
 *   node scripts/smoke-buy-path.mjs
 *   API_BASE=http://localhost:3001/api/v1 node scripts/smoke-buy-path.mjs
 */
const API_BASE = (process.env.API_BASE || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const ROOT_BASE = API_BASE.replace(/\/api\/v1$/, '') || 'http://localhost:3001';
const EMAIL = process.env.SMOKE_EMAIL || 'customer@bhdoman.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'Customer@123!';

async function req(method, path, body, auth, base = API_BASE) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (auth?.cookie) headers.Cookie = auth.cookie;
  if (auth?.bearer) headers.Authorization = `Bearer ${auth.bearer}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data, setCookie };
}

function mergeCookies(existing, setCookie) {
  const jar = new Map();
  for (const part of (existing || '').split(';').map((s) => s.trim()).filter(Boolean)) {
    const [k, ...rest] = part.split('=');
    jar.set(k, rest.join('='));
  }
  for (const raw of setCookie) {
    const pair = raw.split(';')[0];
    const [k, ...rest] = pair.split('=');
    jar.set(k.trim(), rest.join('='));
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function extractAccessToken(payload) {
  return (
    payload?.accessToken ||
    payload?.data?.accessToken ||
    payload?.tokens?.accessToken ||
    payload?.data?.tokens?.accessToken ||
    null
  );
}

async function main() {
  console.log(`Smoke buy-path against ${API_BASE}`);

  const live = await req('GET', '/health', null, null, ROOT_BASE);
  if (!live.ok) {
    console.error('HEALTH_FAILED', live.status, live.data);
    process.exit(1);
  }
  console.log('OK health', live.data?.status || live.status);

  const ready = await req('GET', '/health/ready', null, null, ROOT_BASE);
  if (ready.ok && ready.data?.status === 'ready') {
    console.log('OK ready', ready.data.status);
  } else {
    console.warn(
      'WARN ready',
      ready.status,
      ready.data?.status || 'not_ready',
      ready.data?.checks || ready.data,
    );
  }

  let cookie = '';
  let bearer = '';
  const login = await req('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (!login.ok) {
    console.error('LOGIN_FAILED', login.status, login.data);
    process.exit(1);
  }
  cookie = mergeCookies(cookie, login.setCookie);
  bearer = extractAccessToken(login.data) || '';
  if (!cookie && !bearer) {
    console.error('LOGIN_NO_SESSION', 'neither Set-Cookie nor accessToken returned');
    process.exit(1);
  }
  const auth = { cookie, bearer };
  console.log('OK login', bearer ? '(bearer)' : '(cookie)');

  const products = await req('GET', '/products?limit=1', null, auth);
  const productList =
    products.data?.data?.data ||
    products.data?.data ||
    products.data?.products ||
    [];
  const product = Array.isArray(productList) ? productList[0] : productList?.[0];
  const productId = product?.id || product?.productId;
  if (!productId) {
    console.error('NO_PRODUCT', products.status, products.data);
    process.exit(1);
  }
  console.log('OK product', productId);

  const carriers = await req('GET', '/shipping/carriers');
  console.log(
    'OK carriers',
    (carriers.data?.data || carriers.data?.carriers || []).length,
  );

  const gateways = await req('GET', '/payments/gateways');
  console.log('OK gateways', (gateways.data?.data || []).length);

  const order = await req(
    'POST',
    '/orders',
    {
      items: [{ productId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Smoke Test',
        phone: '+96890000000',
        city: 'Muscat',
        street: 'Al Khuwair',
        country: 'OM',
        governorate: 'Muscat',
      },
      paymentMethod: 'cod',
      shippingMethod: 'oman_post',
      currency: 'OMR',
    },
    auth,
  );
  if (!order.ok) {
    console.error('ORDER_FAILED', order.status, order.data);
    process.exit(1);
  }
  const orderId = order.data?.id || order.data?.data?.id;
  console.log('OK order', orderId);

  const pay = await req(
    'POST',
    '/payments/process',
    {
      orderId,
      gateway: 'cod',
      method: 'cash_on_delivery',
      amount: order.data?.total || order.data?.data?.total || 1,
      currency: 'OMR',
    },
    auth,
  );
  if (!pay.ok) {
    console.error('PAYMENT_FAILED', pay.status, pay.data);
    process.exit(1);
  }
  console.log('OK payment COD');
  console.log('SMOKE_PASS');
}

main().catch((err) => {
  console.error('SMOKE_ERROR', err);
  process.exit(1);
});
