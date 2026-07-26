import React, { useEffect, useState } from 'react';
import { supabase, mediaUrl } from '../../lib/supabase';
import { kpiCardStyle, pillStyle } from './adminStyles';
import { DownloadIcon } from './Icons';
import RevenueChart from './RevenueChart';

const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p || 0);

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

export default function AdminDashboard() {
  const [paidOrders, setPaidOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    supabase.from('orders').select('total').eq('status', 'paid').then(({ data }) => setPaidOrders(data || []));
    supabase.from('order_status_counts').select('*').then(({ data }) => setStatusCounts(data || []));
    supabase.from('sales_by_day').select('*').then(({ data }) => setSalesByDay(data || []));

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

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = paidOrders.length;
  const avgOrderValue = orderCount ? totalRevenue / orderCount : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <div>
        <h1 className="display-s">Dashboard</h1>
        <p className="body-s">Performance Overview — Last 30 Days</p>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {[
          ['Total Revenue', formatPrice(totalRevenue)],
          ['Paid Orders (Last 30D)', orderCount],
          ['Avg Order Value', formatPrice(avgOrderValue)],
        ].map(([label, value]) => (
          <div key={label} style={kpiCardStyle}>
            <div className="ui-text">{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginTop: '12px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Order status breakdown */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {statusCounts.length === 0 ? (
          <span className="body-s">No orders yet.</span>
        ) : (
          statusCounts.map((s) => (
            <span key={s.status} style={pillStyle}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--cold-silver)' }} />
              {s.status[0].toUpperCase() + s.status.slice(1)} {s.count}
            </span>
          ))
        )}
      </div>

      {/* Revenue chart */}
      <div style={{ border: '1px solid rgba(200, 204, 209, 0.15)', padding: '24px' }}>
        <div className="ui-text" style={{ marginBottom: '20px' }}>Revenue — Last 30 Days</div>
        <RevenueChart data={salesByDay} />
      </div>

      {/* Top products */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
          <div className="ui-text">Top Performance Products</div>
          {topProducts.length > 0 && (
            <button
              onClick={() => downloadCsv(topProducts)}
              className="underlined-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              <DownloadIcon width={12} height={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Export CSV
            </button>
          )}
        </div>
        {topProducts.length === 0 ? (
          <span className="body-s">No paid orders yet.</span>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(200, 204, 209, 0.15)' }}>
                <th className="ui-text" style={{ textAlign: 'left', padding: '0 0 12px' }}>Product</th>
                <th className="ui-text" style={{ textAlign: 'left', padding: '0 0 12px' }}>Units Sold</th>
                <th className="ui-text" style={{ textAlign: 'right', padding: '0 0 12px' }}>Revenue (INR)</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.product_id} style={{ borderBottom: '1px solid rgba(200, 204, 209, 0.1)' }}>
                  <td style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#151515', flexShrink: 0 }}>
                      {p.image && <img src={p.image} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)' }}>{p.product_name}</div>
                      {p.sku && <div className="body-s" style={{ fontSize: '11px' }}>SKU: {p.sku}</div>}
                    </div>
                  </td>
                  <td className="body-s">{p.units_sold}</td>
                  <td className="body-s" style={{ textAlign: 'right' }}>{formatPrice(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
