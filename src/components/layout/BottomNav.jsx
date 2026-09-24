import { motion } from 'framer-motion';
import { Car, Home, MessageCircle, MapPin, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUnreadCount } from '../../services/messagesService';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Home',     icon: Home          },
  { href: '/find-ride',  label: 'Find',     icon: MapPin        },
  { href: '/offer-ride', label: 'Offer',    icon: Car           },
  { href: '/messages',   label: 'Messages', icon: MessageCircle },
  { href: '/profile',    label: 'Profile',  icon: User          },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const fetch = () => getUnreadCount(user.id).then(setUnread).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const appPaths = ['/dashboard', '/find-ride', '/offer-ride', '/my-rides', '/messages', '/profile', '/live-ride', '/verification'];
  const show = appPaths.some(p => location.pathname.startsWith(p));
  if (!show) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-surface-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <nav className="flex items-center justify-around px-1 py-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] py-2 px-1 rounded-2xl transition-colors active:bg-surface-100"
            >
              <div className="relative flex items-center justify-center w-8 h-8">
                <motion.div
                  animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  <Icon
                    size={22}
                    className={active ? 'text-brand-600' : 'text-surface-400'}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </motion.div>
                {active && (
                  <motion.div
                    layoutId="bottomNavDot"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-600"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {/* Unread badge on Messages */}
                {href === '/messages' && unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-semibold leading-none ${active ? 'text-brand-600' : 'text-surface-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
