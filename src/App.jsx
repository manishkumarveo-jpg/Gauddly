import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Pages
const Landing = lazy(() => import('./pages/Landing'));
const Home = lazy(() => import('./pages/Home'));
const Store = lazy(() => import('./pages/Store'));
const Codex = lazy(() => import('./pages/Codex'));
const CastePage = lazy(() => import('./pages/CastePage'));
const PieceDetail = lazy(() => import('./pages/PieceDetail'));
const Sanctum = lazy(() => import('./pages/Sanctum'));
const Archive = lazy(() => import('./pages/Archive'));
const Episodes = lazy(() => import('./pages/Episodes'));
const Await = lazy(() => import('./pages/Await'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Signup = lazy(() => import('./pages/Signup'));
const Account = lazy(() => import('./pages/Account'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCastes = lazy(() => import('./pages/admin/AdminCastes'));
const AdminEpisodes = lazy(() => import('./pages/admin/AdminEpisodes'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminHomepage = lazy(() => import('./pages/admin/AdminHomepage'));
const HomepagePreview = lazy(() => import('./pages/admin/HomepagePreview'));
const ProductPreview = lazy(() => import('./pages/admin/ProductPreview'));
const AdminProductEditor = lazy(() => import('./pages/admin/AdminProductEditor'));

// Components
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SilverDropCursor from './components/SilverDropCursor';
import PageTransition from './components/PageTransition';
import RouteSeo from './components/RouteSeo';
import ScrollToTop from './components/ScrollToTop';

// Must match the media query in index.css that hides the native cursor
const useCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches;

function AppContent() {
  const location = useLocation();

  // The editors' live previews show the real site chrome, so they are not treated as admin screens.
  const isPreviewRoute = ['/admin/homepage/preview', '/admin/products/preview'].includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin') && !isPreviewRoute;
  const isAuthRoute = ['/login', '/forgot-password', '/reset-password'].includes(location.pathname);
  const showHeaderFooter = !isAdminRoute && location.pathname !== '/' && location.pathname !== '/await';

  return (
    <>
      {/* Global luxury custom cursor */}
      {useCustomCursor && <SilverDropCursor />}
      <RouteSeo />
      <ScrollToTop />

      {/* Header bar */}
      {showHeaderFooter && <Navigation />}

      {/* Cart Slider */}
      {!isAdminRoute && !isPreviewRoute && <CartDrawer />}

      {/* Main content body with page transitions */}
      <main id="main-content" style={{ minHeight: showHeaderFooter ? 'calc(100vh - 64px)' : '100vh' }}>
        <Suspense fallback={<div className="route-loader" role="status">Opening the chamber…</div>}>
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup"  element={<Signup />} />
            <Route path="/account" element={<Account />} />

            {/* Customer care and legal */}
            <Route path="/shipping" element={<InfoPage />} />
            <Route path="/returns" element={<InfoPage />} />
            <Route path="/privacy" element={<InfoPage />} />
            <Route path="/terms" element={<InfoPage />} />
            <Route path="/size-care" element={<InfoPage />} />

            {/* Admin */}
            <Route path="/admin/homepage/preview" element={<HomepagePreview />} />
            <Route path="/admin/products/preview" element={<ProductPreview />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index        element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductEditor />} />
              <Route path="products/:productId" element={<AdminProductEditor />} />
              <Route path="castes"   element={<AdminCastes />} />
              <Route path="episodes" element={<AdminEpisodes />} />
              <Route path="orders"   element={<AdminOrders />} />
              <Route path="homepage" element={<AdminHomepage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </PageTransition>
        </Suspense>
      </main>

      {/* Footer bar */}
      {showHeaderFooter && !isAuthRoute && <Footer />}
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
