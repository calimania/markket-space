import React, { useEffect, useState } from 'react';

function moneyFmt(value: any, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((value && Number(value)) / 100 || value);
  } catch (e) {
    return String(value);
  }
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

/**
 * Read a stripe session_id, or order_id and display information
 *
 * @param props.api markket.api_url - api.markket.place
 * @returns
 */
const ReceiptComponentPage= ({ api }: { api: string }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const endpoint = new URL('/api/markket', api).toString();
        const qs = new URLSearchParams(window.location.search);
        const sessionId = (qs.get('session_id') || qs.get('session') || qs.get('sid') || '').trim();

        if (!sessionId) {
          // no session id present — nothing to fetch
          if (mounted) {
            setData(null);
            setError(null);
          }
          return;
        }

        const resolved = await fetchFromSession(endpoint, sessionId);

        if (mounted) {
          if (resolved) setData(resolved);
          else setError('No receipt data returned from server for this session.');
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const getCurrency = (d: any) => (d?.currency || d?.currency_code || (d?.link?.response && d.link.response.currency) || 'USD').toUpperCase();
  const getTotal = (d: any) => d?.amount_total ?? d?.amountTotal ?? d?.total ?? d?.amount ?? 0;
  const getSubtotal = (d: any) => d?.amount_subtotal ?? d?.amountSubtotal ?? d?.subtotal ?? 0;
  const getCustomerEmail = (d: any) => d?.customer_details?.email || d?.customer_email || d?.email || d?.receipt_email || '';
  const getCustomerName = (d: any) => d?.customer_details?.name || d?.customer || '';
  const getOrderId = (d: any) => d?.id || d?.session_id || d?.transaction || d?.payment_intent || '';
  const getCreated = (d: any) => d?.created ?? d?.created_at ?? null;
  const getShipping = (d: any) => d?.shipping_details || d?.shipping || d?.collected_information?.shipping_details || d?.link?.response?.shipping_details || null;

  return (
    <main className="container my-12">
      <section className="mx-auto max-w-3xl rounded-lg p-6 bg-surface border" role="region" aria-labelledby="receipt-heading">
        <h2 id="receipt-heading" className="text-2xl font-semibold">Order receipt</h2>
        <p className="text-sm mt-1 text-muted">This page decodes a receipt payload from the URL and renders a printable copy for your records.</p>

        {!loading && !data && !error && (
          <div id="receipt-empty" className="mt-6">
            <p className="text-muted">No receipt data detected. Append <code>?receipt=</code> followed by a URL-encoded JSON object to the URL (example in console).</p>
          </div>
        )}

        {loading && (
          <div className="mt-6 text-sm text-muted">Fetching receipt…</div>
        )}

        {error && (
          <div className="mt-6 text-sm text-red-600">Error loading receipt: {error}</div>
        )}

        {data && (
          <div id="receipt" className="mt-6" aria-live="polite">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted">Order</p>
                <h3 id="order-id" className="text-lg font-medium">#{getOrderId(data) || '—'}</h3>
                <p id="order-date" className="text-sm text-muted mt-1">{(function(){
                  const ts = getCreated(data); try { if (!ts) return '—'; const d = (typeof ts === 'number' && String(ts).length === 10) ? new Date(ts * 1000) : new Date(ts); return d.toLocaleString(); } catch(e){return '—';}
                })()}</p>

                <p className="text-sm text-muted mt-4">Billed to</p>
                <p id="order-email" className="font-medium break-words">{getCustomerName(data) || getCustomerEmail(data) || '—'}</p>
                <p id="order-shipping" className="text-sm mt-2 text-muted whitespace-pre-line break-words">{(function(){
                  const ship = getShipping(data); if (!ship) return '—'; const lines: string[] = []; if (ship.name) lines.push(String(ship.name)); const addr = ship.address || ship; if (addr?.line1) lines.push(String(addr.line1)); if (addr?.line2) lines.push(String(addr.line2)); const cityParts = [addr?.city, addr?.state, addr?.postal_code].filter(Boolean).join(', '); if (cityParts) lines.push(cityParts); if (addr?.country) lines.push(String(addr.country)); return lines.join('\n');
                })()}</p>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-semibold">Items</h4>
              <ul id="order-items" className="mt-2 space-y-3">
                {(function(){
                  const items = data.items || data.line_items || data.line_items?.data || [];
                  if (!Array.isArray(items) || items.length === 0) return null;
                  return items.map((it: any, i: number) => {
                    const title = it.name || it.description || 'Item';
                    const qty = it.qty ?? it.quantity ?? 1;
                    const p = Number(it.unit_price ?? it.price ?? it.amount ?? 0);
                    const currency = getCurrency(data);
                    const price = (() => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((isNaN(p) ? 0 : p) / 100); } catch (e) { return String((isNaN(p) ? 0 : p) / 100); } })();
                    return (
                      <li key={i} className="flex justify-between items-center">
                        <div className="font-medium">{title}<div className="text-sm">qty: {qty}</div></div>
                        <div className="font-medium">{price}</div>
                      </li>
                    );
                  });
                })()}
              </ul>
            </div>

            <div className="mt-6 border-t pt-4 flex justify-end gap-6">
              <div>
                <p className="text-sm text-muted">Subtotal</p>
                <p id="order-subtotal" className="font-medium">{moneyFmt(getSubtotal(data), getCurrency(data))}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Total</p>
                <p id="order-total" className="text-xl font-bold">{moneyFmt(getTotal(data), getCurrency(data))}</p>
              </div>
            </div>

          </div>
        )}
      </section>
    </main>
  );
};

export default ReceiptComponentPage;