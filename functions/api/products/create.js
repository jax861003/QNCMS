// Create/update product handler (requires auth)
export async function POST(context) {
  const token = extractAuth(context.request.headers);
  if (!verifyToken(token)) {
    return context.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await context.request.json().catch(() => null);
  if (!body) return context.json({ ok: false, message: 'Invalid request body' }, { status: 400 });
  if (!body.slug) return context.json({ ok: false, message: 'Missing slug' }, { status: 400 });

  console.log('[Admin] Create/Update product:', body.slug);
  return context.json({ ok: true });
}

function extractAuth(headers) {
  const auth = headers.get('Authorization');
  const cookie = headers.get('Cookie') || '';
  const match = cookie.match(/nova-admin=([^;]+)/);
  return auth?.replace('Bearer ', '') || match?.[1] || null;
}

function verifyToken(token) {
  if (!token) return false;
  try {
    const [ts, sig] = token.split('.');
    const secret = 'fallback-secret';
    const expected = Buffer.from(ts + '.' + secret).toString('base64').slice(0, 32);
    return sig === expected && Number(ts) > Date.now() - 86400000;
  } catch {
    return false;
  }
}
