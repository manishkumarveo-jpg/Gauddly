import React, { useContext, useEffect, useState } from 'react';
import { Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { BellIcon, UserIcon } from './Icons';

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/castes', label: 'Castes' },
  { to: '/admin/episodes', label: 'Episodes' },
  { to: '/admin/orders', label: 'Orders' },
];

export default function AdminLayout() {
  const { user, sessionLoaded } = useContext(AppContext);
  const [isAdmin, setIsAdmin] = useState(null); // null = checking
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(!!data?.is_admin));
  }, [user]);

  if (!sessionLoaded || isAdmin === null) {
    return null;
  }
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!isAdmin) {
    return (
      <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '160px', textAlign: 'center' }}>
        Not authorized.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh' }} className="fade-in">
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px var(--grid-margin-desktop)',
          borderBottom: '1px solid rgba(200, 204, 209, 0.15)',
        }}
      >
        <img src="/LOGO%20BLACK.png" alt="Gauddly" style={{ height: '26px', width: 'auto', filter: 'invert(1)' }} />

        <div style={{ display: 'flex', gap: '16px' }}>
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="ui-text"
                style={{
                  textDecoration: 'none',
                  color: active ? 'var(--bone-white)' : 'var(--ash-grey)',
                  padding: '6px 12px',
                  border: active ? '1px solid transparent' : '1px dashed rgba(200, 204, 209, 0.3)',
                  borderBottom: active ? '1px solid var(--bone-white)' : '1px dashed rgba(200, 204, 209, 0.3)',
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--ash-grey)' }}>
          <BellIcon />
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--cold-silver)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserIcon width={14} height={14} />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px var(--grid-margin-desktop)' }}>
        <Outlet />
      </div>
    </div>
  );
}
