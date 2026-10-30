import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { INDIAN_STATES } from '../../lib/india';
import { Icon, PageHeader, Notice } from './shared';
import { ICONS } from './icons';

const EMPTY = { label: 'home', phone: '', house: '', street: '', landmark: '', city: '', state: '', pincode: '' };
const LABELS = { home: 'Home', work: 'Work', other: 'Other' };
const LABEL_ICON = { home: 'home', work: 'work', other: 'pin' };

const formatPhone = (p) => (p ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : '');

export default function ProfileView({ user, fullName, onNameSaved }) {
  const [addresses, setAddresses] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [addressForm, setAddressForm] = useState(null); // null, or the address being added/edited
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const phone = user.user_metadata?.phone || '';

  const load = useCallback(() => supabase
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at')
    .then(({ data, error: e }) => {
      if (e) setLoadError('Saved addresses could not be loaded.');
      else setAddresses(data);
    }), []);

  useEffect(() => { load(); }, [load]);

  async function run(action) {
    setBusy(true);
    setError('');
    const { error: e } = await action();
    setBusy(false);
    if (e) {
      setError(e.message?.includes('row-level security') ? 'You can save up to 10 addresses.' : 'We could not save that. Please try again.');
      return false;
    }
    return true;
  }

  async function saveName(event) {
    event.preventDefault();
    const name = draftName.trim();
    if (await run(() => supabase.from('profiles').update({ full_name: name }).eq('id', user.id))) {
      onNameSaved(name);
      setEditingName(false);
    }
  }

  async function savePhone(event) {
    event.preventDefault();
    if (await run(() => supabase.auth.updateUser({ data: { phone: draftPhone } }))) setEditingPhone(false);
  }

  async function saveAddress(event) {
    event.preventDefault();
    const { id, user_id: _owner, created_at: _created, ...fields } = addressForm;
    const row = { ...fields, phone: fields.phone || null, landmark: fields.landmark || null };
    if (!id) row.is_default = addresses.length === 0;
    const ok = await run(() => (id
      ? supabase.from('addresses').update(row).eq('id', id)
      : supabase.from('addresses').insert(row)));
    if (ok) {
      setAddressForm(null);
      load();
    }
  }

  async function makeDefault(id) {
    if (await run(() => supabase.rpc('set_default_address', { address_id: id }))) load();
  }

  async function remove(address) {
    if (!(await run(() => supabase.from('addresses').delete().eq('id', address.id)))) return;
    const rest = addresses.filter((a) => a.id !== address.id);
    // Keep a default whenever any address is left
    if (address.is_default && rest.length) await supabase.rpc('set_default_address', { address_id: rest[0].id });
    load();
  }

  const fillFromPincode = async (pin) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const office = (await res.json())?.[0]?.PostOffice?.[0];
      if (office) setAddressForm((f) => ({ ...f, city: f.city || office.District, state: office.State }));
    } catch {
      // the buyer types city and state themselves
    }
  };

  const field = (key, label, props = {}) => (
    <div className="ac-field">
      <label htmlFor={`addr-${key}`}>{label}</label>
      <input
        id={`addr-${key}`}
        className="ac-input"
        value={addressForm[key] ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          setAddressForm((f) => ({ ...f, [key]: value }));
          if (key === 'pincode' && /^\d{6}$/.test(value)) fillFromPincode(value);
        }}
        {...props}
      />
    </div>
  );

  return <>
    <PageHeader title="Your Account" intro="Manage your details, addresses and preferences." />

    <section className="ac-card" aria-labelledby="ac-personal">
      <div className="ac-card-head"><h2 id="ac-personal" className="ac-h2">Personal information</h2></div>
      <div className="ac-rows">
        <div>
          {editingName ? (
            <form onSubmit={saveName} className="ac-edit" style={{ flex: 1 }}>
              <div className="ac-field"><label htmlFor="ac-name">Full name</label><input id="ac-name" className="ac-input" required autoComplete="name" value={draftName} onChange={(e) => setDraftName(e.target.value)} /></div>
              <div className="ac-edit-actions"><button className="ac-btn" disabled={busy}>Save</button><button type="button" className="ac-link" onClick={() => setEditingName(false)}>Cancel</button></div>
            </form>
          ) : <>
            <div><div className="ac-label">Full name</div>{fullName || <em className="ac-muted">Not set</em>}</div>
            <button type="button" className="ac-link" onClick={() => { setDraftName(fullName); setEditingName(true); }}>Edit</button>
          </>}
        </div>
        <div>
          <div style={{ minWidth: 0 }}><div className="ac-label">Email address</div><div className="ac-ellipsis">{user.email}</div></div>
          {user.email_confirmed_at
            ? <span className="ac-badge ac-badge--ok">✓ Verified</span>
            : <span className="ac-badge">Not verified</span>}
        </div>
        <div>
          {editingPhone ? (
            <form onSubmit={savePhone} className="ac-edit" style={{ flex: 1 }}>
              <div className="ac-field"><label htmlFor="ac-phone">Mobile number (10 digits)</label><input id="ac-phone" className="ac-input" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} required autoComplete="tel-national" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} /></div>
              <div className="ac-edit-actions"><button className="ac-btn" disabled={busy}>Save</button><button type="button" className="ac-link" onClick={() => setEditingPhone(false)}>Cancel</button></div>
            </form>
          ) : <>
            <div><div className="ac-label">Mobile number</div>{formatPhone(phone) || <em className="ac-muted">Not set</em>}</div>
            <button type="button" className="ac-link" onClick={() => { setDraftPhone(phone); setEditingPhone(true); }}>{phone ? 'Edit' : 'Add'}</button>
          </>}
        </div>
      </div>
    </section>

    <section aria-labelledby="ac-addresses" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="ac-card-head">
        <h2 id="ac-addresses" className="ac-h2">Saved addresses</h2>
        {!addressForm && addresses.length < 10 && (
          <button type="button" className="ac-btn ac-icon-link" onClick={() => { setError(''); setAddressForm({ ...EMPTY, phone }); }}>
            <Icon size={16}>{ICONS.plus}</Icon>Add new address
          </button>
        )}
      </div>

      {error && <p className="ac-error" role="alert">{error}</p>}
      {loadError && <p className="ac-error" role="alert">{loadError}</p>}

      {addressForm && (
        <form className="ac-card ac-edit" onSubmit={saveAddress} aria-label={addressForm.id ? 'Edit address' : 'New address'}>
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', gap: '24px' }}>
            <legend className="ac-label" style={{ float: 'left', marginRight: '12px' }}>Type</legend>
            {Object.entries(LABELS).map(([value, text]) => (
              <label key={value} className="ac-check"><input type="radio" name="label" value={value} checked={addressForm.label === value} onChange={() => setAddressForm((f) => ({ ...f, label: value }))} />{text}</label>
            ))}
          </fieldset>
          <div className="ac-pair">
            {field('house', 'House / Flat / Building', { required: true, autoComplete: 'address-line1', maxLength: 200 })}
            {field('street', 'Street / Locality', { required: true, autoComplete: 'address-line2', maxLength: 200 })}
          </div>
          {field('landmark', 'Landmark (optional)', { maxLength: 200 })}
          <div className="ac-pair">
            {field('pincode', 'PIN code', { required: true, inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6, autoComplete: 'postal-code' })}
            {field('city', 'City', { required: true, autoComplete: 'address-level2', maxLength: 100 })}
          </div>
          <div className="ac-pair">
            <div className="ac-field">
              <label htmlFor="addr-state">State</label>
              <select id="addr-state" className="ac-input ac-select-input" required value={addressForm.state} onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}>
                <option value="" disabled>Select</option>
                {(addressForm.state && !INDIAN_STATES.includes(addressForm.state) ? [addressForm.state, ...INDIAN_STATES] : INDIAN_STATES).map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            {field('phone', 'Mobile for delivery (optional)', { type: 'tel', inputMode: 'numeric', pattern: '[6-9][0-9]{9}', maxLength: 10 })}
          </div>
          <div className="ac-edit-actions">
            <button className="ac-primary" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
            <button type="button" className="ac-link" onClick={() => setAddressForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      {!loadError && addresses.length === 0 && !addressForm && (
        <p className="body-s" style={{ fontStyle: 'italic' }}>No saved addresses yet. Add one here, or tick &ldquo;Save this address&rdquo; at checkout.</p>
      )}

      {addresses.map((a) => (
        <div key={a.id} className="ac-card ac-address">
          <Icon size={28}>{ICONS[LABEL_ICON[a.label]]}</Icon>
          <div className="ac-address-body">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '19px', color: 'var(--bone-white)', marginBottom: '6px' }}>
              {LABELS[a.label]}{a.is_default && <span className="ac-tag">Default</span>}
            </div>
            {a.house}, {a.street}{a.landmark && `, near ${a.landmark}`}<br />
            {a.city}, {a.state} - {a.pincode}, India
            {a.phone && <><br />{formatPhone(a.phone)}</>}
          </div>
          <div className="ac-address-actions">
            {!a.is_default && <button type="button" className="ac-link" disabled={busy} onClick={() => makeDefault(a.id)}>Make default</button>}
            <button type="button" className="ac-link" onClick={() => { setError(''); setAddressForm({ ...EMPTY, ...a, phone: a.phone || '', landmark: a.landmark || '' }); }}>Edit</button>
            <button type="button" className="ac-link ac-icon-link" disabled={busy} onClick={() => remove(a)}><Icon size={14}>{ICONS.trash}</Icon>Delete</button>
          </div>
        </div>
      ))}
    </section>

    <Notice icon="lock" title="Secure & Private" text="Payments are handled by Razorpay. We never see or store your card details."
      action={<Link to="/privacy" className="underlined-link" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>View our Privacy Policy →</Link>} />
  </>;
}
