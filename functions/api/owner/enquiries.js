const MAX_LIMIT = 100;

function unauthorized() {
  return new Response('Not found', {
    status: 404,
    headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'referrer-policy': 'no-referrer' }
  });
}

function equalTokens(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function onRequestGet({ request, env }) {
  const supplied = request.headers.get('authorization') || '';
  const expected = env.OWNER_EXPORT_TOKEN || '';
  if (!equalTokens(supplied, `Bearer ${expected}`) || !env.HELIO_ENQUIRIES) return unauthorized();

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get('limit') || '50');
  const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), MAX_LIMIT) : 50;
  const status = url.searchParams.get('status');
  const statement = status
    ? env.HELIO_ENQUIRIES.prepare(`SELECT reference, created_at, name, email, intent, location, target_date, description, preferred_size, quantity, budget, mounting, status FROM enquiries WHERE status = ? ORDER BY created_at DESC LIMIT ?`).bind(status, limit)
    : env.HELIO_ENQUIRIES.prepare(`SELECT reference, created_at, name, email, intent, location, target_date, description, preferred_size, quantity, budget, mounting, status FROM enquiries ORDER BY created_at DESC LIMIT ?`).bind(limit);
  const result = await statement.all();
  return Response.json({ enquiries: result.results || [], returned: (result.results || []).length }, {
    headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'referrer-policy': 'no-referrer', 'vary': 'Authorization' }
  });
}
