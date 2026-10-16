import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/app-context';

export default function CartDrawer() {
  const { cart, removeFromCart, isCartOpen, setIsCartOpen } = useContext(AppContext);
  const navigate = useNavigate();
  const [itemsVisible, setItemsVisible] = useState(false);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const closeDrawer = useCallback(() => setIsCartOpen(false), [setIsCartOpen]);

  // Stagger item list appearance after drawer slides in
  useEffect(() => {
    if (isCartOpen) {
      const t = setTimeout(() => setItemsVisible(true), 280);
      return () => clearTimeout(t);
    } else {
      setItemsVisible(false);
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (!isCartOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = [...panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isCartOpen, closeDrawer]);

  if (!isCartOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatPrice = (p) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(p);

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes backdropIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(6px); }
        }
        @keyframes cartItemIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}} />

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 5000,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {/* Backdrop */}
        <div
          onClick={() => setIsCartOpen(false)}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: 'backdropIn 0.4s ease forwards',
          }}
        />

        {/* Drawer panel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
          className="glass-panel"
          style={{
            position: 'relative',
            width: '450px',
            maxWidth: '100%',
            height: '100%',
            backgroundColor: 'rgba(10, 10, 10, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderLeft: '1px solid rgba(200, 204, 209, 0.12)',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
            animation: 'slideInRight 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 id="cart-drawer-title" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '0.05em' }}>
                Your claim
              </h2>
              <button
                ref={closeButtonRef}
                onClick={closeDrawer}
                aria-label="Close cart"
                className="ui-text silver-hover btn-liquid"
                style={{ background: 'none', border: 'none', color: 'var(--ash-grey)', padding: '5px' }}
              >
                Close
              </button>
            </div>

            {/* Cart items list */}
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {cart.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--ash-grey)', marginTop: '20px' }}>
                  No items claimed yet.
                </p>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      borderBottom: '1px solid rgba(200, 204, 209, 0.08)',
                      paddingBottom: '20px',
                      opacity: itemsVisible ? 1 : 0,
                      transform: itemsVisible ? 'translateX(0)' : 'translateX(16px)',
                      transition: `opacity 0.45s var(--ease-luxury) ${idx * 65}ms, transform 0.45s var(--ease-luxury) ${idx * 65}ms`,
                      willChange: 'opacity, transform',
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="img-reveal loaded"
                      style={{ width: '80px', height: '120px', objectFit: 'cover', border: '1px solid rgba(200, 204, 209, 0.08)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                      <div>
                        <div className="ui-text" style={{ fontSize: '10px', color: 'var(--ash-grey)' }}>{item.caste}</div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: '4px 0 2px 0' }}>{item.name}</h3>
                        <div className="ui-text" style={{ fontSize: '12px', color: 'var(--bone-white)' }}>Size: {item.size}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', color: 'var(--ash-grey)' }}>Qty: {item.quantity}</span>
                        <button
                          onClick={() => removeFromCart(item.id, item.size)}
                          className="ui-text silver-hover"
                          style={{ background: 'none', border: 'none', color: '#ff5555', fontSize: '11px', textTransform: 'lowercase' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '18px' }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer actions */}
          {cart.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(200, 204, 209, 0.12)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
                <span className="ui-text">Subtotal</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--bone-white)' }}>
                  {formatPrice(total)}
                </span>
              </div>
              <button
                onClick={handleCheckoutClick}
                className="underlined-link silver-hover btn-liquid"
                style={{
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'var(--font-display)',
                  fontSize: '22px',
                  color: 'var(--bone-white)',
                  padding: '12px 0',
                }}
              >
                Enter the crossing →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
