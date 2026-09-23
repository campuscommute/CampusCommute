import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, ChevronDown, ChevronUp,
  MapPin, Navigation, Phone, Share2, X
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

// ─── Animated Map ─────────────────────────────────────────────────────────────
function LiveMap({ carPos }) {
  return (
    <svg viewBox="0 0 400 340" className="w-full h-full" aria-hidden="true">
      {/* Dark map background is the container — we use dark svg fills */}

      {/* Road grid */}
      <g stroke="#1e2533" strokeWidth="8" fill="none">
        <line x1="0" y1="170" x2="400" y2="170" />
        <line x1="200" y1="0" x2="200" y2="340" />
        <line x1="0" y1="85" x2="400" y2="85" />
        <line x1="0" y1="255" x2="400" y2="255" />
        <line x1="100" y1="0" x2="100" y2="340" />
        <line x1="300" y1="0" x2="300" y2="340" />
      </g>
      {/* Main route highlight */}
      <g stroke="#2a3040" strokeWidth="14" fill="none">
        <path d="M 80 290 C 120 240 160 200 200 170 C 240 140 300 110 340 70" />
      </g>

      {/* Animated route line */}
      <motion.path
        d="M 80 290 C 120 240 160 200 200 170 C 240 140 300 110 340 70"
        stroke="#6172f3"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="500"
        animate={{ strokeDashoffset: [500, 0] }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
      {/* Route glow */}
      <path
        d="M 80 290 C 120 240 160 200 200 170 C 240 140 300 110 340 70"
        stroke="#6172f3"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        opacity="0.12"
      />

      {/* Completed portion (grey) */}
      <motion.path
        d="M 80 290 C 95 270 110 252 125 238"
        stroke="#4a51e8"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 2.2 }}
      />

      {/* Building blocks */}
      <g fill="#1a1f2e" rx="3">
        <rect x="20" y="100" width="55" height="60" rx="4" />
        <rect x="25" y="85" width="35" height="18" rx="3" />
        <rect x="320" y="130" width="60" height="50" rx="4" />
        <rect x="325" y="115" width="40" height="18" rx="3" />
        <rect x="110" y="200" width="45" height="40" rx="3" />
        <rect x="240" y="185" width="50" height="45" rx="3" />
        <rect x="20" y="200" width="55" height="45" rx="4" />
        <rect x="330" y="200" width="55" height="45" rx="4" />
        <rect x="155" y="20" width="40" height="55" rx="3" />
        <rect x="215" y="15" width="40" height="60" rx="3" />
      </g>

      {/* Your location pin */}
      <g transform="translate(80, 290)">
        <motion.circle
          cx="0" cy="0" r="20"
          fill="#6172f3"
          opacity="0.2"
          animate={{ r: [14, 22, 14] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="0" cy="0" r="8" fill="#6172f3" />
        <circle cx="0" cy="0" r="4" fill="white" />
        <text x="-18" y="-14" fill="#a5bcfd" fontSize="8" fontWeight="700">You</text>
      </g>

      {/* Destination pin */}
      <g transform="translate(340, 70)">
        <circle cx="0" cy="0" r="10" fill="#ef4444" />
        <circle cx="0" cy="0" r="4" fill="white" />
        <text x="-14" y="-14" fill="#fca5a5" fontSize="8" fontWeight="700">GNIOT</text>
      </g>

      {/* Animated car marker */}
      <motion.g
        animate={{
          x: [0, 30, 70, 120, 165],
          y: [0, -22, -45, -68, -90],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
          delay: 0.5,
        }}
      >
        <g transform="translate(80, 290)">
          <circle cx="0" cy="0" r="14" fill="#ffffff" />
          <text x="-8" y="6" fontSize="14">🚗</text>
        </g>
      </motion.g>

      {/* ETA chip */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
      >
        <rect x="155" y="140" width="90" height="26" rx="8" fill="#6172f3" />
        <text x="200" y="157" fill="white" fontSize="10" fontWeight="700" textAnchor="middle">18 min away</text>
      </motion.g>
    </svg>
  );
}

export default function LiveRidePage() {
  const toast = useToast();
  const [cardExpanded, setCardExpanded] = useState(true);
  const [sosActive, setSosActive] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleSOS = () => {
    setSosActive(true);
    toast('🚨 SOS alert sent to emergency contacts!', 'error', 5000);
    setTimeout(() => setSosActive(false), 4000);
  };

  const handleShare = () => {
    toast('Live ride location shared!', 'success');
  };

  return (
    <div className="h-screen bg-surface-950 flex flex-col overflow-hidden relative">

      {/* Top bar */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 left-0 right-0 z-20 pt-safe"
      >
        <div className="flex items-center justify-between px-4 pt-14 pb-4">
          <div className="glass-dark rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-sm font-semibold">Ride in Progress</span>
          </div>
          <div className="glass-dark rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <MapPin size={14} className="text-brand-400" />
            <span className="text-white text-sm font-bold">Okhla → GNIOT</span>
          </div>
        </div>
      </motion.div>

      {/* Map */}
      <div className="flex-1 relative bg-surface-950">
        <LiveMap />

        {/* Map overlay gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-surface-950 to-transparent pointer-events-none" />
      </div>

      {/* Bottom card */}
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 26 }}
        className="relative z-20 bg-surface-900 rounded-t-4xl border-t border-surface-800 px-5 pb-safe"
      >
        {/* Pull handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-pointer"
          onClick={() => setCardExpanded(v => !v)}
        >
          <div className="w-10 h-1 bg-surface-700 rounded-full" />
        </div>

        {/* Driver row */}
        <div className="flex items-center gap-3 py-4 border-b border-surface-800">
          <Avatar name="Rahul Kumar" size="md" verified />
          <div className="flex-1">
            <p className="font-bold text-white">Rahul is on the way</p>
            <p className="text-surface-400 text-sm">Maruti Swift · DL 4C AB 1234</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">18</p>
            <p className="text-xs text-surface-400">min away</p>
          </div>
        </div>

        {/* ETA progress bar */}
        <div className="py-3 border-b border-surface-800">
          <div className="flex justify-between text-xs text-surface-400 font-medium mb-2">
            <span className="flex items-center gap-1"><MapPin size={11} /> Okhla</span>
            <span className="text-brand-400 font-semibold">18 min</span>
            <span className="flex items-center gap-1"><Navigation size={11} /> GNIOT</span>
          </div>
          <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '25%' }}
              transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <AnimatePresence>
          {cardExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex gap-3 pt-4 pb-5">
                <Button
                  variant="ghost"
                  size="md"
                  icon={<Share2 size={16} />}
                  onClick={handleShare}
                  className="flex-1 bg-surface-800 text-white hover:bg-surface-700 rounded-2xl"
                >
                  Share Ride
                </Button>

                <motion.button
                  onClick={handleSOS}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={sosActive ? { scale: [1, 1.1, 1], backgroundColor: ['#dc2626', '#991b1b', '#dc2626'] } : {}}
                  transition={sosActive ? { duration: 0.5, repeat: 3 } : {}}
                  className={`w-14 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                    sosActive ? 'bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  SOS
                </motion.button>

                <Button
                  variant="ghost"
                  size="md"
                  icon={<ChevronUp size={16} />}
                  onClick={() => setDetailsOpen(true)}
                  className="flex-1 bg-surface-800 text-white hover:bg-surface-700 rounded-2xl"
                >
                  Details
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ride Details slide-up */}
      <AnimatePresence>
        {detailsOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="absolute inset-x-0 bottom-0 z-30 bg-surface-900 rounded-t-4xl border-t border-surface-800 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Ride Details</h3>
              <button
                onClick={() => setDetailsOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {[
              { label: 'Driver', value: 'Rahul Kumar' },
              { label: 'Vehicle', value: 'Maruti Swift · White' },
              { label: 'Plate', value: 'DL 4C AB 1234' },
              { label: 'Route', value: 'Okhla → GNIOT' },
              { label: 'Pickup Time', value: '8:00 AM' },
              { label: 'Fare', value: '₹80' },
              { label: 'OTP', value: '4827' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-3 border-b border-surface-800 last:border-0">
                <span className="text-surface-400 text-sm">{item.label}</span>
                <span className="text-white text-sm font-semibold">{item.value}</span>
              </div>
            ))}
            <div className="pt-4">
              <Button
                fullWidth
                variant="danger"
                icon={<Phone size={16} />}
                onClick={() => { toast('Calling driver...', 'info'); setDetailsOpen(false); }}
              >
                Call Driver
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS overlay */}
      <AnimatePresence>
        {sosActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-red-950/80 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-center"
            >
              <div className="w-24 h-24 rounded-full bg-red-600 mx-auto mb-4 flex items-center justify-center shadow-2xl">
                <AlertTriangle size={40} className="text-white" />
              </div>
              <p className="text-white text-xl font-black">SOS Activated</p>
              <p className="text-red-300 text-sm mt-1">Alerting your emergency contacts…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
