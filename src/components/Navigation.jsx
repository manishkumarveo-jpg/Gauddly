import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Navigation() {
  const { cart, setIsCartOpen, user } = useContext(AppContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Define background style based on scroll & page
  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 var(--grid-margin-desktop)',
    zIndex: 1000,
    transition: 'background-color 0.4s ease, border-bottom 0.4s ease',
    backgroundColor: isHome 
      ? (isScrolled ? 'rgba(10, 10, 10, 0.95)' : 'transparent')
      : 'rgba(10, 10, 10, 0.95)',
    borderBottom: (isScrolled || !isHome)
      ? '1px solid rgba(200, 204, 209, 0.15)'
      : '1px solid transparent',
  };

  return (
    <nav style={navStyle}>
      {/* Left Column: Pages */}
      <div style={{ display: 'flex', gap: '32px' }}>
        <Link to="/the-sanctum" className="ui-text silver-hover" style={{ textDecoration: 'none' }}>
          Sanctum
        </Link>
        <Link to="/codex" className="ui-text silver-hover" style={{ textDecoration: 'none' }}>
          Codex
        </Link>
        <Link to="/episodes" className="ui-text silver-hover" style={{ textDecoration: 'none' }}>
          Episodes
        </Link>
        <Link to="/old-world" className="ui-text silver-hover" style={{ textDecoration: 'none' }}>
          Archive
        </Link>
      </div>

      {/* Center: Brand Name */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Link to="/home" className="ui-text silver-hover" style={{ fontSize: '15px', color: 'var(--bone-white)', textDecoration: 'none' }}>
          GAUDDLY
        </Link>
      </div>

      {/* Right Column: Account + Claim Cart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to={user ? '/account' : '/login'} className="ui-text silver-hover" style={{ textDecoration: 'none' }}>
          {user ? 'Account' : 'Sign In'}
        </Link>
        <button
          onClick={() => setIsCartOpen(true)}
          className="ui-text silver-hover"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--bone-white)', 
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Claims</span>
          {totalItems > 0 && (
            <span style={{ 
              display: 'inline-block',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: 'var(--cold-silver)',
              color: 'var(--void-black)',
              fontSize: '10px',
              fontWeight: 'bold',
              lineHeight: '18px',
              textAlign: 'center'
            }}>
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
