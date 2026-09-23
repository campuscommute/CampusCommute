import { AnimatePresence, motion } from 'framer-motion';
import { Shield, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import ScrollReveal from '../components/ui/ScrollReveal';
import Toggle from '../components/ui/Toggle';
import { useToast } from '../components/ui/Toast';
import Footer from '../components/layout/Footer';

// ─── Counter Offer Section ────────────────────────────────────────────────────
function CounterOfferSection() {
  const [step, setStep] = useState(0); // 0=idle, 1=offer, 2=counter, 3=accepted, 4=booked

  const start = () => {
    setStep(0);
    setTimeout(() => setStep(1), 200);
    setTimeout(() => setStep(2), 1400);
    setTimeout(() => setStep(3), 2600);
    setTimeout(() => setStep(4), 3600);
  };

  const reset = () => setStep(0);

  const bubble = (side, text, delay, color = 'surface') => (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -24 : 24, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 320, damping: 22 }}
      className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`
        max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-sm
        ${side === 'left'
          ? 'bg-surface-100 text-surface-900 rounded-bl-sm'
          : 'bg-brand-600 text-white rounded-br-sm'
        }
      `}>
        {text}
      </div>
    </motion.div>
  );

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal>
            <p className="text-brand-600 font-semibold text-sm tracking-widest uppercase mb-3">Negotiate</p>
            <h2 className="text-4xl sm:text-5xl font-black text-surface-950 leading-tight mb-5">
              Don't like the fare?<br />
              <span className="text-brand-600">Make an offer.</span>
            </h2>
            <p className="text-surface-500 text-lg leading-relaxed mb-8">
              Propose your own price. The driver can accept or decline — no awkward conversations.
            </p>
            <motion.button
              onClick={step === 0 ? start : reset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 rounded-2xl bg-brand-600 text-white font-semibold text-sm shadow-sm hover:bg-brand-700 transition-colors"
            >
              {step === 0 ? 'Watch it in action →' : 'Replay'}
            </motion.button>
          </ScrollReveal>

          {/* Chat demo */}
          <ScrollReveal delay={0.15}>
            <div className="bg-surface-50 rounded-3xl p-6 border border-surface-100 shadow-inner min-h-[280px]">
              {/* Chat header */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center">RK</div>
                <div>
                  <p className="font-bold text-surface-900 text-sm">Rahul Kumar</p>
                  <p className="text-xs text-surface-400">Okhla → GNIOT · 8:00 AM</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>

              {/* Messages */}
              <div className="space-y-3 min-h-[140px]">
                <AnimatePresence>
                  {step >= 1 && bubble('left', '₹100 / seat', 0, 'surface')}
                  {step >= 2 && bubble('right', '₹80?', 0.1)}
                  {step >= 3 && bubble('left', 'Accepted ✓', 0.1)}
                </AnimatePresence>
              </div>

              {/* Booking confirmed banner */}
              <AnimatePresence>
                {step >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                    className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-green-800 text-sm">Booking Confirmed</p>
                      <p className="text-xs text-green-600">₹80 · Okhla → GNIOT · 8:00 AM</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── Women-Only Section ───────────────────────────────────────────────────────
function WomenOnlySection() {
  const toast = useToast();
  const [femaleDriverPref, setFemaleDriverPref] = useState(false);
  const [womenOnlyRide, setWomenOnlyRide] = useState(false);

  const handleFemaleDriver = (val) => {
    setFemaleDriverPref(val);
    toast(val ? 'Showing rides with female drivers only' : 'Showing all rides', val ? 'success' : 'info');
  };

  const handleWomenOnly = (val) => {
    setWomenOnlyRide(val);
    toast(val ? 'Women-only ride mode enabled' : 'Ride open to everyone', val ? 'success' : 'info');
  };

  return (
    <section className="py-24 bg-surface-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-50 mb-6 shadow-sm">
            <ShieldCheck size={28} className="text-brand-600" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-surface-950 text-balance mb-4">
            More choice. More comfort.
          </h2>
          <p className="text-xl text-surface-500 max-w-lg mx-auto">
            Choose who you travel with.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Female Rider card */}
          <ScrollReveal delay={0.08}>
            <motion.div
              className={`relative bg-white rounded-3xl p-7 card-shadow border-2 transition-all duration-300 ${
                femaleDriverPref ? 'border-brand-300' : 'border-surface-100'
              }`}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              {/* Shield icon */}
              <div className={`w-14 h-14 rounded-2xl mb-5 flex items-center justify-center transition-colors duration-300 ${
                femaleDriverPref ? 'bg-brand-100' : 'bg-surface-50'
              }`}>
                <Shield size={26} className={femaleDriverPref ? 'text-brand-600' : 'text-surface-400'} />
              </div>

              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xl font-black text-surface-900 mb-1">Female Rider</h3>
                  <p className="font-semibold text-surface-600 text-sm">Prefer Female Driver</p>
                </div>
                <Toggle checked={femaleDriverPref} onChange={handleFemaleDriver} />
              </div>

              <p className="text-sm text-surface-500 leading-relaxed mb-4">
                Only show rides with verified female drivers. Your choice, your comfort.
              </p>

              <AnimatePresence>
                {femaleDriverPref && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-brand-50 rounded-2xl px-4 py-2.5 text-xs font-semibold text-brand-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                      Filtering to female drivers only
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </ScrollReveal>

          {/* Female Driver card */}
          <ScrollReveal delay={0.16}>
            <motion.div
              className={`relative bg-white rounded-3xl p-7 card-shadow border-2 transition-all duration-300 ${
                womenOnlyRide ? 'border-brand-300' : 'border-surface-100'
              }`}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <div className={`w-14 h-14 rounded-2xl mb-5 flex items-center justify-center transition-colors duration-300 ${
                womenOnlyRide ? 'bg-brand-100' : 'bg-surface-50'
              }`}>
                <ShieldCheck size={26} className={womenOnlyRide ? 'text-brand-600' : 'text-surface-400'} />
              </div>

              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xl font-black text-surface-900 mb-1">Female Driver</h3>
                  <p className="font-semibold text-surface-600 text-sm">Women Only Ride</p>
                </div>
                <Toggle checked={womenOnlyRide} onChange={handleWomenOnly} />
              </div>

              <p className="text-sm text-surface-500 leading-relaxed mb-4">
                When offering a ride, set it to accept only verified female riders.
              </p>

              <AnimatePresence>
                {womenOnlyRide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-brand-50 rounded-2xl px-4 py-2.5 text-xs font-semibold text-brand-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                      Women-only ride mode active
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </ScrollReveal>
        </div>

        {/* Bottom note */}
        <ScrollReveal delay={0.24} className="mt-8 text-center">
          <p className="text-sm text-surface-400 flex items-center justify-center gap-2">
            <Shield size={14} className="text-brand-400" />
            All preferences are verified against college ID during onboarding
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── Safety Deep-Dive Section ─────────────────────────────────────────────────
function SafetyDeepSection() {
  const cards = [
    {
      icon: '🎓',
      title: 'Verified Students',
      desc: 'Students verify using college ID and selfie before they can ride or drive.',
      detail: 'Manual + AI review',
    },
    {
      icon: '🔐',
      title: 'Ride OTP',
      desc: 'A ride begins only after OTP confirmation between driver and passenger.',
      detail: 'Unique per trip',
    },
    {
      icon: '📍',
      title: 'Live Tracking',
      desc: 'See the active ride location in real-time on the map.',
      detail: 'Updated every 10s',
    },
    {
      icon: '👥',
      title: 'Share Ride',
      desc: 'Share your live trip link with a trusted contact instantly.',
      detail: 'One-tap sharing',
    },
  ];

  return (
    <section className="py-24 bg-surface-950 relative overflow-hidden">
      {/* Animated route background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
          <motion.path
            d="M 0 400 Q 200 200 400 250 Q 600 300 800 100"
            stroke="#6172f3"
            strokeWidth="3"
            fill="none"
            strokeDasharray="1200"
            animate={{ strokeDashoffset: [1200, 0, 1200] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path
            d="M 0 300 Q 200 400 400 350 Q 600 250 800 300"
            stroke="#6172f3"
            strokeWidth="2"
            fill="none"
            strokeDasharray="1200"
            animate={{ strokeDashoffset: [0, 1200, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-brand-400 font-semibold text-sm tracking-widest uppercase mb-3">Built for trust</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white text-balance">
            Safety comes first.
          </h2>
          <p className="text-surface-400 text-lg mt-4 max-w-xl mx-auto">
            Every feature is designed around your security.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-surface-900 border border-surface-800 rounded-3xl p-6 h-full group hover:border-brand-800 transition-colors duration-300"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
                <h3 className="font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed mb-4">{card.desc}</p>
                <span className="inline-block text-xs bg-brand-950 text-brand-400 border border-brand-900 px-3 py-1 rounded-full font-semibold">
                  {card.detail}
                </span>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <div className="overflow-x-hidden">
      <div className="h-20" />
      <CounterOfferSection />
      <WomenOnlySection />
      <SafetyDeepSection />
      <Footer />
    </div>
  );
}
