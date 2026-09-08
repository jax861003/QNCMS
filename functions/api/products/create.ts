import type { APIContext } from 'astro';
import { requireAuth } from '../_utils.ts';

export async function POST(context: APIContext) {
  const auth = await requireAuth(context.request, context.locals.runtime.env);
  if (!auth.ok) {
    return context.json(auth.body, { status: auth.status });
  }
  
  const body = await context.request.json().catch(() => null);
  if (!body) {
    return context.json({ ok: false, message: 'Invalid request body' }, { status: 400 });
  }
  
  // In production, this would save to D1
  // For now, log the request
  console.log('[Admin] Create/Update product:', body.slug);
  
  return context.json({ ok: true });
}
