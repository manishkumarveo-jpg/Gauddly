import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Icon, PageHeader, Notice } from './shared';
import { ICONS } from './icons';
import { formatPrice, formatDate, orderRef, firstImageUrl } from './format';
import OrderDetailView from './OrderDetailView';
import { useIsMobile } from '../../lib/useIsMobile';

// The orders table has one status (orders_status_check); payment and progress are both read from it
const PAYMENT = {
  pending: { label: 'Awaiting payment', colour: '#d9a65a' },
  failed: { label: 'Failed', colour: '#d97a7a' },
  paid: { label: 'Paid', colour: '#8fbf8f' },
  fulfilled: { label: 'Paid', colour: '#8fbf8f' },
};
const PROGRESS = {
  pending: { label: 'Pending', colour: '#d9a65a' },
  paid: { label: 'In production', colour: '#a99be0' },
  fulfilled: { label: 'Dispatched', colour: '#7fb2d9' },
  failed: { label: 'Cancelled', colour: '#d97a7a' },
  cancelled: { label: 'Cancelled', colour: '#d97a7a' },
};
const payment = (o) => PAYMENT[o.status] || (o.razorpay_payment_id ? PAYMENT.paid : { label: 'Not paid', colour: 'var(--ash-grey)' });

const TABS = [
  { id: 'all', label: 'All Orders', match: () => true },
  { id: 'pending', label: 'Pending', match: (s) => s === 'pending' },
  { id: 'production', label: 'In production', match: (s) => s === 'paid' },
  { id: 'dispatched', label: 'Dispatched', match: (s) => s === 'fulfilled' },
  { id: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' || s === 'failed' },
];

const SORTS = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  oldest: (a, b) => a.created_at.localeCompare(b.created_at),
  high: (a, b) => b.total - a.total,
  low: (a, b) => a.total - b.total,
};

export default function OrdersView({ user, onRaiseClaim }) {
  const isMobile = useIsMobile(768);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState(() => new Set());
  const [confirmRemove, setConfirmRemove] = useState(null); // order ids awaiting confirmation
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    // Filter by user even though RLS does too: admins can read every order
    supabase
      .from('orders')
      .select('*, order_items(product_name, size, quantity, unit_price, products(product_images(r2_key, sort_order)))')
      .eq('user_id', user.id)
      .eq('hidden_by_customer', false)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setLoadError('Your orders could not be loaded. Please refresh to try again.');
        else setOrders(data);
      });
  }, [user.id]);

  const match = TABS.find((t) => t.id === tab).match;
  const q = query.trim().toLowerCase();
  const shown = orders
    .filter((o) => match(o.status))
    .filter((o) => !q || orderRef(o).toLowerCase().includes(q) || o.order_items.some((i) => i.product_name.toLowerCase().includes(q)))
    .sort(SORTS[sort]);
  const allShownSelected = shown.length > 0 && shown.every((o) => selected.has(o.id));

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const askRemove = (ids) => {
    setRemoveError('');
    setConfirmRemove(ids);
  };

  // Hides orders from this list only; the order itself stays on record (hide_my_orders)
  async function removeOrders() {
    setIsRemoving(true);
    const { error } = await supabase.rpc('hide_my_orders', { order_ids: confirmRemove });
    setIsRemoving(false);
    if (error) {
      setRemoveError('We could not remove those orders. Please try again.');
      return;
    }
    const removed = new Set(confirmRemove);
    setOrders((prev) => prev.filter((o) => !removed.has(o.id)));
    setSelected(new Set());
    setConfirmRemove(null);
  }

  if (isMobile && selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onRaiseClaim={onRaiseClaim}
      />
    );
  }

  return <>
    <PageHeader title="Your Orders" intro="Track your orders and view detailed information."
      aside={<span className="ac-label" style={{ whiteSpace: 'nowrap' }}>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>} />

    <section aria-label="Orders" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="ac-tabs" role="tablist" aria-label="Filter by status">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => { setTab(t.id); setSelected(new Set()); }}>{t.label}</button>
        ))}
      </div>

      <div className="ac-tools">
        <div className="ac-search">
          <Icon>{ICONS.search}</Icon>
          <label htmlFor="ac-search" className="sr-only">Search orders</label>
          <input id="ac-search" type="search" placeholder="Search by order ID or product name…" value={query} onChange={(e) => { setQuery(e.target.value); setSelected(new Set()); }} />
        </div>
        <label htmlFor="ac-sort" className="sr-only">Sort orders</label>
        <select id="ac-sort" className="ac-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Sort: Newest first</option>
          <option value="oldest">Sort: Oldest first</option>
          <option value="high">Sort: Price, high to low</option>
          <option value="low">Sort: Price, low to high</option>
        </select>
      </div>

      {shown.length > 0 && (
        <div className="ac-bulk">
          <label className="ac-check"><input type="checkbox" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map((o) => o.id)))} />Select all</label>
          {selected.size > 0 && <span className="body-s" role="status">{selected.size} selected</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px' }}>
            <button type="button" className="ac-link" disabled={selected.size === 0} onClick={() => askRemove([...selected])}>Remove selected</button>
            <button type="button" className="ac-link" onClick={() => askRemove(shown.map((o) => o.id))}>Remove all{tab !== 'all' || q ? ' shown' : ''}</button>
          </div>
        </div>
      )}

      {confirmRemove && (
        <div className="ac-confirm" role="alertdialog" aria-labelledby="ac-confirm-text">
          <span id="ac-confirm-text">Remove {confirmRemove.length} {confirmRemove.length === 1 ? 'order' : 'orders'} from your list? They stay on record with us, so we can still make and deliver them.</span>
          {removeError && <span role="alert" className="ac-error">{removeError}</span>}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button type="button" className="ac-btn" disabled={isRemoving} onClick={removeOrders} autoFocus>{isRemoving ? 'Removing…' : 'Remove'}</button>
            <button type="button" className="ac-link" onClick={() => setConfirmRemove(null)}>Cancel</button>
          </div>
        </div>
      )}

      {loadError && <p className="ac-error" role="alert">{loadError}</p>}
      {!loadError && (orders.length === 0
        ? <p className="body-s" style={{ fontStyle: 'italic' }}>No orders yet. <Link to="/store" className="underlined-link">Visit the store →</Link></p>
        : shown.length === 0 && <p className="body-s" style={{ fontStyle: 'italic' }}>No orders match.</p>)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {shown.map((order) => {
          const [first, ...rest] = order.order_items;
          const image = first && firstImageUrl(first.products?.product_images);
          const pay = payment(order);
          const progress = PROGRESS[order.status] || { label: order.status, colour: 'var(--ash-grey)' };
          const items = order.order_items.reduce((n, i) => n + i.quantity, 0);
          return (
            <React.Fragment key={order.id}>
              {/* Mobile Order Card (Screen 09) */}
              <div
                className="show-on-mobile"
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--mobile-card-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--mobile-card-border)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedOrder(order)}
              >
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '8px',
                    backgroundColor: '#161616',
                    border: '1px solid var(--mobile-card-border)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    {image ? (
                      <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '11px', color: 'var(--ash-grey)' }}>Relic</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--ash-grey)' }}>#{orderRef(order)}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--bone-white)' }}>{formatPrice(order.total)}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--bone-white)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {first?.product_name}{rest.length > 0 && ` + ${rest.length} more`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ash-grey)', marginTop: '2px' }}>
                      {formatDate(order.created_at)} · {items} {items === 1 ? 'item' : 'items'}{first && ` · Size ${first.size}`}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span className={`pill-status ${order.status === 'paid' || order.status === 'fulfilled' ? 'pill-status--paid' : 'pill-status--pending'}`}>
                        <span className="pill-dot" />
                        {pay.label}
                      </span>
                      <span className="pill-status pill-status--processing">
                        <span className="pill-dot" />
                        {progress.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', fontSize: '12px', color: 'var(--ash-grey)' }}>
                  View details &rarr;
                </div>
              </div>

              {/* Desktop Order Row */}
              <div className={`hide-on-mobile ac-order-row${selected.has(order.id) ? ' is-selected' : ''}`}>
                <label className="ac-row-check">
                  <span className="sr-only">Select order {orderRef(order)}</span>
                  <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggle(order.id)} />
                </label>
                <details className="ac-order">
                  <summary>
                    <div className="ac-thumb">{image && <img src={image} alt="" loading="lazy" decoding="async" />}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="body-s" style={{ fontSize: '14px' }}>Order ID: <span style={{ color: 'var(--bone-white)' }}>{orderRef(order)}</span></div>
                      <div className="body-s" style={{ fontSize: '13px' }}>{formatDate(order.created_at)} · {items} {items === 1 ? 'item' : 'items'}{first && ` · Size ${first.size}`}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '6px 0 0' }}>
                        {first?.product_name}{rest.length > 0 && ` + ${rest.length} more`}
                      </div>
                      <div className="ac-meta">
                        <span>Payment: <span className="ac-dot" style={{ color: pay.colour }}>{pay.label}</span></span>
                        <span>Status: <span className="ac-dot" style={{ color: progress.colour }}>{progress.label}</span></span>
                      </div>
                    </div>
                    <div className="ac-price-col"><div className="ac-price">{formatPrice(order.total)}</div></div>
                    <span className="ac-btn ac-toggle" aria-hidden="true">View details →</span>
                  </summary>
                  <div className="ac-order-body">
                    <div>
                      <div className="ac-label">Items</div>
                      {order.order_items.map((item, i) => (
                        <div key={i} className="ac-line"><span>{item.product_name} — {item.size} × {item.quantity}</span><span>{formatPrice(item.unit_price * item.quantity)}</span></div>
                      ))}
                    </div>
                    <div>
                      <div className="ac-label">Ships to</div>
                      <div className="body-s">{order.name}<br />{order.address}<br />{[order.city, order.state, order.pincode].filter(Boolean).join(', ')}</div>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <button type="button" className="ac-link" onClick={() => onRaiseClaim(order.id)}>Raise a claim</button>
                        <button type="button" className="ac-link" onClick={() => askRemove([order.id])}>Remove this order</button>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>

    <Notice icon="headset" title="Need help with an order?" text="Raise a claim from the order, or write to us with your order ID."
      action={<Link to="/contact" className="underlined-link" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Contact support →</Link>} />
  </>;
}
