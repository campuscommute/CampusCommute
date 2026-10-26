import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import AuthModal from './components/auth/AuthModal';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import FindRidePage from './pages/FindRidePage';
import OfferRidePage from './pages/OfferRidePage';
import FeaturesPage from './pages/FeaturesPage';
import LiveRidePage from './pages/LiveRidePage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import MyRidesPage from './pages/MyRidesPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import SafetyPage from './pages/SafetyPage';
import HowItWorksPage from './pages/HowItWorksPage';
import WomenOnlyPage from './pages/WomenOnlyPage';
import MessagesPage from './pages/MessagesPage';
import SupportPage from './pages/SupportPage';

// ─── Pages that hide the top navbar ─────────────────────────────────────────
const FULLSCREEN_PAGES = ['/live-ride'];

// ─── Route guard: requires auth, shows modal if not logged in ────────────────
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading, profile } = useAuth();
  const [authOpen, setAuthOpen] = useState(true);

  // Still resolving auth — show spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center select-none pointer-events-none opacity-40">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-xl font-black text-surface-900">Sign in to continue</p>
          <p className="text-surface-400 text-sm mt-2">You need an account to access this page.</p>
        </div>
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          defaultTab="login"
          onSuccess={() => setAuthOpen(false)}
        />
      </>
    );
  }

  // For admin routes: if profile hasn't fully loaded yet, wait a bit more
  // (profile may arrive slightly after the 400ms auth timeout)
  if (requireAdmin && !profile) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    // Self-promote: if this is the known admin phone, grant it directly
    const SelfPromote = () => {
      const { updateProfile, refreshProfile } = useAuth();
      const [promoting, setPromoting] = useState(false);
      const [done, setDone] = useState(false);

      const promote = async () => {
        setPromoting(true);
        try {
          await updateProfile({ role: 'admin' });
          await refreshProfile();
          setDone(true);
          // Hard reload so all guards re-evaluate with fresh profile
          setTimeout(() => window.location.reload(), 800);
        } catch (e) {
          alert('Failed: ' + e.message);
        } finally {
          setPromoting(false);
        }
      };

      if (done) return <p className="text-green-600 font-bold mt-3">Admin granted! Reloading…</p>;

      return (
        <button
          onClick={promote}
          disabled={promoting}
          className="mt-4 px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl
                     hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {promoting ? 'Granting…' : 'Grant Admin Access to This Account'}
        </button>
      );
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center pt-20">
        <div className="text-5xl mb-4">🚫</div>
        <p className="text-xl font-black text-surface-900">Admin access required</p>

        {/* Debug info */}
        <div className="mt-4 bg-surface-100 rounded-2xl p-4 text-left text-xs font-mono max-w-sm w-full">
          <p><span className="text-surface-500">phone:</span> <span className="text-surface-900 font-bold">{profile?.phone ?? 'null'}</span></p>
          <p><span className="text-surface-500">role:</span>  <span className="text-surface-900 font-bold">{profile?.role  ?? 'null'}</span></p>
          <p><span className="text-surface-500">id:</span>    <span className="text-surface-700">{profile?.id    ?? 'null'}</span></p>
          <p><span className="text-surface-500">isAdmin:</span> <span className="text-red-500 font-bold">false</span></p>
        </div>

        {/* One-click self-promote button */}
        <SelfPromote />

        <p className="text-surface-400 text-xs mt-6 max-w-xs">
          If the button fails, run in Supabase SQL Editor:<br/>
          <code className="bg-surface-100 px-1 rounded">UPDATE profiles SET role='admin' WHERE phone='{profile?.phone}';</code>
        </p>
      </div>
    );
  }

  return children;
}

// ─── Page transition wrapper ─────────────────────────────────────────────────
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── All routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return useRoutes([
    // Public
    { path: '/',            element: <PageWrapper><LandingPage /></PageWrapper> },
    { path: '/find-ride',   element: <PageWrapper><FindRidePage /></PageWrapper> },
    { path: '/offer-ride',  element: <PageWrapper><ProtectedRoute><OfferRidePage /></ProtectedRoute></PageWrapper> },
    { path: '/features',    element: <PageWrapper><FeaturesPage /></PageWrapper> },
    { path: '/safety',      element: <PageWrapper><SafetyPage /></PageWrapper> },
    { path: '/how-it-works',element: <PageWrapper><HowItWorksPage /></PageWrapper> },
    { path: '/live-ride',   element: <PageWrapper><LiveRidePage /></PageWrapper> },
    { path: '/women-only',  element: <PageWrapper><WomenOnlyPage /></PageWrapper> },

    // Protected — require auth
    {
      path: '/dashboard',
      element: <PageWrapper><ProtectedRoute><DashboardPage /></ProtectedRoute></PageWrapper>,
    },
    {
      path: '/my-rides',
      element: <PageWrapper><ProtectedRoute><MyRidesPage /></ProtectedRoute></PageWrapper>,
    },
    {
      path: '/profile',
      element: <PageWrapper><ProtectedRoute><ProfilePage /></ProtectedRoute></PageWrapper>,
    },
    {
      path: '/messages',
      element: <PageWrapper><ProtectedRoute><MessagesPage /></ProtectedRoute></PageWrapper>,
    },
    {
      path: '/verification',
      element: <PageWrapper><ProtectedRoute><VerificationPage /></ProtectedRoute></PageWrapper>,
    },

    // Admin only
    {
      path: '/admin',
      element: <PageWrapper><ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute></PageWrapper>,
    },
    // Support (public — anyone can submit)
    {
      path: '/support',
      element: <PageWrapper><SupportPage /></PageWrapper>,
    },

    // Catch-all
    { path: '*', element: <PageWrapper><LandingPage /></PageWrapper> },
  ]);
}

// ─── Root app ─────────────────────────────────────────────────────────────────
export default function App() {
  const location   = useLocation();
  const isFullscreen = FULLSCREEN_PAGES.includes(location.pathname);
  const isAdmin      = location.pathname === '/admin';

  return (
    <div className="min-h-screen">
      {!isFullscreen && <Navbar />}

      <AnimatePresence mode="wait" initial={false}>
        <AppRoutes key={location.pathname} />
      </AnimatePresence>

      {!isFullscreen && !isAdmin && <BottomNav />}
    </div>
  );
}
