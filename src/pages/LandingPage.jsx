import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, CheckCircle, ChevronRight, MapPin, Navigation,
  Shield, Users
} from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from '../components/ui/ScrollReveal';
import Button from '../components/ui/Button';
import Footer from '../components/layout/Footer';

// ─── Animated Hero Map ────────────────────────────────────────────────────────
function HeroMap() {
  return (
    <div className="relative w-full h-full min-h-[420px] select-none">
      {/* Map background */}
      <svg
        viewBox="0 0 480 420"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Road grid */}
        <g stroke="#e4e8f2" strokeWidth="1.5" fill="none" opacity="0.7">
          <line x1="80" y1="0" x2="80" y2="420" />
          <line x1="200" y1="0" x2="200" y2="420" />
          <line x1="320" y1="0" x2="320" y2="420" />
          <line x1="400" y1="0" x2="400" y2="420" />
          <line x1="0" y1="100" x2="480" y2="100" />
          <line x1="0" y1="200" x2="480" y2="200" />
          <line x1="0" y1="310" x2="480" y2="310" />
        </g>
        {/* Diagonal road */}
        <path d="M 60 380 Q 160 280 240 200 Q 320 120 400 60" stroke="#cdd3e6" strokeWidth="2" fill="none" opacity="0.5" />

        {/* Main route (curved) */}
        <motion.path
          d="M 100 340 C 140 280 180 240 240 200 C 300 160 360 130 400 100"
          stroke="#6172f3"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="400"
          initial={{ strokeDashoffset: 400 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.4 }}
        />
        {/* Route glow */}
        <motion.path
          d="M 100 340 C 140 280 180 240 240 200 C 300 160 360 130 400 100"
          stroke="#6172f3"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          opacity="0.15"
          strokeDasharray="400"
          initial={{ strokeDashoffset: 400 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.4 }}
        />

        {/* Buildings (stylized) */}
        <g fill="#e4e8f2" opacity="0.6">
          <rect x="20" y="140" width="40" height="60" rx="4" />
          <rect x="28" y="120" width="24" height="20" rx="2" />
          <rect x="430" y="160" width="35" height="50" rx="4" />
          <rect x="436" y="145" width="22" height="16" rx="2" />
          <rect x="150" y="240" width="28" height="40" rx="3" />
          <rect x="310" y="220" width="32" height="45" rx="3" />
          <rect x="30" y="270" width="38" height="30" rx="3" />
          <rect x="420" y="260" width="30" height="35" rx="3" />
        </g>

        {/* Green areas */}
        <ellipse cx="260" cy="310" rx="30" ry="18" fill="#d1fae5" opacity="0.6" />
        <ellipse cx="160" cy="150" rx="22" ry="14" fill="#d1fae5" opacity="0.5" />
        <ellipse cx="370" cy="260" rx="18" ry="12" fill="#d1fae5" opacity="0.5" />
      </svg>

      {/* Pickup pin — Your Location */}
      <motion.div
        className="absolute"
        style={{ left: '18%', top: '76%' }}
        initial={{ scale: 0, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 400, damping: 18 }}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-brand-600 border-4 border-white shadow-lg flex items-center justify-center">
            <MapPin size={16} className="text-white" fill="white" />
          </div>
          <div className="mt-1.5 bg-surface-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow whitespace-nowrap">
            Your Location
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
      </motion.div>

      {/* Destination pin */}
      <motion.div
        className="absolute"
        style={{ right: '12%', top: '16%' }}
        initial={{ scale: 0, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.9, type: 'spring', stiffness: 400, damping: 18 }}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center">
            <Navigation size={16} className="text-white" fill="white" />
          </div>
          <div className="mt-1.5 bg-surface-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow whitespace-nowrap">
            Your Destination
          </div>
        </div>
      </motion.div>

      {/* Animated car */}
      <motion.div
        className="absolute"
        initial={{ left: '18%', top: '76%' }}
        animate={{ left: ['18%', '35%', '50%', '68%', '82%'], top: ['76%', '62%', '50%', '34%', '20%'] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut', delay: 1.8 }}
        style={{ zIndex: 10 }}
      >
        <div className="w-9 h-9 bg-white rounded-full shadow-lg border-2 border-brand-100 flex items-center justify-center">
          <span className="text-base">🚗</span>
        </div>
      </motion.div>

      {/* Student avatar markers */}
      {[
        { left: '38%', top: '55%', name: 'RK', delay: 1.2 },
        { left: '54%', top: '43%', name: 'AS', delay: 1.4 },
        { left: '68%', top: '32%', name: 'PS', delay: 1.6 },
      ].map((m, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: m.left, top: m.top }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: m.delay, type: 'spring', stiffness: 400, damping: 20 }}
        >
          <div className="w-7 h-7 rounded-full bg-brand-100 border-2 border-brand-300 text-brand-700 text-[10px] font-bold flex items-center justify-center shadow-sm">
            {m.name}
          </div>
        </motion.div>
      ))}

      {/* Floating ride card */}
      <motion.div
        className="absolute"
        style={{ left: '4%', top: '8%' }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
        transition={{
          opacity: { delay: 1.4, duration: 0.5 },
          x: { delay: 1.4, duration: 0.5 },
          y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }
        }}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-surface-100 p-3 w-44">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-[11px] font-bold text-surface-900">Your Route</span>
          </div>
          <p className="text-[10px] text-surface-400 leading-relaxed">Rides available near you</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Trust Bar Item ───────────────────────────────────────────────────────────
function TrustItem({ icon, label, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
    >
      <motion.div
        animate={inView ? { scale: [1, 1.2, 1], rotate: [0, 8, 0] } : {}}
        transition={{ delay: delay + 0.2, duration: 0.5 }}
        className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
      >
        {icon}
      </motion.div>
      <span className="text-sm font-semibold text-surface-700">{label}</span>
    </motion.div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const trustItems = [
    { icon: '🎓', label: 'Verified Students' },
    { icon: '🔐', label: 'Ride OTP' },
    { icon: '📍', label: 'Live Tracking' },
    { icon: '👥', label: 'Share Your Ride' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Find',
      icon: <MapPin size={24} className="text-brand-600" />,
      desc: 'Enter your pickup point, destination and preferred time.',
    },
    {
      num: '02',
      title: 'Connect',
      icon: <Users size={24} className="text-brand-600" />,
      desc: 'Choose a ride from verified students travelling your way.',
    },
    {
      num: '03',
      title: 'Ride',
      icon: <CheckCircle size={24} className="text-brand-600" />,
      desc: 'Confirm your seat and start your journey safely.',
    },
  ];

  const stats = [
    { value: 1284, suffix: '+', label: 'Students' },
    { value: 342, suffix: '', label: 'Daily Rides' },
    { value: 4.8, suffix: '★', label: 'Avg Rating', isFloat: true },
    { value: 12, suffix: '', label: 'Colleges' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center gradient-hero overflow-hidden pt-24 pb-16"
      >
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100/50 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-surface-950 leading-[1.05] tracking-tight text-balance mb-6"
              >
                Your Campus.{' '}
                <span className="text-brand-600">Your Route.</span>{' '}
                Your Ride.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg text-surface-500 max-w-lg mb-8 leading-relaxed"
              >
                Connect with verified students travelling your way. Share rides,
                save money and commute with confidence.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}
                className="flex flex-wrap gap-3"
              >
                <Button size="lg" onClick={() => navigate('/find-ride')} iconRight={<ArrowRight size={18} />}>
                  Find a Ride
                </Button>
                <Button size="lg" variant="secondary" onClick={() => navigate('/offer-ride')}>
                  Offer a Ride
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: map visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative bg-surface-50 rounded-4xl overflow-hidden border border-surface-100 shadow-2xl"
                style={{ height: 460 }}>
                <HeroMap />
                {/* Map overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-50/20 to-transparent pointer-events-none rounded-4xl" />
              </div>
            </motion.div>

            {/* Mobile route visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:hidden"
            >
              <div className="bg-surface-50 rounded-3xl p-5 border border-surface-100 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-400 border-2 border-white shadow" />
                    <div className="w-0.5 h-10 bg-gradient-to-b from-brand-300 to-brand-600" />
                    <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between h-16">
                    <div>
                      <p className="text-xs text-surface-400">Pickup</p>
                      <p className="font-bold text-surface-900">Your Location</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-400">Destination</p>
                      <p className="font-bold text-surface-900">Your Destination</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-brand-600">₹80</p>
                    <p className="text-xs text-surface-400">per seat</p>
                    <p className="text-xs text-surface-500 mt-1">3 seats left</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-100 flex items-center justify-end">
                  <Button size="xs" onClick={() => navigate('/find-ride')}>Find a Ride</Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-surface-300 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2.5 bg-brand-500 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────── */}
      <section className="py-8 bg-white border-y border-surface-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {trustItems.map((item, i) => (
              <TrustItem key={item.label} {...item} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-16">
            <p className="text-brand-600 font-semibold text-sm tracking-widest uppercase mb-3">Simple Steps</p>
            <h2 className="text-4xl sm:text-5xl font-black text-surface-950 text-balance">
              Your commute, made simple.
            </h2>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden sm:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-brand-200 to-transparent" />

            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.12} direction="up">
                <div className="relative bg-white rounded-3xl p-8 card-shadow hover:card-shadow-hover transition-shadow group">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center mb-5 shadow-sm">
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-black text-surface-900 mb-3">{step.title}</h3>
                    <p className="text-surface-500 leading-relaxed">{step.desc}</p>
                  </div>

                  {i < steps.length - 1 && (
                    <div className="sm:hidden absolute -bottom-4 left-1/2 -translate-x-1/2">
                      <ChevronRight size={20} className="text-brand-300 rotate-90" />
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.4} className="flex justify-center mt-12">
            <Button size="lg" onClick={() => navigate('/find-ride')} iconRight={<ArrowRight size={18} />}>
              Get Started
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* ── SAFETY SECTION ───────────────────────────────────────────── */}
      <section id="safety" className="py-24 bg-white relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-50/60 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-50 mb-6 shadow-sm">
              <Shield size={28} className="text-brand-600" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-surface-950 text-balance">
              Safety comes first.
            </h2>
            <p className="text-surface-500 text-lg mt-4 max-w-xl mx-auto">
              Every feature is designed around your security.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '🎓', title: 'Verified Students', desc: 'Students verify using college ID and selfie before riding.', color: 'brand' },
              { icon: '🔐', title: 'Ride OTP', desc: 'A ride starts only after OTP confirmation between both parties.', color: 'purple' },
              { icon: '📍', title: 'Live Tracking', desc: 'See the active ride location updated in real-time.', color: 'success' },
              { icon: '👥', title: 'Share Ride', desc: 'Share your live trip link with someone you trust.', color: 'warning' },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div className="bg-white rounded-3xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-surface-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="py-24 gradient-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <h2 className="text-4xl sm:text-5xl font-black text-surface-950 mb-6 text-balance">
              Ready to commute smarter?
            </h2>
            <p className="text-surface-500 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of students already sharing rides and saving money every day.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="xl" onClick={() => navigate('/find-ride')} iconRight={<ArrowRight size={20} />}>
                Find a Ride
              </Button>
              <Button size="xl" variant="secondary" onClick={() => navigate('/offer-ride')}>
                Offer a Ride
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
