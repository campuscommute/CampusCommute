import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Lock, LogIn,
  Shield, ShieldCheck, Star, Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchWomenOnlyRides, createRide } from '../services/ridesService';
import AuthModal from '../components/auth/AuthModal';
import BookingModal from '../components/rides/BookingModal';
import RideDetailsModal from '../components/rides/RideDetailsModal';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ScrollReveal from '../components/ui/ScrollReveal';
import Toggle from '../components/ui/Toggle';
import { useToast } from '../components/ui/Toast';
import Footer from '../components/layout/Footer';

// ─── Static feature chips shown in the hero ───────────────────────────────────
const FEATURES = [
  '🎓 Verified female students only',
  '🔐 OTP-secured every trip',
  '📍 Live tracking enabled',
  '👥 Share ride with a contact',
];

// ─── Safety promise cards ─────────────────────────────────────────────────────
const PROMISES = [
  {
    icon: '🔐',
    title: 'Identity verified',
    desc: 'Every female rider and driver is verified via college ID before they can access this section.',
  },
  {
    icon: '📍',
    title: 'Live location sharing',
    desc: 'Your route is visible to your trusted contact throughout the trip.',
  },
  {
    icon: '⭐',
    title: 'Peer ratings',
    desc: 'Ratings from female riders build a trusted reputation within this community.',
  },
  {
    icon: '🆘',
    title: 'SOS always visible',
    desc: 'One tap alerts emergency contacts with your live location instantly.',
  },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────
function WomenHero({ onGetStarted }) {
  return (
    <section className="relative bg-gradient-to-br from-brand-50 via-white to-surface-50 pt-28 pb-20 overflow-hidden">
      {/* Subtle blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 bg-white border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 shadow-sm">
                <ShieldCheck size={13} />
                Female students only
              </div>

              <h1 className="text-5xl sm:text-6xl font-black text-surface-950 leading-[1.05] tracking-tight mb-5">
                Ride safe.<br />
                <span className="text-brand-600">Ride together.</span>
              </h1>

              <p className="text-lg text-surface-500 leading-relaxed mb-8 max-w-md">
                A dedicated space for verified female students to find rides with female drivers — or offer their own.
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-2 mb-8">
                {FEATURES.map(f => (
                  <span key={f} className="text-xs bg-white border border-surface-100 text-surface-700 font-semibold px-3 py-1.5 rounded-full shadow-sm">
                    {f}
                  </span>
                ))}
              </div>

              <Button size="xl" onClick={onGetStarted} iconRight={<ArrowRight size={20} />}>
                Get Started
              </Button>
            </motion.div>
          </div>

          {/* Visual card stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            {/* Back card */}
            <div className="absolute top-6 left-6 right-0 bg-brand-50 border border-brand-100 rounded-3xl h-48 shadow-sm" />
            {/* Front card */}
            <div className="relative bg-white rounded-3xl p-6 card-shadow border border-surface-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <ShieldCheck size={24} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-surface-900">Women-Only Zone</p>
                  <p className="text-xs text-surface-400">Verified female students</p>
                </div>
                <div className="ml-auto w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Priya Singh',  college: 'GNIOT', seats: 2, price: 90,  time: '8:00 AM' },
                  { name: 'Neha Gupta',  college: 'Jamia', seats: 3, price: 75,  time: '8:30 AM' },
                  { name: 'Riya Joshi',  college: 'DTU',   seats: 1, price: 100, time: '9:00 AM' },
                ].map((r, i) => (
                  <motion.div
                    key={r.name}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3 bg-surface-50 rounded-2xl px-3 py-2.5"
                  >
                    <Avatar name={r.name} size="sm" verified />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-surface-900 truncate">{r.name}</p>
                      <p className="text-[10px] text-surface-400">{r.college} · {r.time}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-brand-600">₹{r.price}</p>
                      <p className="text-[10px] text-surface-400">{r.seats} seats</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-surface-100 flex items-center gap-1.5 text-xs text-brand-600 font-semibold">
                <Shield size={12} />
                All rides verified · Women only
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Access gate ──────────────────────────────────────────────────────────────
function AccessGate({ onSelectRole }) {
  const { isAuthenticated, isFemale, profile } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

  const handleRole = (role) => {
    if (!isAuthenticated) {
      setPendingRole(role);
      setAuthOpen(true);
      return;
    }
    if (!isFemale) return; // button disabled anyway
    onSelectRole(role);
  };

  const handleAuthSuccess = () => {
    setAuthOpen(false);
    if (pendingRole) {
      setTimeout(() => onSelectRole(pendingRole), 400);
    }
  };

  return (
    <>
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-10">
            <p className="text-brand-600 font-semibold text-sm tracking-widest uppercase mb-3">Choose your role</p>
            <h2 className="text-3xl sm:text-4xl font-black text-surface-950 mb-3">
              How do you want to commute?
            </h2>
            <p className="text-surface-500 text-sm max-w-sm mx-auto">
              {isAuthenticated && !isFemale
                ? '⚠️  This section is accessible to verified female students only.'
                : 'Select your role to access the women-only commute zone.'
              }
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                value: 'rider',
                emoji: '🚗',
                title: 'I am a Female Rider',
                sub: 'Find rides with verified female drivers',
                bullets: ['Female drivers only', 'OTP-secured pickup', 'Live tracking on'],
              },
              {
                value: 'driver',
                emoji: '🛞',
                title: 'I am a Female Driver',
                sub: 'Offer women-only rides to female students',
                bullets: ['Female riders only', 'You control pricing', 'Build your reputation'],
              },
            ].map((opt, i) => {
              const disabled = isAuthenticated && !isFemale;
              return (
                <ScrollReveal key={opt.value} delay={i * 0.1}>
                  <motion.button
                    onClick={() => handleRole(opt.value)}
                    disabled={disabled}
                    whileHover={!disabled ? { y: -4 } : {}}
                    whileTap={!disabled ? { scale: 0.98 } : {}}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className={`
                      w-full text-left bg-white rounded-3xl p-6 card-shadow border-2 transition-all duration-300
                      ${disabled
                        ? 'opacity-40 cursor-not-allowed border-surface-100'
                        : 'border-surface-100 hover:border-brand-300 hover:shadow-lg cursor-pointer'
                      }
                    `}
                  >
                    <div className="text-4xl mb-4">{opt.emoji}</div>
                    <h3 className="text-lg font-black text-surface-950 mb-1">{opt.title}</h3>
                    <p className="text-sm text-surface-500 mb-4">{opt.sub}</p>
                    <ul className="space-y-1.5">
                      {opt.bullets.map(b => (
                        <li key={b} className="flex items-center gap-2 text-xs text-surface-600 font-medium">
                          <CheckCircle size={13} className="text-brand-500 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    {!isAuthenticated && (
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-brand-600 font-semibold">
                        <LogIn size={12} />
                        Sign in to continue
                      </div>
                    )}
                  </motion.button>
                </ScrollReveal>
              );
            })}
          </div>

          {!isAuthenticated && (
            <ScrollReveal delay={0.2} className="mt-8 text-center">
              <p className="text-sm text-surface-500 mb-4">
                Already have an account?
              </p>
              <Button variant="secondary" onClick={() => setAuthOpen(true)} icon={<LogIn size={16} />}>
                Log in to continue
              </Button>
            </ScrollReveal>
          )}
        </div>
      </section>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab="register"
        forceGender="female"
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

// ─── Rider view ───────────────────────────────────────────────────────────────
function RiderView({ onSwitchRole }) {
  const toast = useToast();
  const { profile } = useAuth();
  const [rides, setRides]           = useState([]);
  const [loadingRides, setLoading]  = useState(true);
  const [filterEnabled, setFilter]  = useState(true);
  const [bookingRide, setBooking]   = useState(null);
  const [detailsRide, setDetails]   = useState(null);
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');

  // Use Supabase service; fall back to mock if env not configured
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await searchWomenOnlyRides({ from: from || undefined, to: to || undefined });
        setRides(data);
      } catch {
        // Supabase not configured yet — show mock female rides
        const female = mockRides.filter(r => r.driver?.gender === 'female' || r.preference === 'women-only');
        setRides(female);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [from, to]);

  const displayed = filterEnabled
    ? rides
    : mockRides; // show all when filter off (demo only)

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-3xl p-6 mb-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck size={18} className="text-brand-600" />
                <span className="text-brand-700 font-bold text-sm">Female Rider Mode</span>
              </div>
              <h2 className="text-xl font-black text-surface-950">Your safe rides</h2>
              <p className="text-surface-500 text-sm mt-1">
                {filterEnabled ? 'Showing verified female drivers only.' : 'Showing all rides.'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Toggle
                checked={filterEnabled}
                onChange={v => {
                  setFilter(v);
                  toast(v ? 'Female driver filter on' : 'Showing all rides', 'info');
                }}
              />
              <span className="text-xs text-surface-400">{filterEnabled ? 'Active' : 'Off'}</span>
            </div>
          </div>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-4 card-shadow border border-surface-100 mb-6 flex gap-2"
        >
          <input
            value={from}
            onChange={e => setFrom(e.target.value)}
            placeholder="From"
            className="flex-1 px-4 py-2.5 rounded-2xl bg-surface-50 border border-surface-100 text-sm font-medium text-surface-900 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
          />
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="To"
            className="flex-1 px-4 py-2.5 rounded-2xl bg-surface-50 border border-surface-100 text-sm font-medium text-surface-900 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
          />
        </motion.div>

        {/* Ride count */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-surface-900 flex items-center gap-2">
            <Users size={16} className="text-brand-500" />
            {loadingRides ? 'Loading…' : `${displayed.length} rides available`}
          </h3>
          <button
            onClick={onSwitchRole}
            className="text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100"
          >
            Switch Role
          </button>
        </div>

        {/* Ride cards */}
        {loadingRides ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-surface-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center card-shadow border border-surface-100">
            <div className="text-5xl mb-3">🚗</div>
            <p className="font-bold text-surface-900 mb-1">No rides found</p>
            <p className="text-sm text-surface-400">Try adjusting your search or check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((ride, i) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
                whileHover={{ y: -3 }}
                className="bg-white rounded-3xl p-5 card-shadow border border-surface-50 cursor-pointer hover:border-brand-100 transition-colors"
                onClick={() => setDetails(ride)}
              >
                {/* Driver row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={ride.driver?.name} size="md" verified={ride.driver?.verified || ride.driver?.is_verified} />
                    <div>
                      <p className="font-bold text-surface-900 text-sm">{ride.driver?.name}</p>
                      <div className="flex gap-1.5 flex-wrap mt-0.5">
                        <Badge variant="brand">🎓 Verified</Badge>
                        <Badge variant="pink">👩 Female Driver</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-surface-900">₹{ride.price ?? ride.price_per_seat}</p>
                    <p className="text-xs text-surface-400">per seat</p>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2 bg-surface-50 rounded-2xl px-4 py-3 mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-surface-400 font-medium">From</p>
                    <p className="font-bold text-surface-900 text-sm">{ride.from ?? ride.from_label}</p>
                  </div>
                  <ArrowRight size={14} className="text-brand-400 flex-shrink-0" />
                  <div className="flex-1 text-right">
                    <p className="text-xs text-surface-400 font-medium">To</p>
                    <p className="font-bold text-surface-900 text-sm">{ride.to ?? ride.to_label}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mb-4 text-xs text-surface-500 font-medium flex-wrap">
                  <span>🕐 {ride.time}</span>
                  <span>💺 {ride.seats ?? ride.available_seats} seats</span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold ml-auto">
                    <Star size={11} fill="currentColor" />
                    {ride.driver?.rating ?? '5.0'}
                  </span>
                </div>

                <Button
                  fullWidth
                  size="sm"
                  onClick={e => { e.stopPropagation(); setBooking(ride); }}
                >
                  Request Seat
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <RideDetailsModal
        ride={detailsRide}
        open={!!detailsRide}
        onClose={() => setDetails(null)}
        onRequest={() => { setBooking(detailsRide); setDetails(null); }}
      />
      <BookingModal
        ride={bookingRide}
        open={!!bookingRide}
        onClose={() => setBooking(null)}
      />
    </>
  );
}

// ─── Driver view ──────────────────────────────────────────────────────────────
function DriverView({ onSwitchRole }) {
  const toast = useToast();
  const { user } = useAuth();
  const [womenOnly, setWomenOnly]   = useState(true);
  const [published, setPublished]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [form, setForm]             = useState({ from: '', to: '', time: '8:00 AM', price: '', date: 'Today' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handlePublish = async () => {
    if (!form.from || !form.to || !form.price) {
      toast('Please fill in all fields', 'error');
      return;
    }
    if (!user) {
      toast('Please sign in to publish a ride', 'error');
      return;
    }
    setLoading(true);
    try {
      const resolveDate = (d) => {
        if (d === 'Today')    return new Date().toISOString().split('T')[0];
        if (d === 'Tomorrow') { const t = new Date(); t.setDate(t.getDate() + 1); return t.toISOString().split('T')[0]; }
        return new Date().toISOString().split('T')[0];
      };
      await createRide({
        driver_id:       user.id,
        from_label:      form.from,
        to_label:        form.to,
        date:            resolveDate(form.date),
        time:            form.time,
        available_seats: 3,
        total_seats:     3,
        price_per_seat:  parseFloat(form.price),
        preference:      womenOnly ? 'women-only' : 'everyone',
        status:          'upcoming',
      });
      setPublished(true);
      toast('Women-only ride published!', 'success');
    } catch (err) {
      toast(err.message || 'Failed to publish ride', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-2xl bg-surface-50 border border-surface-100 text-sm font-medium text-surface-900 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-3xl p-6 mb-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-brand-100 flex items-center justify-center shadow-sm">
              <ShieldCheck size={22} className="text-brand-600" />
            </div>
            <div>
              <p className="font-bold text-brand-700 text-sm">Female Driver Mode</p>
              <p className="text-surface-500 text-xs mt-0.5">Only verified female students can join</p>
            </div>
          </div>
          <button
            onClick={onSwitchRole}
            className="text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors bg-white px-3 py-1.5 rounded-xl border border-brand-100"
          >
            Switch Role
          </button>
        </div>
      </motion.div>

      {/* Women-only toggle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-5 card-shadow border border-surface-100 mb-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${womenOnly ? 'bg-brand-100' : 'bg-surface-50'}`}>
              <Shield size={18} className={womenOnly ? 'text-brand-600' : 'text-surface-400'} />
            </div>
            <div>
              <p className="font-bold text-surface-900 text-sm">Women Only Ride</p>
              <p className="text-xs text-surface-400 mt-0.5">
                {womenOnly ? 'Only verified female riders can join' : 'Open to everyone'}
              </p>
            </div>
          </div>
          <Toggle checked={womenOnly} onChange={v => {
            setWomenOnly(v);
            toast(v ? 'Women-only mode on' : 'Open to all riders', 'info');
          }} />
        </div>
        <AnimatePresence>
          {womenOnly && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-surface-50 flex items-center gap-2 text-xs font-semibold text-brand-700">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                Gender verification active — only verified female riders shown
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Publish form / success */}
      <AnimatePresence mode="wait">
        {!published ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl p-6 card-shadow border border-surface-100 mb-5"
          >
            <h3 className="font-bold text-surface-900 mb-4">Publish a ride</h3>
            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 pl-1">From</label>
                  <input className={inputCls} placeholder="Pickup location" value={form.from} onChange={set('from')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 pl-1">To</label>
                  <input className={inputCls} placeholder="Destination" value={form.to} onChange={set('to')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 pl-1">Time</label>
                  <select className={`${inputCls} appearance-none cursor-pointer`} value={form.time} onChange={set('time')}>
                    {['7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','5:00 PM','5:30 PM','6:00 PM'].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 pl-1">Price per seat (₹)</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="80"
                    min="10" max="500"
                    value={form.price}
                    onChange={set('price')}
                  />
                </div>
              </div>
            </div>
            <Button fullWidth size="md" loading={loading} onClick={handlePublish} icon={<ShieldCheck size={16} />}>
              Publish Women-Only Ride
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="bg-brand-50 border border-brand-200 rounded-3xl p-7 mb-5 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-white mx-auto mb-4 flex items-center justify-center shadow-sm border border-brand-100"
            >
              <CheckCircle size={30} className="text-brand-600" />
            </motion.div>
            <h3 className="font-black text-surface-950 text-xl mb-1">Ride Published ✓</h3>
            <p className="text-sm text-surface-500 mb-4 max-w-xs mx-auto">
              Only verified female students can see and request your ride.
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Badge variant="brand">👩 Women Only</Badge>
              <Badge variant="success" dot>Live</Badge>
            </div>
            <button
              onClick={() => { setPublished(false); setForm({ from: '', to: '', time: '8:00 AM', price: '' }); }}
              className="mt-5 text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              Publish another ride
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info rows */}
      <div className="space-y-3">
        {[
          { icon: '🔐', title: 'Rider identity verified', desc: 'Every female rider is verified via college ID before requesting.' },
          { icon: '📍', title: 'Live tracking enabled', desc: 'Your route is shared with the rider and their emergency contact.' },
          { icon: '⭐', title: 'Build your reputation', desc: 'Ratings build your trust score within the women-only community.' },
        ].map((c, i) => (
          <ScrollReveal key={i} delay={i * 0.08}>
            <div className="flex items-start gap-3 bg-surface-50 rounded-2xl p-4 border border-surface-100">
              <span className="text-2xl flex-shrink-0">{c.icon}</span>
              <div>
                <p className="font-bold text-surface-900 text-sm">{c.title}</p>
                <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

// ─── Safety promise strip ─────────────────────────────────────────────────────
function SafetyStrip() {
  return (
    <section className="py-16 bg-surface-50 border-t border-surface-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="text-center mb-10">
          <p className="text-brand-600 font-semibold text-sm tracking-widest uppercase mb-2">Our Promise</p>
          <h2 className="text-3xl font-black text-surface-950">Safety at every step</h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROMISES.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="bg-white rounded-3xl p-5 card-shadow border border-surface-50 hover:border-brand-100 transition-colors"
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-surface-900 text-sm mb-1.5">{p.title}</h3>
                <p className="text-xs text-surface-500 leading-relaxed">{p.desc}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WomenOnlyPage() {
  const { isAuthenticated, isFemale, loading } = useAuth();
  const [role, setRole] = useState(null); // null | 'rider' | 'driver'
  const navigate = useNavigate();

  // Scroll to role section when role is set
  useEffect(() => {
    if (role) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Hero — always visible */}
      <WomenHero onGetStarted={() => {
        const el = document.getElementById('women-gate');
        el?.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* Role section */}
      <div id="women-gate">
        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div
              key="gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <AccessGate onSelectRole={setRole} />
            </motion.div>
          ) : role === 'rider' ? (
            <motion.div
              key="rider"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <RiderView onSwitchRole={() => setRole(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="driver"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <DriverView onSwitchRole={() => setRole(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Safety strip — always visible */}
      <SafetyStrip />
      <Footer />
    </div>
  );
}
