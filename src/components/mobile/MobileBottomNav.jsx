import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/app-context';
import './mobile.css';

export default function MobileBottomNav() {
  const { cart, setIsCartOpen, user } = useContext(AppContext);
  const location = useLocation();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isHomeActive = ['/home', '/'].includes(location.pathname);
  const isShopActive = location.pathname.startsWith('/store') || location.pathname.startsWith('/the-old-world') || location.pathname.startsWith('/old-world');
  const isAccountActive = location.pathname.startsWith('/account') && !location.search.includes('view=claims');
  const isClaimsActive = location.search.includes('view=claims');

  return (
    <nav className="mobile-bottom-nav show-on-mobile" aria-label="Mobile Navigation">
      {/* Home */}
      <Link
        to="/home"
        className={`mobile-bottom-nav-item ${isHomeActive ? 'is-active' : ''}`}
        aria-label="Home"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"/>
        </svg>
        <span>Home</span>
      </Link>

      {/* Shop */}
      <Link
        to="/store"
        className={`mobile-bottom-nav-item ${isShopActive ? 'is-active' : ''}`}
        aria-label="Shop"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <span>Shop</span>
      </Link>

      {/* Account */}
      <Link
        to={user ? "/account" : "/login"}
        className={`mobile-bottom-nav-item ${isAccountActive ? 'is-active' : ''}`}
        aria-label={user ? "Account" : "Sign In"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>{user ? "Account" : "Sign In"}</span>
      </Link>

      {/* Claims */}
      <Link
        to={user ? "/account?view=claims" : "/login?redirect=/account?view=claims"}
        className={`mobile-bottom-nav-item ${isClaimsActive ? 'is-active' : ''}`}
        aria-label="Claims"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <span>Claims</span>
      </Link>

      {/* Cart Drawer Trigger */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="mobile-bottom-nav-item"
        aria-label={`Cart, ${totalItems} items`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span>Cart</span>
        {totalItems > 0 && (
          <span className="mobile-bottom-nav-badge" aria-hidden="true">
            {totalItems}
          </span>
        )}
      </button>
    </nav>
  );
}

