import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Calendar, Car, CheckCircle, Clock,
  MapPin, Users
} from 'lucide-react';
import { useState } from 'react';
import { createRide } from '../services/ridesService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import ScrollReveal from '../components/ui/ScrollReveal';
import { useToast } from '../components/ui/Toast';

export default function OfferRidePage() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    from: '',
    to: '',
    date: 'Today',
    time: '8:00 AM',
    seats: '3',
    price: '',
    preference: 'everyone',
  });
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handlePublish = async () => {
    if (!form.from || !form.to || !form.price) {
      toast('Please fill in all required fields', 'error');
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
        driver_id:       user?.id,
        from_label:      form.from,
        to_label:        form.to,
        date:            resolveDate(form.date),
        time:            form.time,
        available_seats: parseInt(form.seats, 10),
        total_seats:     parseInt(form.seats, 10),
        price_per_seat:  parseFloat(form.price),
        preference:      form.preference,
        status:          'upcoming',
      });

      setPublished(true);
      toast('Ride published!', 'success');
    } catch (err) {
      toast(err.message || 'Failed to publish ride', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    w-full px-4 py-3 rounded-2xl bg-surface-50 border border-surface-100
    text-surface-900 font-medium text-sm placeholder:text-surface-300
    focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300
    transition-all duration-200
  `;

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

        {/* Form / Success */}
        <AnimatePresence mode="wait">
          {!published ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-7 card-shadow border border-surface-100"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">From *</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <input className={`${inputClass} pl-9`} placeholder="Pickup location" value={form.from} onChange={set('from')} />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">To *</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <input className={`${inputClass} pl-9`} placeholder="Destination" value={form.to} onChange={set('to')} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Date</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <select className={`${inputClass} pl-9 appearance-none cursor-pointer`} value={form.date} onChange={set('date')}>
                      {['Today', 'Tomorrow', 'Sep 1', 'Sep 2', 'Sep 3'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Time</label>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <select className={`${inputClass} pl-9 appearance-none cursor-pointer`} value={form.time} onChange={set('time')}>
                      {['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '5:00 PM', '5:30 PM', '6:00 PM'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Seats Available</label>
                  <div className="relative">
                    <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <select className={`${inputClass} pl-9 appearance-none cursor-pointer`} value={form.seats} onChange={set('seats')}>
                      {['1', '2', '3', '4'].map(s => <option key={s} value={s}>{s} seat{Number(s) > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Price per seat *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      className={`${inputClass} pl-7`}
                      placeholder="80"
                      value={form.price}
                      onChange={set('price')}
                      min="10"
                      max="500"
                    />
                  </div>
                </div>
              </div>

              {/* Preference */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-surface-500 mb-2 pl-1">Rider Preference</label>
                <div className="flex gap-3">
                  {[
                    { value: 'everyone',   label: '👥 Everyone'   },
                    { value: 'women-only', label: '👩 Women Only' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, preference: opt.value }))}
                      className={`
                        flex-1 py-2.5 px-4 rounded-2xl text-sm font-semibold border-2 transition-all duration-200
                        ${form.preference === opt.value
                          ? 'bg-brand-50 border-brand-400 text-brand-700'
                          : 'bg-surface-50 border-surface-100 text-surface-600 hover:border-surface-200'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button fullWidth size="lg" loading={loading} onClick={handlePublish} icon={<Car size={18} />}>
                Publish Ride
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="text-center"
            >
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

              <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-2xl font-black text-surface-950 mb-2">
                Ride Published ✓
              </motion.h3>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-surface-500 text-sm mb-6">
                Your ride is live. Students can now request seats.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 22 }}
                className="bg-white rounded-3xl p-5 card-shadow border border-surface-100 text-left mb-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-surface-900">
                    <span>{form.from}</span>
                    <ArrowRight size={14} className="text-brand-500" />
                    <span>{form.to}</span>
                  </div>
                  <span className="font-black text-brand-600 text-lg">₹{form.price}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-surface-500 font-medium">
                  <span>🕐 {form.time}</span>
                  <span>📅 {form.date}</span>
                  <span>💺 {form.seats}</span>
                  <span className="ml-auto bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Live</span>
                </div>
              </motion.div>

              <Button variant="secondary" onClick={() => {
                setPublished(false);
                setForm({ from: '', to: '', date: 'Today', time: '8:00 AM', seats: '3', price: '', preference: 'everyone' });
              }}>
                Offer Another Ride
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
