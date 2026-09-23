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

// ─── Pages that hide the top navbar ─────────────────────────────────────────
const FULLSCREEN_PAGES = ['/live-ride'];

// ─── Route guard: requires auth, shows modal if not logged in ────────────────
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {/* Blurred placeholder behind the modal */}
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center select-none pointer-events-none opacity-40">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-xl font-black text-surface-900">Sign in to continue</p>
          <p className="text-surface-400 text-sm mt-2">You need an account to access this page.</p>
        </div>
        <AuthModal
          open
          onClose={() => setAuthOpen(false)}
          defaultTab="login"
          onSuccess={() => setAuthOpen(false)}
        />
      </>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center pt-20">
        <div className="text-6xl mb-4">🚫</div>
        <p className="text-xl font-black text-surface-900">Admin access required</p>
        <p className="text-surface-400 text-sm mt-2">You don't have permission to view this page.</p>
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
    { path: '/offer-ride',  element: <PageWrapper><OfferRidePage /></PageWrapper> },
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
      path: '/verification',
      element: <PageWrapper><ProtectedRoute><VerificationPage /></ProtectedRoute></PageWrapper>,
    },

    // Admin only
    {
      path: '/admin',
      element: <PageWrapper><ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute></PageWrapper>,
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
