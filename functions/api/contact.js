// Contact form handler - logs submission
export async function POST(context) {
  const body = await context.request.json().catch(() => null);
  console.log('[Contact Form]', { timestamp: new Date().toISOString(), ...body });
  return context.json({ ok: true, message: 'Message received' });
}
