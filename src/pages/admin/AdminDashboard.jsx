import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, mediaUrl } from '../../lib/supabase';
import { AlertIcon, DownloadIcon, PlusIcon } from './Icons';
import RevenueChart from './RevenueChart';

const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p || 0);

const DAY = 86_400_000;
const RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']];
const PAID = ['paid', 'fulfilled'];

const SHORTCUTS = [
  ['/admin/homepage', 'Edit homepage'],
  ['/admin/products', 'Manage garments'],
  ['/admin/castes', 'Update castes'],
  ['/admin/episodes', 'Manage episodes'],
];

const orderRef = (id) => `#GDLY-${id.slice(0, 4).toUpperCase()}`;
const titleCase = (s) => s[0].toUpperCase() + s.slice(1);

// Daily points for a week, weekly points for longer windows
function revenueBuckets(orders, days) {
  const size = days <= 7 ? 1 : 7;
  const n = Math.ceil(days / size);
  const start = Date.now() - days * DAY;
  const buckets = Array.from({ length: n }, (_, i) => ({
    label: size === 1
      ? new Date(start + (i + 1) * DAY).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : `Week ${i + 1}`,
    revenue: 0,
  }));
  for (const o of orders) {
    const i = Math.floor((Date.parse(o.created_at) - start) / (size * DAY));
    if (i >= 0) buckets[Math.min(n - 1, i)].revenue += o.total;
  }
  return buckets;
}

function downloadCsv(topProducts) {
  const header = 'Product,SKU,Units Sold,Revenue (INR)\n';
  const rows = topProducts
    .map((p) => `"${p.product_name}",${p.sku || ''},${p.units_sold},${p.revenue}`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'top-products.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// PostgREST caps each response (1000 rows by default), so page through the whole window
const PAGE = 1000;
async function fetchPaidOrders(since) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .in('status', PAID)
      .gte('created_at', since)
      .order('created_at')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [paid, setPaid] = useState([]);
  const [recent, setRecent] = useState([]);
  const [awaiting, setAwaiting] = useState(0);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    let active = true;
    const since = new Date(Date.now() - days * DAY).toISOString();
    fetchPaidOrders(since)
      .then((rows) => { if (active) setPaid(rows); })
      .catch(() => { if (active) setPaid([]); });
    supabase
      .from('orders')
      .select('id, status, total, created_at, order_items(product_name)')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (active) setRecent(data || []); });
    return () => { active = false; };
  }, [days]);

  useEffect(() => {
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid')
      .then(({ count }) => setAwaiting(count || 0));

    supabase
      .from('top_products')
      .select('*')
      .limit(10)
      .then(async ({ data }) => {
        const products = data || [];
        if (products.length === 0) return setTopProducts([]);
        const ids = products.map((p) => p.product_id).filter(Boolean);
        const { data: details } = await supabase
          .from('products')
          .select('id, sku, product_images(r2_key, sort_order)')
          .in('id', ids);
        const byId = Object.fromEntries((details || []).map((d) => [d.id, d]));
        setTopProducts(
          products.map((p) => ({
            ...p,
            sku: byId[p.product_id]?.sku,
            image: mediaUrl(byId[p.product_id]?.product_images?.[0]?.r2_key),
          }))
        );
      });
  }, []);

  const revenue = paid.reduce((sum, o) => sum + o.total, 0);
  const rangeLabel = RANGES.find(([d]) => d === days)[1];

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <h1>Dashboard</h1>
          <p>A clear view of your store and what needs attention.</p>
        </div>
        <div className="dash-actions">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Date range">
            {RANGES.map(([d, label]) => <option key={d} value={d}>{label}</option>)}
          </select>
          <Link to="/admin/products" className="dash-primary"><PlusIcon width={18} height={18} /> Add product</Link>
        </div>
      </header>

      <div className="dash-kpis">
        {[
          ['Paid revenue', formatPrice(revenue)],
          ['Paid orders', paid.length],
          ['Average order', formatPrice(paid.length ? revenue / paid.length : 0)],
          ['Awaiting dispatch', awaiting],
        ].map(([label, value]) => (
          <div key={label} className="dash-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {awaiting > 0 && (
        <div className="dash-alert" role="status">
          <AlertIcon width={22} height={22} />
          <span>{awaiting} paid {awaiting === 1 ? 'order' : 'orders'} awaiting dispatch</span>
          <Link to="/admin/orders">Review orders →</Link>
        </div>
      )}

      <div className="dash-split">
        <section className="dash-card">
          <h2>Revenue</h2>
          <p className="dash-sub">Paid orders · {rangeLabel}</p>
          <RevenueChart data={revenueBuckets(paid, days)} />
        </section>

        <section className="dash-card">
          <h2>Studio shortcuts</h2>
          <ul className="dash-shortcuts">
            {SHORTCUTS.map(([to, label]) => (
              <li key={to}><Link to={to}>{label} <span aria-hidden="true">↗</span></Link></li>
            ))}
          </ul>
        </section>
      </div>

      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Recent orders</h2>
          <Link to="/admin/orders">View all orders →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="dash-sub">No orders in this window yet.</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr><th>Order</th><th>Garment</th><th>Status</th><th>Total</th><th>Action</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => {
                  const items = o.order_items || [];
                  return (
                    <tr key={o.id}>
                      <td>{orderRef(o.id)}</td>
                      <td>{items[0]?.product_name || '—'}{items.length > 1 && ` +${items.length - 1}`}</td>
                      <td><span className="dash-pill">{titleCase(o.status)}</span></td>
                      <td>{formatPrice(o.total)}</td>
                      <td><Link to="/admin/orders">View →</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Top garments</h2>
          {topProducts.length > 0 && (
            <button type="button" onClick={() => downloadCsv(topProducts)}>
              Export CSV <DownloadIcon width={16} height={16} />
            </button>
          )}
        </div>
        {topProducts.length === 0 ? (
          <p className="dash-sub">No paid orders yet.</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr><th>Garment</th><th>Units sold</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.product_id}>
                    <td>
                      <div className="dash-garment">
                        <span className="dash-thumb">{p.image && <img src={p.image} alt="" loading="lazy" onError={(e) => { e.target.style.visibility = 'hidden'; }} />}</span>
                        {p.product_name}
                      </div>
                    </td>
                    <td>{p.units_sold}</td>
                    <td>{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
