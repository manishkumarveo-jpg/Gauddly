import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function CartDrawer() {
  const { cart, removeFromCart, isCartOpen, setIsCartOpen } = useContext(AppContext);
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatPrice = (p) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(p);
  };

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Drawer content */}
      <div 
        className="fade-in"
        style={{
          position: 'relative',
          width: '450px',
          maxWidth: '100%',
          height: '100%',
          backgroundColor: 'var(--void-black)',
          borderLeft: '1px solid rgba(200, 204, 209, 0.15)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}} />

        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '0.05em' }}>
              Your claim
            </h2>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="ui-text silver-hover"
              style={{ background: 'none', border: 'none', color: 'var(--ash-grey)', padding: '5px' }}
            >
              Close
            </button>
          </div>

          {/* Cart items list */}
          <div style={{ overflowY: 'auto', maxH: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                    borderBottom: '1px solid rgba(200, 204, 209, 0.1)', 
                    paddingBottom: '20px' 
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '80px', height: '120px', objectFit: 'cover', border: '1px solid rgba(200, 204, 209, 0.1)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div>
                      <div className="ui-text" style={{ fontSize: '10px', color: 'var(--ash-grey)' }}>
                        {item.caste}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: '4px 0 2px 0' }}>
                        {item.name}
                      </h3>
                      <div className="ui-text" style={{ fontSize: '12px', color: 'var(--bone-white)' }}>
                        Size: {item.size}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', color: 'var(--ash-grey)' }}>
                        Qty: {item.quantity}
                      </span>
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
          <div style={{ borderTop: '1px solid rgba(200, 204, 209, 0.15)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
              <span className="ui-text">Subtotal</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--bone-white)' }}>
                {formatPrice(total)}
              </span>
            </div>
            
            <button
              onClick={handleCheckoutClick}
              className="underlined-link silver-hover"
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
  );
}
