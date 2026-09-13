const LIMITS = { name: 120, email: 254, location: 160, description: 2000, size: 80, quantity: 20, budget: 80, mounting: 160 };
const INTENTS = new Set(['sphere', 'event', 'support']);

function clean(form, key) { return String(form.get(key) || '').trim(); }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function responsePage(status, title, message, reference = '') {
  const safeReference = reference.replace(/[^A-Z0-9-]/g, '');
  const referenceHtml = safeReference ? `<p class="reference">Reference: <strong>${safeReference}</strong></p>` : '';
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} — HELIO</title><link rel="stylesheet" href="/style.css"></head><body><main class="wrap legal-copy"><p class="eyebrow">HELIO / Enquiry</p><h1>${title}</h1><p>${message}</p>${referenceHtml}<p><a class="button" href="/#contact">Back to HELIO</a></p><p class="small">You can also email <a href="mailto:info@helio.lighting">info@helio.lighting</a>.</p></main></body></html>`, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'referrer-policy': 'no-referrer' } });
}
async function fingerprint(request, salt) {
  const address = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'local';
  const encoded = new TextEncoder().encode(`${salt}:${address.split(',')[0].trim()}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  if (!env.HELIO_ENQUIRIES) return responsePage(503, 'Enquiry form unavailable', 'Please use the email link while we restore the form.');
  const url = new URL(request.url);
  const salt = env.RATE_LIMIT_SALT || (['localhost', '127.0.0.1'].includes(url.hostname) ? 'local-preview-only' : '');
  if (!salt) return responsePage(503, 'Enquiry form unavailable', 'Please use the email link while we restore the form.');
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 16384) return responsePage(413, 'Enquiry too large', 'Please shorten the description or send the details by email.');
  let form;
  try { form = await request.formData(); } catch { return responsePage(400, 'Check your enquiry', 'The submitted form could not be read. Please return and try again.'); }
  if (clean(form, 'website')) return responsePage(202, 'Thank you', 'Your enquiry has been received.');
  const data = {
    name: clean(form, 'name'), email: clean(form, 'email').toLowerCase(), intent: clean(form, 'intent'), location: clean(form, 'location'),
    targetDate: clean(form, 'date_not_decided') === 'yes' ? 'not-decided' : clean(form, 'target_date'), description: clean(form, 'description'),
    size: clean(form, 'size'), quantity: clean(form, 'quantity'), budget: clean(form, 'budget'), mounting: clean(form, 'mounting')
  };
  for (const [key, max] of Object.entries(LIMITS)) if (data[key].length > max) return responsePage(400, 'Check your enquiry', `The ${key} field is too long.`);
  if (!validEmail(data.email) || !INTENTS.has(data.intent) || !data.location || !data.description || clean(form, 'privacy_ack') !== 'yes') return responsePage(400, 'Check your enquiry', 'Please complete the required fields and accept the privacy information.');
  if (data.targetDate && data.targetDate !== 'not-decided' && !validDate(data.targetDate)) return responsePage(400, 'Check your enquiry', 'Please enter a valid target date or choose “Not decided yet”.');
  const fp = await fingerprint(request, salt);
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 3600000) * 3600000).toISOString();
  try {
    await env.HELIO_ENQUIRIES.batch([
      env.HELIO_ENQUIRIES.prepare("DELETE FROM enquiries WHERE created_at < datetime('now', '-180 days')"),
      env.HELIO_ENQUIRIES.prepare("DELETE FROM rate_limits WHERE window_start < datetime('now', '-2 days')"),
      env.HELIO_ENQUIRIES.prepare('INSERT INTO rate_limits (fingerprint, window_start, request_count) VALUES (?, ?, 1) ON CONFLICT(fingerprint, window_start) DO UPDATE SET request_count = request_count + 1').bind(fp, windowStart)
    ]);
    const rate = await env.HELIO_ENQUIRIES.prepare('SELECT request_count FROM rate_limits WHERE fingerprint = ? AND window_start = ?').bind(fp, windowStart).first();
    if (!rate || rate.request_count > 5) return responsePage(429, 'Please try again later', 'The enquiry limit for this connection has been reached. You can still contact us by email.');
    const id = crypto.randomUUID();
    const reference = `HL-${now.toISOString().slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`;
    await env.HELIO_ENQUIRIES.prepare(`INSERT INTO enquiries (id, reference, created_at, name, email, intent, location, target_date, description, preferred_size, quantity, budget, mounting, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')`)
      .bind(id, reference, now.toISOString(), data.name, data.email, data.intent, data.location, data.targetDate, data.description, data.size, data.quantity, data.budget, data.mounting).run();
    return responsePage(201, 'Enquiry received', 'Thank you. We have stored your enquiry and will reply by email.', reference);
  } catch {
    return responsePage(503, 'Enquiry form unavailable', 'Your enquiry was not stored. Please send it by email instead.');
  }
}
export function onRequestGet() { return responsePage(405, 'Use the enquiry form', 'Return to HELIO and submit the form, or contact us by email.'); }
