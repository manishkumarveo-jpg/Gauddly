import React, { useState, useContext, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/app-context';
import { supabase, edgeFunctionErrorMessage } from '../lib/supabase';
import { INDIAN_STATES as STATES } from '../lib/india';

// Columns shared by the checkout form and the addresses table; the name lives in profiles.full_name
const ADDRESS_FIELDS = ['phone', 'pincode', 'house', 'street', 'landmark', 'city', 'state'];
const LABELS = { home: 'Home', work: 'Work', other: 'Other' };

const fromAddress = (a) => ({
  house: a.house, street: a.street, landmark: a.landmark || '', pincode: a.pincode, city: a.city, state: a.state,
});

let razorpayScript;
function loadRazorpay() {
  razorpayScript ??= new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => { razorpayScript = null; resolve(false); };
    document.body.appendChild(s);
  });
  return razorpayScript;
}

const Icon = ({ children }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export default function Checkout() {
  const { cart, clearCart, session, sessionLoaded, user, setIsCartOpen } = useContext(AppContext);
  const [form, setForm] = useState({
    email: '', phone: '', name: '', pincode: '', house: '', street: '', landmark: '', city: '', state: '',
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState(''); // '' = a new address typed into the form
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, email: f.email || user.email || '' }));
    Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('addresses').select('*').order('is_default', { ascending: false }).order('created_at'),
    ]).then(([{ data: profile }, { data: saved }]) => {
      const list = saved || [];
      setAddresses(list);
      if (list[0]) setAddressId(list[0].id);
      setForm((f) => ({
        ...f,
        ...(list[0] ? fromAddress(list[0]) : {}),
        name: f.name || profile?.full_name || user.user_metadata?.full_name || '',
        phone: f.phone || list[0]?.phone || user.user_metadata?.phone || '',
      }));
    });
  }, [user]);

  if (sessionLoaded && !session) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

  function pickAddress(id) {
    setAddressId(id);
    const chosen = addresses.find((a) => a.id === id);
    setForm((f) => (chosen
      ? { ...f, ...fromAddress(chosen), phone: chosen.phone || f.phone }
      : { ...f, house: '', street: '', landmark: '', pincode: '', city: '', state: '' }));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'pincode' && /^\d{6}$/.test(value)) fillFromPincode(value);
  };

  // City and state from India Post; best effort, the fields stay editable if it fails
  const fillFromPincode = async (pin) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const office = (await res.json())?.[0]?.PostOffice?.[0];
      if (office) setForm((f) => ({ ...f, city: office.District, state: office.State }));
    } catch {
      // ignore: the buyer types city and state themselves
    }
  };

  // Best effort after payment: a failed save must not hide a successful claim
  const rememberAddress = async () => {
    if (!saveAddress || addressId) return;
    const row = Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, form[k] || null]));
    const { error: saveError } = await supabase
      .from('addresses')
      .insert({ ...row, label: 'home', is_default: addresses.length === 0 });
    if (saveError) console.warn('Could not save the address', saveError.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setError('');
    setIsProcessing(true);

    const { data, error: invokeError } = await supabase.functions.invoke('create-order', {
      body: {
        items: cart.map((item) => ({ productId: item.id, size: item.size, quantity: item.quantity })),
        shipping: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          pincode: form.pincode,
          address: [form.house, form.street, form.landmark && `Near ${form.landmark}`].filter(Boolean).join(', '),
          city: form.city,
          state: form.state,
        },
      },
    });

    if (invokeError) {
      setIsProcessing(false);
      setError(await edgeFunctionErrorMessage(invokeError));
      return;
    }

    if (!data?.razorpayOrderId || !(await loadRazorpay())) {
      setIsProcessing(false);
      setError('Payment could not load. Check your connection and try again.');
      return;
    }

    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.razorpayOrderId,
      amount: data.amount,
      currency: 'INR',
      name: 'Gauddly',
      prefill: { name: form.name, email: form.email, contact: form.phone },
      handler: async (resp) => {
        const { error: verifyError } = await supabase.functions.invoke('verify-payment', { body: resp });
        setIsProcessing(false);
        if (verifyError) {
          setError(await edgeFunctionErrorMessage(verifyError));
          return;
        }
        rememberAddress();
        setOrderId(data.orderId);
        setIsCompleted(true);
        clearCart(); // Clear cart items silently
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          setError('Payment was cancelled. Your cart is still here.');
        },
      },
    });
    rzp.on('payment.failed', (resp) => {
      setError(resp.error?.description || 'Payment failed. Please try again.');
    });
    rzp.open();
  };

  // A plain function, not a component, so inputs keep focus across renders
  const field = (name, label, props = {}, hint) => (
    <div className="co-field">
      <label htmlFor={`checkout-${name}`}>{label}</label>
      <input
        id={`checkout-${name}`}
        type="text"
        name={name}
        required
        value={form[name]}
        onChange={handleChange}
        className="co-input"
        {...props}
      />
      {hint && <span className="co-hint">{hint}</span>}
    </div>
  );

  const formatPrice = (p) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(p);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const step = isProcessing ? 3 : 1;
  const stateOptions = form.state && !STATES.includes(form.state) ? [form.state, ...STATES] : STATES;

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '120px', paddingBottom: '160px' }} className="fade-in">
      <div className="grid-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Checkout Main Column */}
        <div style={{ gridColumn: isCompleted ? '1 / -1' : 'span 7' }} className="checkout-main">
          {!isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div>
                <h1 className="display-s" style={{ fontSize: '40px', marginBottom: '8px' }}>
                  The Crossing
                </h1>
                <p className="body-l" style={{ fontStyle: 'italic' }}>
                  Your claim, almost complete.
                </p>
              </div>

              <ol className="co-steps" aria-label="Checkout steps">
                {['Details', 'Delivery', 'Payment'].map((label, i) => (
                  <li key={label} className={i + 1 === step ? 'is-active' : ''} aria-current={i + 1 === step ? 'step' : undefined}>
                    <span className="co-step-label"><span>0{i + 1}</span>{label}</span>
                  </li>
                ))}
              </ol>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div className="co-section">Contact</div>
                <div className="co-row">
                  {field('email', 'Email address', { type: 'email', autoComplete: 'email' })}
                  <div className="co-field">
                    <label htmlFor="checkout-phone">Mobile number</label>
                    <div className="co-phone">
                      <span aria-hidden="true">+91</span>
                      <input
                        id="checkout-phone"
                        type="tel"
                        name="phone"
                        required
                        autoComplete="tel-national"
                        inputMode="numeric"
                        pattern="[6-9][0-9]{9}"
                        maxLength={10}
                        title="10-digit mobile number"
                        value={form.phone}
                        onChange={handleChange}
                        className="co-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="co-section">Delivery address</div>
                {addresses.length > 0 && (
                  <div className="co-field">
                    <label htmlFor="checkout-saved">Saved address</label>
                    <select id="checkout-saved" className="co-input" value={addressId} onChange={(e) => pickAddress(e.target.value)}>
                      {addresses.map((a) => <option key={a.id} value={a.id}>{LABELS[a.label]}{a.is_default ? ' (default)' : ''} — {a.house}, {a.city}</option>)}
                      <option value="">Use a new address</option>
                    </select>
                  </div>
                )}
                <div className="co-row co-row--wide">
                  {field('name', 'Full name', { autoComplete: 'name' })}
                  {field('pincode', 'PIN code', { autoComplete: 'postal-code', inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6, title: '6-digit PIN code' }, 'Enter 6 digit PIN code')}
                </div>
                <div className="co-row">
                  {field('house', 'House / Flat / Building', { autoComplete: 'address-line1' })}
                  {field('street', 'Street / Locality', { autoComplete: 'address-line2' })}
                </div>
                {field('landmark', 'Landmark (optional)', { required: false })}
                <div className="co-row co-row--three">
                  {field('city', 'City', { autoComplete: 'address-level2' })}
                  <div className="co-field">
                    <label htmlFor="checkout-state">State</label>
                    <select id="checkout-state" name="state" required autoComplete="address-level1" value={form.state} onChange={handleChange} className="co-input">
                      <option value="" disabled>Select</option>
                      {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="co-field">
                    <label htmlFor="checkout-country">Country</label>
                    <select id="checkout-country" disabled className="co-input" value="India">
                      <option>India</option>
                    </select>
                  </div>
                </div>

                {!addressId && (
                  <label className="co-check">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                    Save this address for future claims
                  </label>
                )}

                <div className="co-note">
                  <Icon><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></Icon>
                  <div>
                    <div>Estimated dispatch: 14–21 days</div>
                    <div className="body-s" style={{ fontSize: '13px' }}>Every piece is made to order. Tracking follows by email.</div>
                  </div>
                </div>

                {error && (
                  <span role="alert" className="body-s" style={{ color: 'var(--bone-white)' }}>{error}</span>
                )}

                <button type="submit" disabled={isProcessing || cart.length === 0} className="co-submit">
                  {isProcessing ? 'Crossing…' : 'Continue to payment →'}
                </button>

                <div className="co-foot">
                  <button type="button" onClick={() => setIsCartOpen(true)} className="underlined-link">← Back to claims</button>
                  <p className="body-s" style={{ fontSize: '12px' }}>
                    By continuing, you agree to the <Link to="/terms" className="underlined-link">Terms of Service</Link> and acknowledge the <Link to="/returns" className="underlined-link">Made-to-Order Policy</Link> and <Link to="/privacy" className="underlined-link">Privacy Policy</Link>.
                  </p>
                </div>
              </form>
            </div>
          ) : (
            // POST-PURCHASE CONFIRMATION SCREEN (Section 12.2)
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', textAlign: 'center', minHeight: '50vh', justifyContent: 'center' }}>
              <h2 className="display-s" style={{ fontSize: '40px' }}>
                Your claim has been received.
              </h2>
              <p className="body-l" style={{ fontStyle: 'italic', maxWidth: '480px' }}>
                Your garment will be made. You will be told when it departs.
              </p>
              {orderId && (
                <span className="body-s" style={{ color: 'var(--ash-grey)' }}>Claim #{orderId.slice(0, 8)}</span>
              )}
              <div style={{ marginTop: '40px' }}>
                <button
                  onClick={() => navigate('/home')}
                  className="underlined-link silver-hover"
                  style={{ background: 'none', border: 'none', color: 'var(--bone-white)', fontFamily: 'var(--font-display)', fontSize: '20px', cursor: 'pointer' }}
                >
                  Return to Home →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary (Visible during checkout only) */}
        {!isCompleted && (
          <aside style={{ gridColumn: 'span 5', paddingLeft: '48px', borderLeft: '1px solid rgba(200, 204, 209, 0.15)' }} className="checkout-summary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <h2 className="ui-text" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>Order summary</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '24px', borderBottom: '1px solid rgba(200, 204, 209, 0.15)' }}>
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '80px', height: '96px', objectFit: 'cover', border: '1px solid rgba(200, 204, 209, 0.1)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--bone-white)', fontWeight: 400 }}>
                        {item.name}
                      </h3>
                      <span className="body-s" style={{ fontSize: '13px' }}>
                        Size: {item.size} × {item.quantity}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', whiteSpace: 'nowrap' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="co-sum-rows">
                <div><span>Subtotal</span><span>{formatPrice(total)}</span></div>
                <div><span>Shipping</span><span>Included</span></div>
              </div>

              <div style={{ borderTop: '1px solid rgba(200, 204, 209, 0.15)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--bone-white)' }}>
                  {formatPrice(total)}
                </span>
              </div>

              <div className="body-s" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>Made to order in Delhi.</span>
                <span>Expected dispatch: 14–21 days.</span>
                <span>Order support: <a href="mailto:contact@gauddly.com" className="underlined-link">contact@gauddly.com</a></span>
              </div>

              <ul className="co-trust">
                <li>
                  <Icon><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /><path d="M12 15v2" /></Icon>
                  Secure payment
                </li>
                <li>
                  <Icon><path d="M7 4h10M7 20h10M8 4v16M16 4v16M8 8h8M8 12h8M8 16h8" /></Icon>
                  Made to order
                </li>
                <li>
                  <Icon><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1" /><rect x="17" y="14" width="4" height="6" rx="1" /></Icon>
                  <span>Support:<br /><a href="mailto:contact@gauddly.com">contact@gauddly.com</a></span>
                </li>
              </ul>
            </div>
          </aside>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .checkout-main, .checkout-summary { min-width: 0; }
        .co-steps { list-style: none; display: flex; align-items: center; gap: 16px; margin: 0; padding: 0; width: 100%; }
        .co-steps li { display: flex; align-items: center; gap: 16px; font-family: var(--font-body); font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ash-grey); white-space: nowrap; }
        .co-steps li:not(:last-child) { flex: 1; }
        .co-steps li:not(:last-child)::after { content: ''; flex: 1; min-width: 16px; height: 1px; background: rgba(200, 204, 209, 0.25); }
        .co-step-label { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid transparent; }
        .co-steps li.is-active { color: var(--bone-white); }
        .co-steps li.is-active .co-step-label { border-bottom-color: var(--bone-white); }
        .co-section { display: flex; align-items: center; gap: 12px; font-family: var(--font-body); font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ash-grey); }
        .co-section::after { content: ''; flex: 1; height: 1px; background: rgba(200, 204, 209, 0.15); }
        .co-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .co-row--wide { grid-template-columns: 1.4fr 1fr; }
        .co-row--three { grid-template-columns: 1fr 1fr 1fr; }
        .co-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .co-field label { font-family: var(--font-body); font-size: 14px; color: var(--ash-grey); }
        .co-input { background: none; border: none; border-bottom: 1px solid var(--cold-silver); color: var(--bone-white); font-family: var(--font-body); font-size: 18px; padding: 6px 0; outline: none; width: 100%; border-radius: 0; }
        .co-input:focus-visible { border-bottom-color: var(--bone-white); }
        select.co-input { appearance: none; cursor: pointer; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c8ccd1' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 4px center; padding-right: 24px; }
        select.co-input:disabled { cursor: default; opacity: 1; }
        select.co-input option { background: var(--void-black); color: var(--bone-white); }
        .co-hint { font-size: 12px; color: var(--ash-grey); }
        .co-phone { display: flex; align-items: baseline; gap: 8px; border-bottom: 1px solid var(--cold-silver); }
        .co-phone span { font-size: 18px; color: var(--bone-white); }
        .co-phone .co-input { border-bottom: none; }
        .co-check { display: flex; align-items: center; gap: 14px; font-size: 15px; cursor: pointer; }
        .co-check input { width: 18px; height: 18px; accent-color: var(--bone-white); }
        .co-note { display: flex; align-items: center; gap: 24px; padding: 20px 24px; border: 1px solid rgba(200, 204, 209, 0.25); }
        .co-submit { width: 100%; padding: 18px; background: var(--bone-white); color: var(--void-black); border: none; font-family: var(--font-display); font-size: 20px; cursor: pointer; transition: opacity 0.2s; }
        .co-submit:hover:not(:disabled) { opacity: 0.88; }
        .co-submit:disabled { opacity: 0.5; cursor: default; }
        .co-foot { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; }
        .co-foot button { background: none; border: none; color: var(--bone-white); font-family: var(--font-body); font-size: 15px; cursor: pointer; padding: 0; white-space: nowrap; }
        .co-sum-rows { display: flex; flex-direction: column; gap: 14px; font-size: 16px; }
        .co-sum-rows div { display: flex; justify-content: space-between; }
        .co-trust { list-style: none; margin: 0; padding: 24px 0 0; border-top: 1px solid rgba(200, 204, 209, 0.15); display: grid; grid-template-columns: repeat(3, 1fr); font-size: 14px; }
        .co-trust li { display: flex; flex-direction: column; gap: 14px; padding: 0 16px; }
        .co-trust li:first-child { padding-left: 0; }
        .co-trust li + li { border-left: 1px solid rgba(200, 204, 209, 0.15); }
        .co-trust a { color: var(--bone-white); word-break: break-all; }
        @media (max-width: 640px) {
          .co-row, .co-row--wide, .co-row--three { grid-template-columns: 1fr; gap: 28px; }
          .co-steps, .co-steps li { gap: 8px; }
          .co-steps li { font-size: 10px; letter-spacing: 0.1em; }
          .co-foot { flex-direction: column; }
        }
        @media (max-width: 900px) {
          .checkout-main {
            grid-column: 1 / -1 !important;
          }
          .checkout-summary {
            grid-column: 1 / -1 !important;
            padding-left: 0 !important;
            border-left: none !important;
            border-top: 1px solid rgba(200, 204, 209, 0.15) !important;
            padding-top: 40px !important;
            margin-top: 40px !important;
          }
        }
      `}} />
    </div>
  );
}
