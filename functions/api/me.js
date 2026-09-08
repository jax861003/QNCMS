// GET /api/me - current session status
import { verifyToken, extractAuth, getEnv } from '../_utils.js';

export async function onRequestGet(context) {
  const env = getEnv(context);
  const token = extractAuth(context.request.headers);
  if (token && (await verifyToken(token, env.JWT_SECRET || 'change-me-jwt-secret'))) {
    return Response.json({ authenticated: true, token });
  }
  return Response.json({ authenticated: false });
}
