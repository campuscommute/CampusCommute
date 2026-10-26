import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Car, CheckCircle, Clock,
  MapPin, Phone, Play, Star, Users, X, Zap, KeyRound, AlertTriangle
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyBookings, rateBooking,
  driverVerifyOTP, getMyOfferedRides,
} from '../services/bookingsService';
import { startRide, completeRide, cancelRide } from '../services/ridesService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig = {
  upcoming:  { label: 'Upcoming',         badge: 'brand',   icon: <Clock size={12} />,        dot: false },
  confirmed: { label: 'Confirmed',        badge: 'brand',   icon: <Clock size={12} />,        dot: false },
  active:    { label: 'Ride in Progress', badge: 'success', icon: <Zap size={12} />,          dot: true  },
  completed: { label: 'Completed ✓',      badge: 'neutral', icon: <CheckCircle size={12} />,  dot: false },
  cancelled: { label: 'Cancelled',        badge: 'danger',  icon: <X size={12} />,            dot: false },
};

// ─── OTP Input (4 digit boxes) ────────────────────────────────────────────────
function OTPInput({ onSubmit, loading }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 3) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setDigits(pasted.split(''));
      refs[3].current?.focus();
    }
  };

  const otp = digits.join('');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`
              w-12 h-14 rounded-2xl text-center text-2xl font-black border-2 outline-none
              transition-all duration-150
              ${d
                ? 'border-brand-400 bg-brand-50 text-brand-700'
                : 'border-surface-200 bg-surface-50 text-surface-900'
              }
              focus:border-brand-500 focus:bg-brand-50
            `}
          />
        ))}
      </div>
      <Button
        fullWidth
        size="md"
        loading={loading}
        disabled={otp.length < 4}
        onClick={() => onSubmit(otp)}
        icon={<CheckCircle size={16} />}
      >
        Verify OTP
      </Button>
    </div>
  );
}

// ─── Passenger row inside driver's ride card ──────────────────────────────────
function PassengerRow({ booking, onVerified }) {
  const toast = useToast();
  const [verifying, setVerifying] = useState(false);
  const [showOTP, setShowOTP] = useState(false);

  const passenger = booking.passenger;
  const isVerified = booking.otp_verified;
  const isActive   = booking.status === 'active';
  const isPending  = booking.status === 'pending';

  const handleVerify = async (otp) => {
    setVerifying(true);
    try {
      await driverVerifyOTP(booking.id, otp);
      toast(`${passenger?.name ?? 'Passenger'} verified! ✓`, 'success');
      setShowOTP(false);
      onVerified?.(booking.id);
    } catch (err) {
      toast(err.message || 'OTP verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      layout
      className="bg-surface-50 rounded-2xl p-3.5 border border-surface-100"
    >
      <div className="flex items-center gap-3">
        <Avatar name={passenger?.name} size="sm" verified={passenger?.is_verified} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-900 text-sm truncate">{passenger?.name ?? 'Passenger'}</p>
          <p className="text-xs text-surface-400 truncate">{passenger?.college}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPending && (
            <Badge variant="neutral">Pending</Badge>
          )}
          {isVerified || isActive ? (
            <Badge variant="success" dot>
              <CheckCircle size={10} /> Verified
            </Badge>
          ) : !isPending && (
            <button
              onClick={() => setShowOTP(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100 hover:bg-brand-100 transition-colors"
            >
              <KeyRound size={12} />
              Enter OTP
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showOTP && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-surface-200 mt-3">
              <p className="text-xs text-surface-500 text-center mb-3">
                Ask <strong>{passenger?.name}</strong> for their 4-digit OTP
              </p>
              <OTPInput onSubmit={handleVerify} loading={verifying} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Driver's offered ride card ───────────────────────────────────────────────
function OfferedRideCard({ ride, index, onUpdate }) {
  const toast    = useToast();
  const navigate = useNavigate();
  const [expanded,  setExpanded]  = useState(false);
  const [starting,  setStarting]  = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [passengers, setPassengers] = useState(ride.bookings ?? []);

  const status     = ride.status;
  const statusCfg  = statusConfig[status] ?? statusConfig.upcoming;
  const confirmed  = passengers.filter(b => b.status === 'confirmed' || b.status === 'active');
  const pending    = passengers.filter(b => b.status === 'pending');
  const allVerified = confirmed.length > 0 && confirmed.every(b => b.otp_verified || b.status === 'active');

  const handleStart = async () => {
    if (confirmed.length === 0) {
      toast('No confirmed passengers yet. Wait for bookings to be confirmed.', 'info');
      return;
    }
    // Block start until every confirmed passenger has verified their OTP
    const unverified = confirmed.filter(b => !b.otp_verified && b.status !== 'active');
    if (unverified.length > 0) {
      const names = unverified.map(b => b.passenger?.name ?? 'Passenger').join(', ');
      toast(`Verify OTP for: ${names} before starting`, 'error');
      setExpanded(true); // open passenger list so driver can see who needs verification
      return;
    }
    setStarting(true);
    try {
      await startRide(ride.id);
      toast('Ride started!', 'success');
      onUpdate?.();
    } catch (err) {
      toast(err.message || 'Failed to start ride', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeRide(ride.id);
      toast('Ride completed! ✓', 'success');
      onUpdate?.();
    } catch (err) {
      toast(err.message || 'Failed to complete ride', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ride? All passengers will be notified.')) return;
    setCancelling(true);
    try {
      await cancelRide(ride.id);
      toast('Ride cancelled', 'info');
      onUpdate?.();
    } catch (err) {
      toast(err.message || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handlePassengerVerified = (bookingId) => {
    setPassengers(prev =>
      prev.map(b => b.id === bookingId ? { ...b, otp_verified: true, status: 'active' } : b)
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-3xl p-5 card-shadow border border-surface-50"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={statusCfg.badge} dot={statusCfg.dot}>
              {statusCfg.icon}
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-xs text-surface-400">
            {ride.date ? new Date(ride.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            {' · '}{ride.time}
          </p>
        </div>
        <div className="text-right">
          <p className="font-black text-brand-600 text-lg">₹{ride.price_per_seat}</p>
          <p className="text-xs text-surface-400">per seat</p>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 bg-surface-50 rounded-2xl px-4 py-3 mb-3">
        <div className="flex-1">
          <p className="text-xs text-surface-400 font-medium">From</p>
          <p className="font-bold text-surface-900 text-sm">{ride.from_label}</p>
        </div>
        <ArrowRight size={14} className="text-brand-400 flex-shrink-0" />
        <div className="flex-1 text-right">
          <p className="text-xs text-surface-400 font-medium">To</p>
          <p className="font-bold text-surface-900 text-sm">{ride.to_label}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs bg-surface-100 text-surface-600 font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
          <Users size={11} /> {ride.available_seats}/{ride.total_seats} seats
        </span>
        {ride.vehicle_model && (
          <span className="text-xs bg-surface-100 text-surface-600 font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Car size={11} /> {ride.vehicle_model}
          </span>
        )}
        {ride.vehicle_plate && (
          <span className="text-xs bg-surface-100 text-surface-600 font-mono font-bold px-2.5 py-1 rounded-full">
            {ride.vehicle_plate}
          </span>
        )}
        {confirmed.length > 0 && (
          <span className="text-xs bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle size={10} /> {confirmed.length} confirmed
          </span>
        )}
        {pending.length > 0 && (
          <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock size={10} /> {pending.length} pending
          </span>
        )}
      </div>

      {/* Passengers toggle */}
      {passengers.length > 0 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-surface-50 border border-surface-100 text-sm font-semibold text-surface-700 hover:bg-surface-100 transition-colors mb-3"
        >
          <span className="flex items-center gap-2">
            <Users size={14} className="text-brand-500" />
            {passengers.length} Passenger{passengers.length !== 1 ? 's' : ''}
          </span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            ↓
          </motion.span>
        </button>
      )}

      <AnimatePresence>
        {expanded && passengers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-3"
          >
            <div className="space-y-2">
              {passengers.map(booking => (
                <PassengerRow
                  key={booking.id}
                  booking={booking}
                  onVerified={handlePassengerVerified}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {status === 'upcoming' && (
        <div className="flex gap-2">
          <Button
            variant={allVerified || confirmed.length === 0 ? 'primary' : 'secondary'}
            size="sm"
            className="flex-1"
            icon={<Play size={14} />}
            loading={starting}
            onClick={handleStart}
            title={!allVerified && confirmed.length > 0 ? 'Verify all passenger OTPs first' : ''}
          >
            {!allVerified && confirmed.length > 0 ? 'Verify OTPs First' : 'Start Ride'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<Users size={14} />}
            onClick={() => setExpanded(v => !v)}
          >
            Passengers
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={cancelling}
            onClick={handleCancel}
            className="text-red-500 hover:bg-red-50 border border-red-100"
          >
            Cancel
          </Button>
        </div>
      )}

      {status === 'active' && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon={<MapPin size={14} />}
            onClick={() => navigate(`/live-ride?rideId=${ride.id}&driver=true`)}
          >
            Live Tracking
          </Button>
          <Button
            variant="success"
            size="sm"
            className="flex-1"
            loading={completing}
            icon={<CheckCircle size={14} />}
            onClick={handleComplete}
          >
            Complete Ride
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Passenger booking row ────────────────────────────────────────────────────
function RideRow({ booking, index }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [rating, setRating] = useState(booking.passenger_rating ?? 0);
  const [rated,  setRated]  = useState(!!booking.passenger_rating);

  const ride   = booking.ride ?? booking;
  const driver = ride?.driver ?? booking.driver;
  const status = booking.status ?? ride?.status ?? 'upcoming';
  const statusCfg = statusConfig[status] ?? statusConfig.upcoming;

  const fromLabel = ride?.from_label ?? ride?.from ?? '—';
  const toLabel   = ride?.to_label   ?? ride?.to   ?? '—';
  const price     = booking.total_amount ?? ride?.price_per_seat ?? ride?.price ?? 0;
  const otp       = booking.otp;

  const handleRate = async (stars) => {
    try {
      await rateBooking(booking.id, { score: stars, comment: '' });
      setRating(stars);
      setRated(true);
      toast(`Rated ${stars} stars — thank you!`, 'success');
    } catch (err) {
      toast(err.message || 'Rating failed', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-3xl p-5 card-shadow border border-surface-50"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={driver?.name} size="md" verified={driver?.is_verified ?? driver?.verified} />
          <div>
            <p className="font-bold text-surface-900 text-sm">{driver?.name ?? 'Driver'}</p>
            <p className="text-xs text-surface-400">{driver?.college}</p>
          </div>
        </div>
        <Badge variant={statusCfg.badge} dot={statusCfg.dot}>
          {statusCfg.icon}
          {statusCfg.label}
        </Badge>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 bg-surface-50 rounded-2xl px-4 py-3 mb-3">
        <div className="flex-1">
          <p className="text-xs text-surface-400 font-medium">From</p>
          <p className="font-bold text-surface-900 text-sm">{fromLabel}</p>
        </div>
        <ArrowRight size={14} className="text-brand-400 flex-shrink-0" />
        <div className="flex-1 text-right">
          <p className="text-xs text-surface-400 font-medium">To</p>
          <p className="font-bold text-surface-900 text-sm">{toLabel}</p>
        </div>
      </div>

      {/* Meta + OTP */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs bg-surface-100 text-surface-600 font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock size={11} /> {ride?.time ?? '—'}
        </span>
        <span className="text-xs bg-surface-100 text-surface-600 font-medium px-2.5 py-1 rounded-full">
          📅 {ride?.date ? new Date(ride.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
        </span>
        <span className="text-xs bg-brand-50 text-brand-700 font-bold px-2.5 py-1 rounded-full">
          ₹{price}
        </span>
        {/* OTP — show prominently only for confirmed (not-yet-started) rides */}
        {otp && (status === 'confirmed' || status === 'upcoming') && (
          <span className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 font-mono font-bold px-2.5 py-1 rounded-full border border-amber-100">
            <KeyRound size={10} /> OTP: {otp}
          </span>
        )}
      </div>

      {/* Actions */}
      {(status === 'upcoming' || status === 'confirmed') && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon={<MapPin size={14} />}
            onClick={() => navigate(`/live-ride?bookingId=${booking.id}`)}
          >
            Track Ride
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<Phone size={14} />}
            onClick={() => driver?.id ? navigate(`/messages?userId=${driver.id}`) : toast("Contact not available", 'info')}
          >
            Contact Driver
          </Button>
        </div>
      )}

      {status === 'active' && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon={<Zap size={14} />}
            onClick={() => navigate(`/live-ride?bookingId=${booking.id}`)}
          >
            View Live Ride
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => toast('🚨 SOS alert sent to your emergency contacts!', 'error')}
          >
            SOS
          </Button>
        </div>
      )}

      {status === 'completed' && !rated && (
        <div>
          <p className="text-xs font-semibold text-surface-500 mb-2">Rate this ride</p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <motion.button
                key={star}
                onClick={() => handleRate(star)}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                className="text-2xl transition-all"
              >
                <Star
                  size={22}
                  className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'}
                  fill={star <= rating ? 'currentColor' : 'none'}
                />
              </motion.button>
            ))}
            <span className="text-xs text-surface-400 ml-2">Tap to rate</span>
          </div>
        </div>
      )}

      {status === 'completed' && rated && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-surface-500"
        >
          <CheckCircle size={14} className="text-green-500" />
          <span>You rated this ride {rating} ★ — thanks!</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const PASSENGER_TABS = ['Upcoming', 'Active', 'Completed'];

export default function MyRidesPage() {
  const { user, profile } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [mode,         setMode]         = useState('passenger'); // 'passenger' | 'driver'
  const [activeTab,    setActiveTab]    = useState('Upcoming');
  const [bookings,     setBookings]     = useState([]);
  const [offeredRides, setOfferedRides] = useState([]);
  const [loading,      setLoading]      = useState(true);

  const profileId = profile?.id ?? user?.id;

  const loadPassengerRides = () => {
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    getMyBookings(profileId)
      .then(data => setBookings(data ?? []))
      .catch(err => toast(err.message || 'Could not load rides', 'error'))
      .finally(() => setLoading(false));
  };

  const loadOfferedRides = () => {
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    getMyOfferedRides(profileId)
      .then(data => setOfferedRides(data ?? []))
      .catch(err => toast(err.message || 'Could not load offered rides', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (mode === 'passenger') loadPassengerRides();
    else loadOfferedRides();
  }, [user, profile, mode]);

  // Passenger tab filtering
  const tabStatuses = {
    Upcoming:  ['upcoming', 'confirmed'],
    Active:    ['active'],
    Completed: ['completed'],
  };
  const filtered = bookings.filter(b => tabStatuses[activeTab]?.includes(b.status));
  const counts = {
    Upcoming:  bookings.filter(b => tabStatuses.Upcoming.includes(b.status)).length,
    Active:    bookings.filter(b => tabStatuses.Active.includes(b.status)).length,
    Completed: bookings.filter(b => tabStatuses.Completed.includes(b.status)).length,
  };

  // Driver tab filtering
  const driverTabs  = ['Upcoming', 'Active', 'Completed', 'Cancelled'];
  const [driverTab, setDriverTab] = useState('Upcoming');
  const driverTabStatuses = {
    Upcoming:  ['upcoming'],
    Active:    ['active'],
    Completed: ['completed'],
    Cancelled: ['cancelled'],
  };
  const filteredOffered = offeredRides.filter(r =>
    driverTabStatuses[driverTab]?.includes(r.status)
  );
  const driverCounts = {
    Upcoming:  offeredRides.filter(r => r.status === 'upcoming').length,
    Active:    offeredRides.filter(r => r.status === 'active').length,
    Completed: offeredRides.filter(r => r.status === 'completed').length,
    Cancelled: offeredRides.filter(r => r.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-28 sm:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-5"
        >
          <h1 className="text-3xl font-black text-surface-950 mb-1">My Rides</h1>
          <p className="text-surface-400 text-sm">All your past and upcoming trips</p>
        </motion.div>

        {/* Mode toggle: Passenger / Driver */}
        <div className="flex gap-1 bg-surface-100 rounded-2xl p-1 mb-5">
          {[
            { id: 'passenger', label: 'As Passenger' },
            { id: 'driver',    label: 'As Driver' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`
                flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${mode === m.id
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
                }
              `}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ── PASSENGER MODE ── */}
        {mode === 'passenger' && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-surface-100 rounded-2xl p-1 mb-6">
              {PASSENGER_TABS.map(tab => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                    flex items-center justify-center gap-1.5
                    ${activeTab === tab
                      ? 'bg-white text-surface-900 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700'
                    }
                  `}
                >
                  {tab}
                  {counts[tab] > 0 && (
                    <span className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                      ${activeTab === tab
                        ? tab === 'Active' ? 'bg-green-100 text-green-700'
                          : 'bg-brand-100 text-brand-700'
                        : 'bg-surface-200 text-surface-500'
                      }
                    `}>
                      {counts[tab]}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-3xl p-5 card-shadow border border-surface-50 animate-pulse h-44" />
                    ))}
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="space-y-4">
                    {filtered.map((booking, i) => (
                      <RideRow key={booking.id} booking={booking} index={i} />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-12 text-center card-shadow border border-surface-100"
                  >
                    <div className="text-5xl mb-4">
                      {activeTab === 'Active' ? '🚗' : activeTab === 'Upcoming' ? '📅' : '✅'}
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 mb-2">No {activeTab.toLowerCase()} rides</h3>
                    <p className="text-surface-400 text-sm mb-4">
                      {activeTab === 'Upcoming' ? "You haven't booked any upcoming rides yet." :
                       activeTab === 'Active'   ? "No ride is currently in progress." :
                                                 "Your completed rides will appear here."}
                    </p>
                    {activeTab === 'Upcoming' && (
                      <Button onClick={() => navigate('/find-ride')} icon={<MapPin size={15} />}>
                        Find a Ride
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {/* ── DRIVER MODE ── */}
        {mode === 'driver' && (
          <>
            {/* Driver sub-tabs */}
            <div className="flex gap-1 bg-surface-100 rounded-2xl p-1 mb-6 overflow-x-auto">
              {driverTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setDriverTab(tab)}
                  className={`
                    flex-shrink-0 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                    flex items-center justify-center gap-1.5
                    ${driverTab === tab
                      ? 'bg-white text-surface-900 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700'
                    }
                  `}
                >
                  {tab}
                  {driverCounts[tab] > 0 && (
                    <span className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                      ${driverTab === tab ? 'bg-brand-100 text-brand-700' : 'bg-surface-200 text-surface-500'}
                    `}>
                      {driverCounts[tab]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={driverTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <div key={i} className="bg-white rounded-3xl p-5 card-shadow border border-surface-50 animate-pulse h-52" />
                    ))}
                  </div>
                ) : filteredOffered.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOffered.map((ride, i) => (
                      <OfferedRideCard
                        key={ride.id}
                        ride={ride}
                        index={i}
                        onUpdate={loadOfferedRides}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-12 text-center card-shadow border border-surface-100"
                  >
                    <div className="text-5xl mb-4">🚗</div>
                    <h3 className="text-xl font-bold text-surface-900 mb-2">
                      No {driverTab.toLowerCase()} rides offered
                    </h3>
                    <p className="text-surface-400 text-sm mb-4">
                      {driverTab === 'Upcoming' ? "You haven't offered any rides yet." :
                       `No ${driverTab.toLowerCase()} rides to show.`}
                    </p>
                    {driverTab === 'Upcoming' && (
                      <Button onClick={() => navigate('/offer-ride')} icon={<Car size={15} />}>
                        Offer a Ride
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
