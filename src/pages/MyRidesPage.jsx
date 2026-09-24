import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Car, CheckCircle, Clock,
  MapPin, Phone, Star, Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, rateBooking } from '../services/bookingsService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const TABS = ['Upcoming', 'Active', 'Completed'];

const statusConfig = {
  upcoming: {
    label: 'Upcoming',
    badge: 'brand',
    icon: <Clock size={12} />,
    dot: false,
  },
  confirmed: {
    label: 'Upcoming',
    badge: 'brand',
    icon: <Clock size={12} />,
    dot: false,
  },
  active: {
    label: 'Ride in Progress',
    badge: 'success',
    icon: <Zap size={12} />,
    dot: true,
  },
  completed: {
    label: 'Completed ✓',
    badge: 'neutral',
    icon: <CheckCircle size={12} />,
    dot: false,
  },
};

function RideRow({ booking, index }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [rating, setRating] = useState(booking.passenger_rating ?? 0);
  const [rated, setRated] = useState(!!booking.passenger_rating);

  // Normalise: booking wraps ride + driver
  const ride   = booking.ride ?? booking;
  const driver = ride?.driver ?? booking.driver;
  const status = booking.status ?? ride?.status ?? 'upcoming';
  const statusCfg = statusConfig[status] ?? statusConfig.upcoming;

  // Field aliases: Supabase uses snake_case, mock data uses camelCase
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

  const handleContactDriver = () => {
    if (driver?.id) {
      navigate(`/messages?userId=${driver.id}`);
    } else {
      toast("Driver's contact is not available", 'info');
    }
  };

  const handleSOS = () => {
    toast('🚨 SOS alert sent to your emergency contacts!', 'error');
    // In production: call an edge function / push notification API
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-3xl p-5 card-shadow border border-surface-50"
    >
      {/* Header row */}
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

      {/* Route strip */}
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

      {/* Meta chips */}
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
        {otp && (
          <span className="text-xs bg-surface-100 text-surface-500 font-mono font-bold px-2.5 py-1 rounded-full">
            OTP: {otp}
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
            onClick={handleContactDriver}
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
          <Button variant="danger" size="sm" onClick={handleSOS}>SOS</Button>
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

export default function MyRidesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    getMyBookings(user.id)
      .then(data => setBookings(data ?? []))
      .catch(err => toast(err.message || 'Could not load rides', 'error'))
      .finally(() => setLoading(false));
  }, [user, toast]);

  // Map tab labels to booking statuses
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

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 rounded-2xl p-1 mb-6">
          {TABS.map(tab => (
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

        {/* Ride list */}
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
                <h3 className="text-xl font-bold text-surface-900 mb-2">
                  No {activeTab.toLowerCase()} rides
                </h3>
                <p className="text-surface-400 text-sm">
                  {activeTab === 'Upcoming' ? "You haven't booked any upcoming rides yet." :
                   activeTab === 'Active'   ? "No ride is currently in progress." :
                                             "Your completed rides will appear here."}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
