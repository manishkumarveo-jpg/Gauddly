import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon, PageHeader } from './shared';
import { ICONS } from './icons';
import { formatDate, orderRef } from './format';
import { CLAIM_KINDS, CLAIM_STATUS } from './claims';

const TABS = [['all', 'All Claims'], ['open', 'Open'], ['in_progress', 'In progress'], ['resolved', 'Resolved'], ['cancelled', 'Cancelled']];

export default function ClaimsView({ user, preselectedOrder }) {
  const [claims, setClaims] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState(preselectedOrder ? { order_id: preselectedOrder, kind: 'return', message: '' } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => supabase
    .from('support_claims')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .then(({ data, error: e }) => {
      if (e) setLoadError('Your claims could not be loaded. Please refresh to try again.');
      else setClaims(data);
    }), [user.id]);

  useEffect(() => {
    load();
    supabase
      .from('orders')
      .select('id, created_at, order_items(product_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [user.id, load]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const { error: e } = await supabase.from('support_claims').insert({
      order_id: form.order_id || null,
      kind: form.kind,
      message: form.message.trim(),
    });
    setBusy(false);
    if (e) {
      setError(e.message?.includes('row-level security')
        ? 'You already have 5 open claims. We’ll reply to those first.'
        : 'We could not send your claim. Please try again.');
      return;
    }
    setForm(null);
    load();
  }

  const orderLabel = (id) => {
    const o = orders.find((x) => x.id === id);
    return o ? `${orderRef(o)} · ${o.order_items[0]?.product_name || 'Order'}` : 'Order';
  };
  const shown = tab === 'all' ? claims : claims.filter((c) => c.status === tab);

  return <>
    <PageHeader title="Your Claims" intro="Raise and track requests about your orders."
      aside={!form && claims.length > 0 && <button type="button" className="ac-primary" onClick={() => setForm({ order_id: '', kind: 'return', message: '' })}>Create a claim →</button>} />

    {form && (
      <form className="ac-card ac-edit" onSubmit={submit} aria-labelledby="ac-new-claim">
        <h2 id="ac-new-claim" className="ac-h2">New claim</h2>
        <div className="ac-pair">
          <div className="ac-field">
            <label htmlFor="claim-order">Order</label>
            <select id="claim-order" className="ac-input ac-select-input" value={form.order_id} onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value }))}>
              <option value="">Not about a specific order</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{orderRef(o)} · {o.order_items[0]?.product_name || 'Order'}</option>)}
            </select>
          </div>
          <div className="ac-field">
            <label htmlFor="claim-kind">What is it about?</label>
            <select id="claim-kind" className="ac-input ac-select-input" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
              {Object.entries(CLAIM_KINDS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="ac-field">
          <label htmlFor="claim-message">Tell us what happened</label>
          <textarea id="claim-message" className="ac-input ac-textarea" required minLength={10} maxLength={2000} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} aria-describedby="claim-message-hint" />
          <span id="claim-message-hint" className="ac-note">At least 10 characters. Include sizes or photos you can email us if useful.</span>
        </div>
        {error && <p className="ac-error" role="alert">{error}</p>}
        <div className="ac-edit-actions">
          <button className="ac-primary" disabled={busy}>{busy ? 'Sending…' : 'Send claim →'}</button>
          <button type="button" className="ac-link" onClick={() => setForm(null)}>Cancel</button>
        </div>
      </form>
    )}

    <div className="ac-tabs" role="tablist" aria-label="Filter claims">
      {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>)}
    </div>

    {loadError && <p className="ac-error" role="alert">{loadError}</p>}

    {!loadError && shown.length === 0 && (
      <div className="ac-empty">
        <div className="ac-round"><Icon size={28}>{ICONS.doc}</Icon></div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>{claims.length === 0 ? 'No claims yet' : 'No claims here'}</div>
        <p className="body-s">{claims.length === 0 ? 'You don’t have any claim requests at the moment.' : 'Nothing in this group.'}</p>
        {!form && claims.length === 0 && <button type="button" className="ac-primary" onClick={() => setForm({ order_id: '', kind: 'return', message: '' })}>Create a claim →</button>}
      </div>
    )}

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {shown.map((c) => {
        const status = CLAIM_STATUS[c.status];
        return (
          <article key={c.id} className="ac-card">
            <div className="ac-card-head">
              <div>
                <div className="body-s" style={{ fontSize: '13px' }}>{formatDate(c.created_at)}{c.order_id && ` · ${orderLabel(c.order_id)}`}</div>
                <h3 className="ac-h2" style={{ fontSize: '19px', marginTop: '4px' }}>{CLAIM_KINDS[c.kind]}</h3>
              </div>
              <span className="ac-pill" style={{ color: status.colour, borderColor: status.colour }}>{status.label}</span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', color: '#d4cfc7', lineHeight: 1.6 }}>{c.message}</p>
            {c.admin_reply && (
              <div className="ac-reply">
                <div className="ac-label">Reply from Gauddly</div>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{c.admin_reply}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  </>;
}
