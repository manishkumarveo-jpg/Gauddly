import React, { useState, useContext, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { supabase, edgeFunctionErrorMessage } from '../lib/supabase';

export default function Checkout() {
  const { cart, clearCart, session, sessionLoaded, user } = useContext(AppContext);
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: f.email || user.email }));
  }, [user]);

  if (sessionLoaded && !session) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setError('');
    setIsProcessing(true);

    const { data, error: invokeError } = await supabase.functions.invoke('create-order', {
      body: {
        items: cart.map((item) => ({ productId: item.id, size: item.size, quantity: item.quantity })),
        shipping: form,
      },
    });

    setIsProcessing(false);

    if (invokeError) {
      setError(await edgeFunctionErrorMessage(invokeError));
      return;
    }

    setOrderId(data.orderId);
    setIsCompleted(true);
    clearCart(); // Clear cart items silently
  };

  const formatPrice = (p) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(p);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '120px', paddingBottom: '160px' }} className="fade-in">
      <div className="grid-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Checkout Main Column */}
        <div style={{ gridColumn: isCompleted ? '1 / -1' : 'span 7' }} className="checkout-main">
          {!isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div>
                <h1 className="display-s" style={{ fontSize: '32px', marginBottom: '8px' }}>
                  The Crossing
                </h1>
                <p className="body-s" style={{ color: 'var(--ash-grey)', fontStyle: 'italic' }}>
                  Claim your artifacts from the Sanctum.
                </p>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Section: Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="ui-text" style={{ fontSize: '10px', borderBottom: '1px solid rgba(200, 204, 209, 0.15)', paddingBottom: '6px' }}>
                    Identity & Location
                  </div>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    placeholder="full name"
                    value={form.name} 
                    onChange={handleChange}
                    style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--cold-silver)', color: 'var(--bone-white)', fontFamily: 'var(--font-body)', fontSize: '18px', padding: '6px 0', outline: 'none' }}
                    className="silver-hover system-cursor-override"
                  />
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    placeholder="email address"
                    value={form.email} 
                    onChange={handleChange}
                    style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--cold-silver)', color: 'var(--bone-white)', fontFamily: 'var(--font-body)', fontSize: '18px', padding: '6px 0', outline: 'none' }}
                    className="silver-hover system-cursor-override"
                  />
                  <input 
                    type="text" 
                    name="address" 
                    required 
                    placeholder="shipping address"
                    value={form.address} 
                    onChange={handleChange}
                    style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--cold-silver)', color: 'var(--bone-white)', fontFamily: 'var(--font-body)', fontSize: '18px', padding: '6px 0', outline: 'none' }}
                    className="silver-hover system-cursor-override"
                  />
                  <input 
                    type="text" 
                    name="city" 
                    required 
                    placeholder="city, state, pin"
                    value={form.city} 
                    onChange={handleChange}
                    style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--cold-silver)', color: 'var(--bone-white)', fontFamily: 'var(--font-body)', fontSize: '18px', padding: '6px 0', outline: 'none' }}
                    className="silver-hover system-cursor-override"
                  />
                </div>

                {error && (
                  <span className="body-s" style={{ color: 'var(--ash-grey)' }}>{error}</span>
                )}

                {/* CTA Submit */}
                <div style={{ marginTop: '20px' }}>
                  <button
                    type="submit"
                    disabled={isProcessing || cart.length === 0}
                    className="underlined-link silver-hover"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--bone-white)',
                      fontFamily: 'var(--font-display)',
                      fontSize: '24px',
                      cursor: 'pointer',
                      outline: 'none',
                      paddingBottom: '4px',
                      opacity: isProcessing ? 0.5 : 1
                    }}
                  >
                    {isProcessing ? 'Crossing...' : 'Confirm claim →'}
                  </button>
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
          <div style={{ gridColumn: 'span 5', paddingLeft: '40px', borderLeft: '1px solid rgba(200, 204, 209, 0.15)' }} className="checkout-summary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="ui-text" style={{ fontSize: '10px' }}>
                Summary
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '48px', height: '72px', objectFit: 'cover', border: '1px solid rgba(200, 204, 209, 0.1)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--bone-white)' }}>
                        {item.name}
                      </h4>
                      <span className="body-s" style={{ fontSize: '12px' }}>
                        Size: {item.size} × {item.quantity}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(200, 204, 209, 0.15)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="ui-text">Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--bone-white)' }}>
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        input::placeholder {
          color: var(--ash-grey) !important;
          opacity: 0.5;
          font-style: italic;
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
