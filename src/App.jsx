import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Store from './pages/Store';
import Codex from './pages/Codex';
import CastePage from './pages/CastePage';
import PieceDetail from './pages/PieceDetail';
import Sanctum from './pages/Sanctum';
import Archive from './pages/Archive';
import Episodes from './pages/Episodes';
import Await from './pages/Await';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCastes from './pages/admin/AdminCastes';
import AdminEpisodes from './pages/admin/AdminEpisodes';
import AdminOrders from './pages/admin/AdminOrders';

// Components
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SilverDropCursor from './components/SilverDropCursor';
import PageTransition from './components/PageTransition';

function AppContent() {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const showHeaderFooter = !isAdminRoute && location.pathname !== '/' && location.pathname !== '/await';

  return (
    <>
      {/* Global luxury custom cursor */}
      <SilverDropCursor />

      {/* Header bar */}
      {showHeaderFooter && <Navigation />}

      {/* Cart Slider */}
      {!isAdminRoute && <CartDrawer />}

      {/* Main content body with page transitions */}
      <main style={{ minHeight: showHeaderFooter ? 'calc(100vh - 64px)' : '100vh' }}>
        <PageTransition>
          <Routes>
            <Route path="/"           element={<Landing />} />
            <Route path="/home"       element={<Home />} />
            <Route path="/store"      element={<Store />} />
            <Route path="/codex"      element={<Codex />} />
            <Route path="/the-sanctum" element={<Sanctum />} />

            {/* Collection 01 Archive Relic Details */}
            <Route path="/the-old-world/:pieceId" element={<PieceDetail />} />
            <Route path="/old-world"  element={<Archive />} />

            {/* Dynamic Castes & Product Pages */}
            <Route path="/:casteId"            element={<CastePage />} />
            <Route path="/:casteId/:pieceId"   element={<PieceDetail />} />

            {/* Episodes index */}
            <Route path="/episodes"  element={<Episodes />} />

            {/* Waitlist and Checkout */}
            <Route path="/await"    element={<Await />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Accounts */}
            <Route path="/login"   element={<Login />} />
            <Route path="/signup"  element={<Signup />} />
            <Route path="/account" element={<Account />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index        element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="castes"   element={<AdminCastes />} />
              <Route path="episodes" element={<AdminEpisodes />} />
              <Route path="orders"   element={<AdminOrders />} />
            </Route>
          </Routes>
        </PageTransition>
      </main>

      {/* Footer bar */}
      {showHeaderFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
