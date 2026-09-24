import { motion } from 'framer-motion';
import {
  ArrowRight, Bell, Calendar, Car, CheckCircle,
  Clock, GraduationCap, MapPin, Star, TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchRides } from '../services/ridesService';
import { getMyBookings } from '../services/bookingsService';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import RideCard from '../components/rides/RideCard';
import BookingModal from '../components/rides/BookingModal';
import RideDetailsModal from '../components/rides/RideDetailsModal';
import { useToast } from '../components/ui/Toast';
import ScrollReveal from '../components/ui/ScrollReveal';

function StatCard({ label, value, icon, color = 'brand', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-2xl p-4 card-shadow border border-surface-50 flex items-center gap-3"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        color === 'brand' ? 'bg-brand-50' :
        color === 'green' ? 'bg-green-50' :
        color === 'amber' ? 'bg-amber-50' : 'bg-surface-50'
      }`}>
        <span className={`${
          color === 'brand' ? 'text-brand-600' :
          color === 'green' ? 'text-green-600' :
          color === 'amber' ? 'text-amber-600' : 'text-surface-500'
        }`}>{icon}</span>
      </div>
      <div>
        <p className="text-xl font-black text-surface-950">{value}</p>
        <p className="text-xs text-surface-400 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

function UpcomingRideCard({ booking }) {
  const navigate = useNavigate();
  const ride   = booking.ride ?? booking;
  const driver = ride?.driver ?? booking.driver;
  const from   = ride?.from_label ?? ride?.from ?? '—';
  const to     = ride?.to_label   ?? ride?.to   ?? '—';
  const price  = booking.total_amount ?? ride?.price_per_seat ?? ride?.price ?? 0;
  const date   = ride?.date
    ? new Date(ride.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl p-5 text-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-white/20 text-white border-0 text-xs">Upcoming</Badge>
          <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
            <Calendar size={12} />
            <span>{date}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white/40" />
            <div className="w-0.5 h-8 bg-white/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/60 border-2 border-white/40" />
          </div>
          <div className="flex flex-col justify-between h-14">
            <div>
              <p className="text-white/70 text-xs">From</p>
              <p className="font-bold text-white">{from}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">To</p>
              <p className="font-bold text-white">{to}</p>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-white">₹{price}</p>
            <p className="text-white/60 text-xs">{ride?.time ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar name={driver?.name} size="sm" verified={driver?.is_verified ?? driver?.verified} />
          <span className="text-white/80 text-sm font-medium flex-1">{driver?.name ?? 'Driver'}</span>
          <Button
            size="xs"
            className="bg-white text-brand-700 hover:bg-white/90 border-0 font-bold"
            onClick={() => navigate('/my-rides')}
          >
            View Ride
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate   = useNavigate();
  const toast      = useToast();
  const { user, profile } = useAuth();

  const [bookingRide,  setBookingRide]  = useState(null);
  const [detailsRide,  setDetailsRide]  = useState(null);
  const [upcomingBooking, setUpcomingBooking] = useState(null);
  const [suggestedRides,  setSuggestedRides]  = useState([]);
  const [ridesLoading,    setRidesLoading]    = useState(true);

  // Greeting based on time of day
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Fetch real data on mount
  useEffect(() => {
    if (!user) return;

    // Fetch upcoming booking
    getMyBookings(user.id, 'confirmed')
      .then(data => setUpcomingBooking(data?.[0] ?? null))
      .catch(() => {});

    // Fetch suggested rides
    setRidesLoading(true);
    searchRides({})
      .then(data => setSuggestedRides((data ?? []).slice(0, 3)))
      .catch(() => setSuggestedRides([]))
      .finally(() => setRidesLoading(false));
  }, [user]);

  const displayName = profile?.name ?? 'there';
  const isVerified  = profile?.is_verified ?? false;
  const totalRides  = profile?.total_rides  ?? 0;
  const rating      = profile?.rating       ?? 0;
  const college     = profile?.college      ?? '';

  return (
    <div className="min-h-screen bg-surface-50 pb-28 sm:pb-8">
      {/* Top header bar */}
      <div className="bg-white border-b border-surface-100 pt-20 pb-4 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={displayName}
              src={profile?.avatar_url}
              size="md"
              verified={isVerified}
            />
            <div>
              <p className="text-xs text-surface-400 font-medium">{greeting},</p>
              <p className="font-bold text-surface-900">{displayName.split(' ')[0]}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toast('No new notifications', 'info')}
            className="relative w-10 h-10 rounded-2xl bg-surface-50 border border-surface-100 flex items-center justify-center text-surface-500 hover:text-surface-700 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border border-white" />
          </motion.button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            whileHover={{ y: -2 }}
            onClick={() => navigate('/find-ride')}
            className="bg-brand-600 rounded-3xl p-4 text-left group hover:bg-brand-700 transition-colors"
          >
            <MapPin size={22} className="text-white mb-3" />
            <p className="font-bold text-white text-sm">Find a Ride</p>
            <p className="text-white/60 text-xs mt-0.5">Search available rides</p>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -2 }}
            onClick={() => navigate('/offer-ride')}
            className="bg-white rounded-3xl p-4 text-left card-shadow border border-surface-100 group hover:border-brand-200 transition-colors"
          >
            <Car size={22} className="text-brand-600 mb-3" />
            <p className="font-bold text-surface-900 text-sm">Offer a Ride</p>
            <p className="text-surface-400 text-xs mt-0.5">Share your commute</p>
          </motion.button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Rides" value={totalRides}          icon={<TrendingUp size={18} />} color="brand" delay={0.10} />
          <StatCard label="Rating"      value={rating ? `${rating}★` : '—'} icon={<Star size={18} />}      color="amber" delay={0.15} />
          <StatCard label="Verified"    value={isVerified ? '✓' : '✗'}      icon={<CheckCircle size={18} />} color="green" delay={0.20} />
        </div>

        {/* Verification banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer transition-colors ${
            isVerified
              ? 'bg-green-50 border border-green-100 hover:bg-green-100'
              : 'bg-brand-50 border border-brand-100 hover:bg-brand-100'
          }`}
          onClick={() => navigate('/verification')}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isVerified ? 'bg-green-100' : 'bg-brand-100'
          }`}>
            <GraduationCap size={18} className={isVerified ? 'text-green-600' : 'text-brand-600'} />
          </div>
          <div className="flex-1">
            {isVerified ? (
              <>
                <p className="font-bold text-green-800 text-sm">🎓 Verified Student</p>
                <p className="text-green-600 text-xs">{college}</p>
              </>
            ) : (
              <>
                <p className="font-bold text-brand-800 text-sm">Get Verified</p>
                <p className="text-brand-600 text-xs">Unlock all features → tap to verify</p>
              </>
            )}
          </div>
          <ArrowRight size={16} className={isVerified ? 'text-green-400' : 'text-brand-400'} />
        </motion.div>

        {/* Upcoming ride */}
        {upcomingBooking && (
          <div>
            <h2 className="font-bold text-surface-900 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-brand-500" />
              Upcoming Ride
            </h2>
            <UpcomingRideCard booking={upcomingBooking} />
          </div>
        )}

        {/* Suggested rides */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-surface-900 flex items-center gap-2">
              <MapPin size={16} className="text-brand-500" />
              Suggested for You
            </h2>
            <button
              onClick={() => navigate('/find-ride')}
              className="text-brand-600 text-sm font-semibold hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              See all <ArrowRight size={14} />
            </button>
          </div>

          {ridesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-3xl h-32 animate-pulse card-shadow border border-surface-50" />
              ))}
            </div>
          ) : suggestedRides.length > 0 ? (
            <div className="space-y-4">
              {suggestedRides.map((ride, i) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  animIndex={i}
                  onRequest={() => setBookingRide(ride)}
                  onDetails={() => setDetailsRide(ride)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center card-shadow border border-surface-100">
              <div className="text-4xl mb-3">🚗</div>
              <p className="font-bold text-surface-700 mb-1">No rides available yet</p>
              <p className="text-surface-400 text-sm">Be the first to offer a ride!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RideDetailsModal
        ride={detailsRide}
        open={!!detailsRide}
        onClose={() => setDetailsRide(null)}
        onRequest={() => { setBookingRide(detailsRide); setDetailsRide(null); }}
      />
      <BookingModal
        ride={bookingRide}
        open={!!bookingRide}
        onClose={() => setBookingRide(null)}
      />
    </div>
  );
}
