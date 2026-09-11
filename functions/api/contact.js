// POST /api/contact - contact form handler (stores submission in D1)
import { getEnv, getDB, ensureTables, rateLimit } from '../_utils.js';

export async function onRequestPost(context) {
  const db = getDB(getEnv(context));
  const rl = await rateLimit(
    db,
    'contact',
    context.request.headers.get('CF-Connecting-IP') || 'unknown',
    5,
    3600
  );
  if (!rl.ok) {
    return Response.json(
      { ok: false, message: 'Too many messages, please try again later' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }
  const body = await context.request.json().catch(() => null);
  if (db && typeof db.prepare === 'function') {
    try {
      await ensureTables(db);
      await db
        .prepare(
          'INSERT INTO messages (id, name, email, phone, company, message) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(
          'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          (body && body.name) || '',
          (body && body.email) || '',
          (body && body.phone) || '',
          (body && body.company) || '',
          (body && body.message) || ''
        )
        .run();
      return Response.json({ ok: true, message: 'Message received' });
    } catch (e) {
      console.error('D1 message insert failed:', e);
      // degrade gracefully - the visitor still gets a success response
    }
  }
  console.log('[Contact Form]', { timestamp: new Date().toISOString(), ...(body || {}) });
  return Response.json({ ok: true, message: 'Message received' });
}
