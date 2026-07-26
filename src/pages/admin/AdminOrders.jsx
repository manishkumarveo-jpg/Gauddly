import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { inputStyle, cardStyle, badgeStyle, primaryButtonStyle } from './adminStyles';
import { ChevronDownIcon } from './Icons';
import Pagination from './Pagination';
import ProgressBar from './ProgressBar';
import { useConfirm } from './useConfirm';

const STATUSES = ['pending', 'paid', 'failed', 'cancelled', 'fulfilled'];
const PAGE_SIZE = 10;

const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

const notWiredYet = (action) => () => alert(`${action} isn't wired up yet — coming in a later pass.`);

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [isBusy, setIsBusy] = useState(false);
  const [confirmDialog, requestConfirm] = useConfirm();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce the search box so we don't fire a query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [statusFilter, search]);

  const load = () => {
    setIsBusy(true);
    let query = supabase
      .from('orders')
      .select('id, email, name, phone, status, subtotal, total, created_at, order_items(product_name, size, unit_price, quantity)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) {
      const term = search.replace(/[,%]/g, ''); // keep the or() filter syntax well-formed
      query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    query.then(({ data, count }) => {
      setOrders(data || []);
      setTotalCount(count || 0);
      setIsBusy(false);
    });
  };

  useEffect(load, [statusFilter, search, page]);

  const updateStatus = async (order, status) => {
    if (!(await requestConfirm(`Mark order #GDLY-${order.id.slice(0, 4).toUpperCase()} as "${status}"?`))) return;
    setIsBusy(true);
    await supabase.from('orders').update({ status }).eq('id', order.id);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="display-s">Orders</h1>
        <p className="ui-text" style={{ marginTop: '8px' }}>Management & Logistics Command</p>
      </div>

      <ProgressBar active={isBusy} />

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <label className="body-s" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Status
          <select style={{ ...inputStyle, width: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="body-s" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '320px' }}>
          Search
          <input
            style={inputStyle}
            placeholder="name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </label>
      </div>

      {orders.length === 0 && <span className="body-s">No orders match this filter.</span>}

      {orders.map((order) => {
        const orderNumber = `GDLY-${order.id.slice(0, 4).toUpperCase()}`;
        const isExpanded = !!expanded[order.id];
        return (
          <div key={order.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span className="body-s">#{orderNumber}</span>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>{order.name}</strong>
                <span style={badgeStyle(order.status === 'paid' || order.status === 'fulfilled')}>{order.status}</span>
              </div>
              <span className="body-s">{new Date(order.created_at).toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <div className="ui-text" style={{ fontSize: '9px', marginBottom: '8px' }}>Customer Logistics</div>
                <div className="body-s">{order.email}</div>
                {order.phone && <div className="body-s">{order.phone}</div>}
                <div className="body-s">Order placed: {new Date(order.created_at).toLocaleDateString('en-IN')}</div>
              </div>

              <div>
                <div className="ui-text" style={{ fontSize: '9px', marginBottom: '8px' }}>Update State</div>
                <select style={{ ...inputStyle, marginBottom: '12px' }} value={order.status} onChange={(e) => updateStatus(order, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...primaryButtonStyle, fontSize: '10px', padding: '8px 12px' }} onClick={notWiredYet('View Invoice')}>View Invoice</button>
                  <button style={{ ...primaryButtonStyle, fontSize: '10px', padding: '8px 12px' }} onClick={notWiredYet('Send Email')}>Send Email</button>
                  <button style={{ ...primaryButtonStyle, fontSize: '10px', padding: '8px 12px', border: '1px solid #a33', color: '#c66' }} onClick={notWiredYet('Refund')}>Refund</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '32px', borderTop: '1px solid rgba(200, 204, 209, 0.1)', paddingTop: '16px' }}>
              <div>
                <div className="ui-text" style={{ fontSize: '9px' }}>Subtotal</div>
                <div className="body-s" style={{ color: 'var(--bone-white)' }}>{formatPrice(order.subtotal)}</div>
              </div>
              <div>
                <div className="ui-text" style={{ fontSize: '9px' }}>Total</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>{formatPrice(order.total)}</div>
              </div>
            </div>

            <button
              onClick={() => setExpanded({ ...expanded, [order.id]: !isExpanded })}
              className="body-s"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ChevronDownIcon width={12} height={12} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
              Show items ({order.order_items.length})
            </button>

            {isExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.order_items.map((item, i) => (
                  <div key={i} className="body-s" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.product_name} — Size: {item.size} × {item.quantity}</span>
                    <span>{formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalCount={totalCount} pageSize={PAGE_SIZE} />
      {confirmDialog}
    </div>
  );
}
