// Me API - check current auth status
export async function GET(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/nova-admin=([^;]+)/);

  if (match) {
    const [ts, sig] = match[1].split('.');
    if (ts && sig && Number(ts) > Date.now() - 86400000) {
      return context.json({ authenticated: true, token: match[1] });
    }
  }

  return context.json({ authenticated: false });
}
