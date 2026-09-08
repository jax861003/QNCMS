import type { APIContext } from 'astro';

export async function POST(context: APIContext) {
  const body = await context.request.json().catch(() => null);
  
  // Log the contact submission (in production, send email/notification)
  console.log('[Contact Form]', {
    timestamp: new Date().toISOString(),
    ...body,
  });
  
  // TODO: Integrate with Resend/SendGrid/email service for actual notification
  
  return context.json({ ok: true, message: 'Message received' });
}
