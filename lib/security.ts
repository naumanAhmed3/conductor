import { createHash, timingSafeEqual } from 'node:crypto';

function equal(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

export function requireAdmin(req: Request): Response | null {
  const expected = process.env.AUTOMATION_ADMIN_TOKEN;
  if (!expected) return Response.json({ error: 'Automation authentication is not configured' }, { status: 503 });
  const value = req.headers.get('authorization') ?? '';
  if (!value.startsWith('Bearer ') || !equal(value.slice(7), expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function assertAllowedNavigation(raw: string, additionalHosts: string[] = []): URL {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:')) {
    throw new Error('Navigation requires HTTPS');
  }
  if (url.username || url.password) throw new Error('URL credentials are not allowed');
  const configured = (process.env.AUTOMATION_ALLOWED_HOSTS ?? '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  const allowed = new Set([...configured, ...additionalHosts.map((v) => v.toLowerCase())]);
  if (!allowed.has(url.hostname.toLowerCase())) throw new Error('Navigation host is not allowlisted');
  return url;
}

