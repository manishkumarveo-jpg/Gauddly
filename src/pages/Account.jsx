import React, { useContext, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/app-context';
import { supabase } from '../lib/supabase';

const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

export default function Account() {
  const { session, user, sessionLoaded, isAdmin, signOut } = useContext(AppContext);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState({ address: '', city: '', state: '', pincode: '', phone: '' });
  const [orders, setOrders] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, default_address')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || '');
          setAddress({ address: '', city: '', state: '', pincode: '', phone: '', ...(data.default_address || {}) });
        }
      });

    supabase
      .from('orders')
      .select('id, status, total, created_at, order_items(product_name, size, unit_price, quantity)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [user]);

  if (sessionLoaded && !session) {
    return <Navigate to="/login?redirect=/account" replace />;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    await supabase.from('profiles').update({ full_name: fullName, default_address: address }).eq('id', user.id);
    setIsSaving(false);
    setSaved(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/home');
  };

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '120px', paddingBottom: '160px' }} className="fade-in">
      <div className="grid-container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '80px' }}>

        {/* Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 className="display-s" style={{ fontSize: '32px' }}>Your account</h1>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'baseline' }}>
              {isAdmin && (
                <Link to="/admin" className="underlined-link silver-hover" style={{ color: 'var(--bone-white)', fontSize: '14px' }}>
                  Admin dashboard →
                </Link>
              )}
              <button onClick={handleSignOut} className="underlined-link silver-hover" style={{ background: 'none', border: 'none', color: 'var(--ash-grey)', fontSize: '14px', cursor: 'pointer' }}>
                Sign out →
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
            <div className="ui-text" style={{ fontSize: '10px', borderBottom: '1px solid rgba(200, 204, 209, 0.15)', paddingBottom: '6px' }}>
              Identity & Default Address
            </div>
            <input type="text" placeholder="full name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} className="silver-hover system-cursor-override" />
            <input type="text" placeholder="shipping address" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} style={inputStyle} className="silver-hover system-cursor-override" />
            <input type="text" placeholder="city, state, pin" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} style={inputStyle} className="silver-hover system-cursor-override" />
            <input type="text" placeholder="phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} style={inputStyle} className="silver-hover system-cursor-override" />

            <button
              type="submit"
              disabled={isSaving}
              className="underlined-link silver-hover"
              style={{ background: 'none', border: 'none', color: 'var(--bone-white)', fontFamily: 'var(--font-display)', fontSize: '20px', cursor: 'pointer', width: 'fit-content', marginTop: '8px' }}
            >
              {isSaving ? 'Saving...' : saved ? 'Saved ✓' : 'Save →'}
            </button>
          </form>
        </div>

        {/* Order history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="ui-text" style={{ fontSize: '10px', borderBottom: '1px solid rgba(200, 204, 209, 0.15)', paddingBottom: '6px' }}>
            Order History
          </div>

          {orders.length === 0 && (
            <p className="body-s" style={{ color: 'var(--ash-grey)', fontStyle: 'italic' }}>No claims yet.</p>
          )}

          {orders.map((order) => (
            <div key={order.id} style={{ border: '1px solid rgba(200, 204, 209, 0.15)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="body-s" style={{ color: 'var(--ash-grey)' }}>
                  {new Date(order.created_at).toLocaleDateString()} — {order.status}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>{formatPrice(order.total)}</span>
              </div>
              {order.order_items.map((item, i) => (
                <div key={i} className="body-s" style={{ color: 'var(--ash-grey)' }}>
                  {item.product_name} — Size: {item.size} × {item.quantity}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        input::placeholder {
          color: var(--ash-grey) !important;
          opacity: 0.5;
          font-style: italic;
        }
      `}} />
    </div>
  );
}

const inputStyle = {
  background: 'none',
  border: 'none',
  borderBottom: '1px solid var(--cold-silver)',
  color: 'var(--bone-white)',
  fontFamily: 'var(--font-body)',
  fontSize: '18px',
  padding: '6px 0',
  outline: 'none',
};
