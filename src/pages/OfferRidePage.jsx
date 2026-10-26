import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Calendar, Car, CheckCircle, Clock,
  Hash, List, Palette, Users
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRide } from '../services/ridesService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import LocationInput from '../components/ui/LocationInput';
import ScrollReveal from '../components/ui/ScrollReveal';
import { useToast } from '../components/ui/Toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toInputDate  = (d) => d.toISOString().split('T')[0];          // "YYYY-MM-DD"
const toDisplayDate = (iso) => {                                      // "Mon, 2 Jun"
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const todayISO    = toInputDate(new Date());
const tomorrowISO = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return toInputDate(t); })();
const minDate     = todayISO;
const maxDate     = (() => { const t = new Date(); t.setDate(t.getDate() + 30); return toInputDate(t); })();

// ─── Quick-pick date chip ─────────────────────────────────────────────────────
function QuickDate({ label, iso, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(iso)}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 ${
        selected === iso
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-surface-50 text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Time options ─────────────────────────────────────────────────────────────
const TIME_OPTIONS = [
  '6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM',
  '10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM',
  '5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','8:00 PM','9:00 PM',
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OfferRidePage() {
  const toast    = useToast();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // profile.gender — only females can post women-only rides
  const isFemale = profile?.gender === 'female';

  const [form, setForm] = useState({
    from: '', fromLat: null, fromLng: null,
    to:   '', toLat:   null, toLng:   null,
    date: todayISO,          // ISO string "YYYY-MM-DD"
    time: '8:00 AM',
    seats: '3',
    price: '',
    preference: 'everyone',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlate: '',
  });
  const [loading,   setLoading]   = useState(false);
  const [published, setPublished] = useState(false);
  const [lastRide,  setLastRide]  = useState(null);  // store published ride data for success card

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const inputClass = `
    w-full px-4 py-3 rounded-2xl bg-surface-50 border border-surface-100
    text-surface-900 font-medium text-sm placeholder:text-surface-300
    focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300
    transition-all duration-200
  `;

  const handlePublish = async () => {
    if (!form.from)  { toast('Please enter pickup location', 'error'); return; }
    if (!form.to)    { toast('Please enter destination', 'error'); return; }
    if (!form.price) { toast('Please enter price per seat', 'error'); return; }
    if (!form.date)  { toast('Please select a date', 'error'); return; }

    // Women-only guard — only female drivers can post this preference
    if (form.preference === 'women-only' && !isFemale) {
      toast('Only female drivers can offer Women Only rides', 'error');
      setForm(f => ({ ...f, preference: 'everyone' }));
      return;
    }

    const driverId = profile?.id ?? user?.id;
    if (!driverId) { toast('You must be signed in to offer a ride', 'error'); return; }

    setLoading(true);
    try {
      const ride = await createRide({
        driver_id:       driverId,
        from_label:      form.from,
        from_lat:        form.fromLat,
        from_lng:        form.fromLng,
        to_label:        form.to,
        to_lat:          form.toLat,
        to_lng:          form.toLng,
        date:            form.date,     // already "YYYY-MM-DD"
        time:            form.time,
        available_seats: parseInt(form.seats, 10),
        total_seats:     parseInt(form.seats, 10),
        price_per_seat:  parseFloat(form.price),
        preference:      form.preference,
        status:          'upcoming',
        vehicle_model:   form.vehicleModel.trim() || null,
        vehicle_color:   form.vehicleColor.trim() || null,
        vehicle_plate:   form.vehiclePlate.trim().toUpperCase() || null,
      });

      setLastRide(ride ?? form);
      setPublished(true);
      toast('Ride published! 🚗', 'success');
    } catch (err) {
      toast(err.message || 'Failed to publish ride', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPublished(false);
    setLastRide(null);
    setForm({
      from: '', fromLat: null, fromLng: null,
      to: '', toLat: null, toLng: null,
      date: todayISO, time: '8:00 AM', seats: '3', price: '',
      preference: 'everyone',
      vehicleModel: '', vehicleColor: '', vehiclePlate: '',
    });
  };

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-28 sm:pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <ScrollReveal className="text-center py-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-5 shadow-sm">
            <Car size={24} className="text-brand-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-surface-950 mb-3">
            Going that way? Offer a ride.
          </h1>
          <p className="text-surface-500 max-w-md mx-auto">
            Share your commute, split the cost, and help fellow students.
          </p>
        </ScrollReveal>

        <AnimatePresence mode="wait">

          {/* ── FORM ── */}
          {!published && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-7 card-shadow border border-surface-100"
            >
              {/* Route */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="col-span-2 sm:col-span-1">
                  <LocationInput
                    label="From"
                    value={form.from}
                    onChange={v => setForm(f => ({ ...f, from: v }))}
                    onSelect={({ label, lat, lng }) => setForm(f => ({ ...f, from: label, fromLat: lat, fromLng: lng }))}
                    placeholder="Pickup location"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <LocationInput
                    label="To"
                    value={form.to}
                    onChange={v => setForm(f => ({ ...f, to: v }))}
                    onSelect={({ label, lat, lng }) => setForm(f => ({ ...f, to: label, toLat: lat, toLng: lng }))}
                    placeholder="Destination"
                  />
                </div>
              </div>

              {/* Date — custom picker + quick chips */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-surface-500 mb-2 pl-1">
                  Date
                </label>
                {/* Quick-pick chips */}
                <div className="flex gap-2 mb-2">
                  <QuickDate label="Today"    iso={todayISO}    selected={form.date} onSelect={iso => setForm(f => ({ ...f, date: iso }))} />
                  <QuickDate label="Tomorrow" iso={tomorrowISO} selected={form.date} onSelect={iso => setForm(f => ({ ...f, date: iso }))} />
                  <span className="text-xs text-surface-400 font-medium self-center ml-1">or pick a date →</span>
                </div>
                {/* Native date input */}
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                  <input
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className={`${inputClass} pl-9 cursor-pointer`}
                  />
                </div>
                {/* Friendly display */}
                {form.date && (
                  <p className="text-xs text-brand-600 font-semibold mt-1.5 pl-1">
                    📅 {toDisplayDate(form.date)}
                  </p>
                )}
              </div>

              {/* Time + Seats + Price */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Time</label>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <select
                      className={`${inputClass} pl-9 appearance-none cursor-pointer`}
                      value={form.time}
                      onChange={set('time')}
                    >
                      {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Seats Available</label>
                  <div className="relative">
                    <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <select className={`${inputClass} pl-9 appearance-none cursor-pointer`} value={form.seats} onChange={set('seats')}>
                      {['1', '2', '3', '4'].map(s => (
                        <option key={s} value={s}>{s} seat{Number(s) > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Price per seat *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      className={`${inputClass} pl-7`}
                      placeholder="80"
                      value={form.price}
                      onChange={set('price')}
                      min="0"
                      max="999"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle info */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-surface-500 mb-2 pl-1">
                  Vehicle Details
                  <span className="font-normal text-surface-400 ml-1">(optional but recommended)</span>
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-surface-400 mb-1.5 pl-1">Model</label>
                    <div className="relative">
                      <Car size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                      <input
                        type="text"
                        className={`${inputClass} pl-8 py-2.5`}
                        placeholder="Swift, i20…"
                        value={form.vehicleModel}
                        onChange={set('vehicleModel')}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1.5 pl-1">Color</label>
                    <div className="relative">
                      <Palette size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                      <input
                        type="text"
                        className={`${inputClass} pl-8 py-2.5`}
                        placeholder="White, Red…"
                        value={form.vehicleColor}
                        onChange={set('vehicleColor')}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1.5 pl-1">Plate No.</label>
                    <div className="relative">
                      <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                      <input
                        type="text"
                        className={`${inputClass} pl-8 py-2.5 uppercase`}
                        placeholder="MH12AB1234"
                        value={form.vehiclePlate}
                        onChange={e => setForm(f => ({ ...f, vehiclePlate: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rider Preference */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-surface-500 mb-2 pl-1">Rider Preference</label>
                <div className="flex gap-3">
                  {/* Everyone — always available */}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, preference: 'everyone' }))}
                    className={`
                      flex-1 py-2.5 px-4 rounded-2xl text-sm font-semibold border-2 transition-all duration-200
                      ${form.preference === 'everyone'
                        ? 'bg-brand-50 border-brand-400 text-brand-700'
                        : 'bg-surface-50 border-surface-100 text-surface-600 hover:border-surface-200'
                      }
                    `}
                  >
                    👥 Everyone
                  </button>

                  {/* Women Only — only visible + clickable for female drivers */}
                  <div className="flex-1 relative group">
                    <button
                      type="button"
                      disabled={!isFemale}
                      onClick={() => isFemale && setForm(f => ({ ...f, preference: 'women-only' }))}
                      className={`
                        w-full py-2.5 px-4 rounded-2xl text-sm font-semibold border-2 transition-all duration-200
                        ${!isFemale
                          ? 'bg-surface-50 border-surface-100 text-surface-300 cursor-not-allowed opacity-60'
                          : form.preference === 'women-only'
                            ? 'bg-pink-50 border-pink-400 text-pink-700'
                            : 'bg-surface-50 border-surface-100 text-surface-600 hover:border-pink-200 hover:text-pink-700'
                        }
                      `}
                    >
                      👩 Women Only
                    </button>
                    {/* Tooltip for non-female users */}
                    {!isFemale && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface-900 text-white text-xs rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Only available for female drivers
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button fullWidth size="lg" loading={loading} onClick={handlePublish} icon={<Car size={18} />}>
                Publish Ride
              </Button>

              {/* Quick link to view my rides */}
              <button
                type="button"
                onClick={() => navigate('/my-rides')}
                className="w-full mt-3 py-2.5 text-sm font-semibold text-surface-500 hover:text-brand-600
                           transition-colors flex items-center justify-center gap-1.5"
              >
                <List size={14} />
                View my published rides
              </button>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {published && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="text-center"
            >
              {/* Checkmark animation */}
              <div className="flex justify-center mb-6">
                <motion.div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <CheckCircle size={48} className="text-green-500" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-green-200"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </motion.div>
              </div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-2xl font-black text-surface-950 mb-2"
              >
                Ride Published ✓
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-surface-500 text-sm mb-6"
              >
                Your ride is live. Students can now request seats.
              </motion.p>

              {/* Summary card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 22 }}
                className="bg-white rounded-3xl p-5 card-shadow border border-surface-100 text-left mb-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-surface-900 text-sm">
                    <span className="truncate max-w-[100px]">{form.from}</span>
                    <ArrowRight size={14} className="text-brand-500 flex-shrink-0" />
                    <span className="truncate max-w-[100px]">{form.to}</span>
                  </div>
                  <span className="font-black text-brand-600 text-lg flex-shrink-0">₹{form.price}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-surface-500 font-medium">
                  <span className="bg-surface-50 px-2 py-1 rounded-lg">🕐 {form.time}</span>
                  <span className="bg-surface-50 px-2 py-1 rounded-lg">📅 {toDisplayDate(form.date)}</span>
                  <span className="bg-surface-50 px-2 py-1 rounded-lg">💺 {form.seats} seat{Number(form.seats) > 1 ? 's' : ''}</span>
                  {form.vehicleModel && (
                    <span className="bg-surface-50 px-2 py-1 rounded-lg">
                      🚗 {form.vehicleModel}{form.vehicleColor ? ` · ${form.vehicleColor}` : ''}
                    </span>
                  )}
                  {form.vehiclePlate && (
                    <span className="bg-surface-50 px-2 py-1 rounded-lg font-mono">🔢 {form.vehiclePlate}</span>
                  )}
                  {form.preference === 'women-only' && (
                    <span className="bg-pink-50 text-pink-700 px-2 py-1 rounded-lg">👩 Women Only</span>
                  )}
                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg font-semibold ml-auto">● Live</span>
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="flex flex-col gap-3"
              >
                <Button
                  fullWidth
                  icon={<List size={16} />}
                  onClick={() => navigate('/my-rides')}
                >
                  View My Published Rides
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  icon={<Car size={16} />}
                  onClick={resetForm}
                >
                  Offer Another Ride
                </Button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
