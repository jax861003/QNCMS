// GET /api/me - current session status
import { verifyToken, extractAuth } from '../_utils.js';

export async function GET(context) {
  const env = context.locals.runtime.env;
  const token = extractAuth(context.request.headers);
  if (token && (await verifyToken(token, env.JWT_SECRET || 'change-me-jwt-secret'))) {
    return context.json({ authenticated: true, token });
  }
  return context.json({ authenticated: false });
}
