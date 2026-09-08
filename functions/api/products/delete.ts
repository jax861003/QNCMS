import type { APIContext } from 'astro';
import { requireAuth } from '../_utils.ts';

export async function DELETE(context: APIContext) {
  const auth = await requireAuth(context.request, context.locals.runtime.env);
  if (!auth.ok) {
    return context.json(auth.body, { status: auth.status });
  }
  
  const slug = context.url.searchParams.get('slug');
  if (!slug) {
    return context.json({ ok: false, message: 'Missing slug' }, { status: 400 });
  }
  
  // In production, this would delete from D1
  // For now, log the request
  console.log(`[Admin] Delete product: ${slug}`);
  
  return context.json({ ok: true });
}
