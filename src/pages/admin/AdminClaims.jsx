import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { inputStyle, cardStyle, primaryButtonStyle } from './adminStyles';
import ProgressBar from './ProgressBar';
import { useToast } from './useToast';
import { CLAIM_KINDS, CLAIM_STATUS } from '../account/claims';

// Support claims raised from the customer account. RLS lets only admins update status and replies.
export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [drafts, setDrafts] = useState({}); // claim id -> { status, admin_reply }
  const [isBusy, setIsBusy] = useState(false);
  const [toastElement, showToast] = useToast();

  const load = useCallback(() => {
    setIsBusy(true);
    let query = supabase
      .from('support_claims')
      .select('*, orders(id, name, created_at)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    query.then(({ data, error }) => {
      setIsBusy(false);
      if (error) {
        showToast(`Claims could not be loaded: ${error.message}`, { danger: true });
        return;
      }
      setClaims(data);
      setDrafts({});
    });
  }, [statusFilter, showToast]);

  useEffect(load, [load]);

  const draftFor = (c) => drafts[c.id] || { status: c.status, admin_reply: c.admin_reply || '' };
  const setDraft = (c, change) => setDrafts((d) => ({ ...d, [c.id]: { ...draftFor(c), ...change } }));

  async function save(c) {
    const draft = draftFor(c);
    setIsBusy(true);
    const { error } = await supabase
      .from('support_claims')
      .update({ status: draft.status, admin_reply: draft.admin_reply.trim() || null })
      .eq('id', c.id);
    setIsBusy(false);
    if (error) {
      showToast(`The claim could not be saved: ${error.message}`, { danger: true });
      return;
    }
    showToast('Claim updated. The customer sees your reply in their account.');
    load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="display-s">Claims</h1>
        <p className="ui-text" style={{ marginTop: '8px' }}>Customer support requests</p>
      </div>

      <ProgressBar active={isBusy} />

      <label className="body-s" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Status
        <select style={{ ...inputStyle, width: '180px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          {Object.entries(CLAIM_STATUS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>

      {!isBusy && claims.length === 0 && <span className="body-s">No claims match this filter.</span>}

      {claims.map((c) => {
        const draft = draftFor(c);
        const changed = draft.status !== c.status || draft.admin_reply !== (c.admin_reply || '');
        return (
          <article key={c.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>{CLAIM_KINDS[c.kind]}</strong>
                <div className="body-s">
                  {c.email || 'Unknown email'}
                  {c.orders && ` · Order GD-${new Date(c.orders.created_at).getFullYear()}-${c.orders.id.slice(0, 6).toUpperCase()} (${c.orders.name})`}
                </div>
              </div>
              <span className="body-s">{new Date(c.created_at).toLocaleString('en-IN')}</span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{c.message}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
              <label className="body-s" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Status
                <select style={inputStyle} value={draft.status} onChange={(e) => setDraft(c, { status: e.target.value })}>
                  {Object.entries(CLAIM_STATUS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="body-s" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Reply to the customer (shown in their account)
                <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} maxLength={2000} value={draft.admin_reply} onChange={(e) => setDraft(c, { admin_reply: e.target.value })} />
              </label>
            </div>
            <div>
              <button type="button" style={{ ...primaryButtonStyle, opacity: changed ? 1 : 0.5 }} disabled={!changed || isBusy} onClick={() => save(c)}>Save</button>
            </div>
          </article>
        );
      })}
      {toastElement}
    </div>
  );
}
