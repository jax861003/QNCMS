// POST /api/contact - contact form handler (stores submission in D1)
import { getEnv, getDB, ensureTables } from '../_utils.js';

export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => null);
  const db = getDB(getEnv(context));
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
