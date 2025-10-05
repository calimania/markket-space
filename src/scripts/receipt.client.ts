export type ReceiptOptions = {
  apiUrl?: string;
};

function moneyFmt(value: any, currency = 'USD') {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((value && Number(value)) / 100 || value); } catch (e) { return String(value); }
}

async function fetchFromSession(endpoint: string, sessionId: string) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stripe.receipt', session_id: sessionId }),
    });
    if (!res.ok) {
      console.error('receipt.client: server returned', res.status);
      return null;
    }
    const json = await res.json().catch(() => null);
    return json?.data?.link?.response || json?.data || null;
  } catch (e) {
    console.error('receipt.client: failed to fetch receipt from session', e);
    return null;
  }
}

function parseReceiptFromQuery() {
  try {
    const qs = new URLSearchParams(location.search);
    const raw = qs.get('receipt') || qs.get('data') || qs.get('r') || qs.get('payload');
    if (!raw) return null;
    try { return JSON.parse(decodeURIComponent(raw)); } catch (e) {}
    try { return JSON.parse(atob(raw)); } catch (e) {}
    return null;
  } catch (e) { return null; }
}

export default async function initReceipt(opts: ReceiptOptions = {}) {
  // if apiUrl not provided, try to read server-rendered DOM config or window global
  let apiUrl = opts.apiUrl;
  if (!apiUrl) {
    try {
      const cfg = document.getElementById('receipt-config');
      if (cfg) apiUrl = cfg.getAttribute('data-api-url') || undefined;
    } catch (e) { /* ignore */ }
  }
  if (!apiUrl && typeof window !== 'undefined') {
    // @ts-ignore window global may be set by legacy pages
    apiUrl = (window as any).__RECEIPT_API_URL || apiUrl;
  }

  const apiBase = (apiUrl || '').replace(/\/+$/, '');
  const endpoint = apiBase ? apiBase + '/api/markket' : '/api/markket';

  const qs = new URLSearchParams(location.search);
  const sessionIdParam = qs.get('session_id') || qs.get('session') || qs.get('sid');

  let data = null;
  if (sessionIdParam) {
    data = await fetchFromSession(endpoint, sessionIdParam);
  } else {
    data = parseReceiptFromQuery();
  }

  // page uses specific IDs rather than data-output attributes
  const outputs = {
    total: document.getElementById('order-total'),
    subtotal: document.getElementById('order-subtotal'),
    email: document.getElementById('order-email'),
    number: document.getElementById('order-number'),
    date: document.getElementById('order-date'),
  };

  if (!data) {
    console.info('Receipt page: no data found (session_id or receipt payload)');
    return;
  }

  // total and subtotal
  const currency = (data.currency || data.currency_code || (data?.link && data.link.response && data.link.response.currency) || 'USD').toUpperCase();
  const totalVal = data.amount_total ?? data.amountTotal ?? data.total ?? data.amount ?? data.payment_intent_amount ?? 0;
  const subtotalVal = data.amount_subtotal ?? data.amountSubtotal ?? data.subtotal ?? 0;

  if (outputs.total) outputs.total.textContent = moneyFmt(totalVal, currency);
  if (outputs.subtotal) outputs.subtotal.textContent = moneyFmt(subtotalVal, currency);

  // customer email / name
  const email = data.customer_details?.email || data.customer_email || data.email || data.receipt_email || '';
  const name = data.customer_details?.name || data.customer || '';
  if (outputs.email) {
    const safe = name ? `${name}${email ? ' <' + email + '>' : ''}` : (email || '—');
    outputs.email.textContent = safe;
  }

  // order number / session id
  const orderId = data.id || data.session_id || data.transaction || data.payment_intent || '';
  if (outputs.number) outputs.number.textContent = orderId || '—';

  // created date (timestamp in seconds)
  const createdTs = data.created ?? data.created_at ?? null;
  try {
    if (outputs.date && createdTs) {
      const d = typeof createdTs === 'number' && String(createdTs).length === 10 ? new Date(createdTs * 1000) : new Date(createdTs);
      outputs.date.textContent = d.toLocaleString();
    }
  } catch (e) { /* ignore */ }

  // render items if present
  const itemsList = document.getElementById('order-items');
  const itemsArr = data.items || data.line_items || data.line_items?.data || [];
  if (itemsList && Array.isArray(itemsArr)) {
    itemsList.innerHTML = '';
    const arr = itemsArr;
    for (const it of arr) {
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center';
      const title = document.createElement('div');
      title.innerHTML = `<div class="font-medium">${it.name || it.description || 'Item'}</div><div class="text-sm">qty: ${it.qty ?? it.quantity ?? 1}</div>`;
      const price = document.createElement('div');
      price.className = 'font-medium';
      const p = Number(it.unit_price ?? it.price ?? it.amount ?? 0);
      try {
        const currency = data?.currency || data?.currency_code || 'USD';
        price.textContent = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((isNaN(p) ? 0 : p) / 100);
      } catch (e) {
        price.textContent = String((isNaN(p) ? 0 : p) / 100);
      }
      li.appendChild(title);
      li.appendChild(price);
      itemsList.appendChild(li);
    }
  }

  // reveal receipt section if hidden
  const emptyEl = document.getElementById('receipt-empty');
  const receiptEl = document.getElementById('receipt');
  if (emptyEl) emptyEl.classList.add('hidden');
  if (receiptEl) receiptEl.classList.remove('hidden');

  // shipping details
  try {
    const shipping = data.shipping_details || data.shipping || data.collected_information?.shipping_details || data.link?.response?.shipping_details || null;
    const shipEl = document.getElementById('order-shipping');
    if (shipEl) {
      if (shipping && (shipping.address || shipping.name)) {
        let lines = [];
        if (shipping.name) lines.push(String(shipping.name));
        const addr = shipping.address || shipping;
        if (addr?.line1) lines.push(String(addr.line1));
        if (addr?.line2) lines.push(String(addr.line2));
        const cityParts = [addr?.city, addr?.state, addr?.postal_code].filter(Boolean).join(', ');
        if (cityParts) lines.push(cityParts);
        if (addr?.country) lines.push(String(addr.country));
        shipEl.textContent = lines.join('\n');
      } else {
        // no shipping -> hide or keep placeholder
        // leave the existing placeholder
      }
    }
  } catch (e) { /* ignore shipping render errors */ }
}
