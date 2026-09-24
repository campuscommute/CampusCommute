import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUnreadCount } from '../../services/messagesService';
import AuthModal from '../auth/AuthModal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const navLinks = [
  { label: 'Find a Ride',  href: '/find-ride'   },
  { label: 'Offer a Ride', href: '/offer-ride'  },
  { label: 'My Rides',     href: '/my-rides'    },
  { label: 'Women Only',   href: '/women-only'  },
  { label: 'Safety',       href: '/safety'      },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [authTab, setAuthTab]     = useState('login');
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isAuthenticated, profile, user, signOut, loading } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Poll unread count every 30s when authenticated
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const fetch = () => getUnreadCount(user.id).then(setUnread).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (href) => location.pathname === href;

  const openLogin    = () => { setAuthTab('login');    setAuthOpen(true); };
  const openRegister = () => { setAuthTab('register'); setAuthOpen(true); };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-40 transition-all duration-300
          ${scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-surface-100 shadow-sm py-3'
            : 'bg-transparent py-5'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2C8 2 4 5.5 4 10c0 6 8 12 8 12s8-6 8-12c0-4.5-4-8-8-8z" fill="currentColor" opacity="0.3"/>
                <path d="M7 11h10M12 7v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="8" cy="14" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-surface-900 tracking-tight">
              Campus <span className="text-brand-600">Commute</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`
                  relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive(link.href)
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right — messages icon + auth */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {loading ? (
              <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            ) : isAuthenticated ? (
              <>
                {/* Dedicated Messages icon */}
                <Link
                  to="/messages"
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 transition-colors text-surface-500 hover:text-brand-600"
                  title="Messages"
                >
                  <MessageCircle size={20} />
                  {unread > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>

                <motion.button
                  onClick={() => navigate('/dashboard')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl hover:bg-surface-100 transition-colors"
                >
                  <Avatar name={displayName} size="sm" verified={profile?.is_verified} />
                  <span className="text-sm font-semibold text-surface-800 max-w-[120px] truncate">
                    {displayName}
                  </span>
                </motion.button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LogOut size={15} />}
                  onClick={handleSignOut}
                  className="text-surface-500 hover:text-surface-800"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={openLogin}>Log In</Button>
                <Button size="sm" onClick={openRegister}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile — Messages icon + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            {isAuthenticated && (
              <Link
                to="/messages"
                className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors text-surface-600"
              >
                <MessageCircle size={22} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors text-surface-700"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-30 bg-surface-950/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-16 left-4 right-4 z-30 bg-white rounded-3xl shadow-2xl p-4 md:hidden border border-surface-100"
            >
              {/* User row if authenticated */}
              {isAuthenticated && (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-surface-100">
                  <Avatar name={displayName} size="sm" verified={profile?.is_verified} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-surface-900 text-sm truncate">{displayName}</p>
                    <p className="text-xs text-surface-400 truncate">{user?.email}</p>
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-1 mb-3">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      className={`
                        block px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                        ${isActive(link.href) ? 'text-brand-600 bg-brand-50' : 'text-surface-700 hover:bg-surface-50'}
                      `}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {isAuthenticated && (
                  <>
                    <Link to="/dashboard" className="block px-4 py-3 rounded-2xl text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors">
                      My Dashboard
                    </Link>
                    <Link to="/messages" className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors">
                      <span className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-brand-500" />
                        Messages
                      </span>
                      {unread > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </Link>
                    <Link to="/profile" className="block px-4 py-3 rounded-2xl text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors">
                      Profile
                    </Link>
                  </>
                )}
              </nav>

              <div className="flex flex-col gap-2 pt-3 border-t border-surface-100">
                {isAuthenticated ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    icon={<LogOut size={15} />}
                    onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  >
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" fullWidth onClick={() => { openLogin(); setMenuOpen(false); }}>
                      Log In
                    </Button>
                    <Button fullWidth onClick={() => { openRegister(); setMenuOpen(false); }}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
        onSuccess={() => {
          setAuthOpen(false);
          navigate('/dashboard');
        }}
      />
    </>
  );
}
