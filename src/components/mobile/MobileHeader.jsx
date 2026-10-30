import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/app-context';
import MobileMenuDrawer from './MobileMenuDrawer';
import './mobile.css';

export default function MobileHeader() {
  const { cart, setIsCartOpen } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Check if current view is a nested subview where a back button makes sense
  const hasSubView = location.pathname.startsWith('/account') && location.search.length > 0;
  const isAuthView = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isDetailView = location.pathname.includes('/the-old-world/') || (location.pathname.split('/').length > 2 && !location.pathname.startsWith('/admin'));

  const showBackButton = hasSubView || isDetailView;

  const handleBack = () => {
    if (hasSubView) {
      navigate('/account');
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <header className="mobile-top-header show-on-mobile" aria-label="Mobile Header">
        {/* Left Action: Back Arrow or Hamburger */}
        {showBackButton ? (
          <button
            type="button"
            onClick={handleBack}
            className="mobile-header-btn"
            aria-label="Go back"
            style={{ fontSize: '20px' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="mobile-header-btn"
            aria-label="Open mobile menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}

        {/* Center: Brand Logo */}
        <div className="mobile-header-logo">
          <Link to="/home" style={{ display: 'block' }}>
            <img src="/LOGO%20BLACK.png" alt="Gauddly" />
          </Link>
        </div>

        {/* Right Action: Search + Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link
            to="/store"
            className="mobile-header-btn"
            aria-label="Search garments"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </Link>

          {!isAuthView && (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="mobile-header-btn"
              aria-label={`Cart, ${totalItems} items`}
              style={{ position: 'relative' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {totalItems > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--cold-silver)',
                }} />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Drawer Overlay */}
      <MobileMenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

