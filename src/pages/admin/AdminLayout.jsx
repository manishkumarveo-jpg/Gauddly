import React, { useContext, useEffect, useState } from 'react';
import { Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/app-context';
import { supabase } from '../../lib/supabase';
import { GridIcon, BagIcon, BoxIcon, HomeIcon, UsersIcon, FilmIcon, ExternalIcon, SignOutIcon } from './Icons';
import './admin.css';

const groups = [
  ['Overview', [
    { to: '/admin', label: 'Dashboard', Icon: GridIcon },
  ]],
  ['Commerce', [
    { to: '/admin/orders', label: 'Orders', Icon: BagIcon },
    { to: '/admin/products', label: 'Products', Icon: BoxIcon },
  ]],
  ['Content', [
    { to: '/admin/homepage', label: 'Homepage', Icon: HomeIcon },
    { to: '/admin/castes', label: 'Castes', Icon: UsersIcon },
    { to: '/admin/episodes', label: 'Episodes', Icon: FilmIcon },
  ]],
];

const isActive = (to, path) => (to === '/admin' ? path === '/admin' || path === '/admin/' : path.startsWith(to));

export default function AdminLayout() {
  const { user, sessionLoaded, signOut } = useContext(AppContext);
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

  const current = groups.flatMap(([, links]) => links).find((l) => isActive(l.to, location.pathname));

  return (
    <div className="admin fade-in">
      <aside className="admin-side">
        <Link to="/admin" className="admin-brand">
          <span className="admin-logo" role="img" aria-label="Gauddly" />
          <span>Studio Admin</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin">
          {groups.map(([title, links]) => (
            <div key={title} className="admin-nav-group">
              <span className="admin-nav-title">{title}</span>
              {links.map(({ to, label, Icon }) => (
                <Link key={to} to={to} aria-current={isActive(to, location.pathname) ? 'page' : undefined}>
                  <Icon width={20} height={20} /> {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-side-foot">
          <Link to="/home"><ExternalIcon width={20} height={20} /> View storefront ↗</Link>
          <button type="button" onClick={signOut}><SignOutIcon width={20} height={20} /> Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-crumb">Admin / {current?.label === 'Dashboard' ? 'Overview' : current?.label}</div>
        <Outlet />
      </main>
    </div>
  );
}
