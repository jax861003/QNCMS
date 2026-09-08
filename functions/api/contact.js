// POST /api/contact - contact form handler (logs submission)
export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => null);
  console.log('[Contact Form]', { timestamp: new Date().toISOString(), ...body });
  return Response.json({ ok: true, message: 'Message received' });
}
