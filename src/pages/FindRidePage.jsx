import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Calendar, ChevronDown, Clock,
  Search, SlidersHorizontal
} from 'lucide-react';
import { useState } from 'react';
import { searchRides } from '../services/ridesService';
import LocationInput from '../components/ui/LocationInput';
import RideCard from '../components/rides/RideCard';
import Button from '../components/ui/Button';
import { RideCardSkeleton } from '../components/ui/Skeleton';
import BookingModal from '../components/rides/BookingModal';
import RideDetailsModal from '../components/rides/RideDetailsModal';
import { useToast } from '../components/ui/Toast';

const FILTERS = ['All', 'Cheapest', 'Earliest', 'Women Only', 'Female Driver'];

function SelectField({ label, icon, value, onChange, options }) {
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500">{icon}</span>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-9 pr-8 py-3 rounded-2xl bg-surface-50 border border-surface-100
                     text-surface-900 font-semibold text-sm appearance-none
                     focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300
                     transition-all duration-200 cursor-pointer"
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function FindRidePage() {
  const toast = useToast();
  const [from,    setFrom]    = useState('');
  const [fromLat, setFromLat] = useState(null);
  const [fromLng, setFromLng] = useState(null);
  const [to,      setTo]      = useState('');
  const [toLat,   setToLat]   = useState(null);
  const [toLng,   setToLng]   = useState(null);
  const [date, setDate] = useState('Today');
  const [time, setTime] = useState('8:00 AM');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingRide, setBookingRide] = useState(null);
  const [detailsRide, setDetailsRide] = useState(null);

  const [showingAll, setShowingAll] = useState(false);

  const swapLocations = () => {
    setFrom(to);    setFromLat(toLat);   setFromLng(toLng);
    setTo(from);    setToLat(fromLat);   setToLng(fromLng);
  };

  const handleSearch = async () => {
    if (!from || !to) { toast('Please enter pickup and destination', 'error'); return; }
    setLoading(true);
    setSearched(false);
    setShowingAll(false);
    try {
      const resolveDate = (d) => {
        if (d === 'Today')    return new Date().toISOString().split('T')[0];
        if (d === 'Tomorrow') { const t = new Date(); t.setDate(t.getDate() + 1); return t.toISOString().split('T')[0]; }
        return null;
      };
      const data = await searchRides({
        from, to,
        fromLat, fromLng,
        toLat, toLng,
        date: resolveDate(date),
        radiusKm: 10,
      });
      setResults(data);
    } catch (err) {
      toast(err.message || 'Search failed', 'error');
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleShowAll = async () => {
    setLoading(true);
    setSearched(false);
    setShowingAll(true);
    setActiveFilter('All');
    try {
      const data = await searchRides({});
      setResults(data);
    } catch (err) {
      toast(err.message || 'Could not load rides', 'error');
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const filteredResults = results.filter(r => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Women Only') return r.preference === 'women-only';
    if (activeFilter === 'Female Driver') return r.driver?.gender === 'female';
    if (activeFilter === 'Cheapest') return true;
    if (activeFilter === 'Earliest') return true;
    return true;
  }).sort((a, b) => {
    if (activeFilter === 'Cheapest') return (a.price_per_seat ?? a.price ?? 0) - (b.price_per_seat ?? b.price ?? 0);
    if (activeFilter === 'Earliest') return a.time.localeCompare(b.time);
    return 0;
  });

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-28 sm:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8 pt-4"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-surface-950 mb-2">Find a Ride</h1>
          <p className="text-surface-500">Search verified rides on your route</p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-6 card-shadow border border-surface-100 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* From/To with swap */}
            <div className="flex flex-1 gap-2 items-end">
              <LocationInput
                label="From"
                value={from}
                onChange={setFrom}
                onSelect={({ label, lat, lng }) => { setFrom(label); setFromLat(lat); setFromLng(lng); }}
                placeholder="Pickup location"
              />
              {/* Swap button */}
              <motion.button
                onClick={swapLocations}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="mb-0.5 w-10 h-10 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-100
                           flex items-center justify-center text-brand-600 flex-shrink-0 transition-colors"
                aria-label="Swap locations"
              >
                <ArrowRight size={16} />
              </motion.button>
              <LocationInput
                label="To"
                value={to}
                onChange={setTo}
                onSelect={({ label, lat, lng }) => { setTo(label); setToLat(lat); setToLng(lng); }}
                placeholder="Destination"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <SelectField
              label="Date"
              icon={<Calendar size={15} />}
              value={date}
              onChange={setDate}
              options={['Today', 'Tomorrow', 'Sep 1', 'Sep 2', 'Sep 3']}
            />
            <SelectField
              label="Time"
              icon={<Clock size={15} />}
              value={time}
              onChange={setTime}
              options={['Any time', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM']}
            />
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleSearch}
            loading={loading}
            icon={<Search size={18} />}
          >
            Search Rides
          </Button>

          {/* Browse all rides */}
          <button
            onClick={handleShowAll}
            disabled={loading}
            className="w-full mt-3 py-2.5 text-sm font-semibold text-brand-600 hover:text-brand-700
                       transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <span>Browse all available rides</span>
            <span className="text-surface-400">→</span>
          </button>
        </motion.div>

        {/* Loading skeletons */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <RideCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {searched && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Results header + filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-surface-900">
                    {filteredResults.length} ride{filteredResults.length !== 1 ? 's' : ''} found
                  </p>
                  {showingAll
                    ? <span className="text-surface-400 text-sm">· All available rides</span>
                    : <span className="text-surface-400 text-sm">· {from} → {to}{(fromLat || toLat) ? ' · within 10km' : ''}</span>
                  }
                  {showingAll && (
                    <button
                      onClick={() => { setSearched(false); setShowingAll(false); setResults([]); }}
                      className="text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal size={15} className="text-surface-400" />
                  <span className="text-xs text-surface-400 font-medium mr-1">Filter:</span>
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
                {FILTERS.map(f => (
                  <motion.button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold
                      transition-all duration-200 border
                      ${activeFilter === f
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-surface-600 border-surface-200 hover:border-brand-200 hover:text-brand-600'
                      }
                    `}
                  >
                    {f}
                  </motion.button>
                ))}
              </div>

              {/* Ride cards */}
              {filteredResults.length > 0 ? (
                <div className="space-y-4">
                  {filteredResults.map((ride, i) => (
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-12 text-center card-shadow border border-surface-100"
                >
                  <div className="text-5xl mb-4">🚗</div>
                  <h3 className="text-xl font-bold text-surface-900 mb-2">No rides found</h3>
                  <p className="text-surface-500 text-sm mb-6">
                    {showingAll ? 'No rides available right now. Check back soon!' : 'Try different locations or browse all available rides.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="secondary" onClick={() => setActiveFilter('All')}>
                      Clear Filter
                    </Button>
                    {!showingAll && (
                      <Button onClick={handleShowAll}>
                        Browse All Rides
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state — before search */}
        {!searched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-3xl bg-brand-50 mx-auto mb-4 flex items-center justify-center">
              <Search size={32} className="text-brand-300" />
            </div>
            <p className="text-surface-500 font-medium mb-4">Search for rides to get started</p>
            <button
              onClick={handleShowAll}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors
                         bg-brand-50 border border-brand-100 px-5 py-2.5 rounded-2xl"
            >
              Browse all available rides →
            </button>
          </motion.div>
        )}
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
