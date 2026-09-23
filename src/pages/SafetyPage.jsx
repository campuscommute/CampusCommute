import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Lock, MapPin, Users, Eye, Phone, Star } from 'lucide-react';
import ScrollReveal from '../components/ui/ScrollReveal';
import Footer from '../components/layout/Footer';

const pillars = [
  {
    icon: '🎓',
    title: 'Verified Students Only',
    desc: 'Every rider and driver verifies their identity with a college ID and a live selfie before accessing the platform. No anonymous users.',
    detail: 'Manual + AI review within 30 minutes',
    icon2: <Shield size={18} className="text-brand-500" />,
  },
  {
    icon: '🔐',
    title: 'Ride OTP',
    desc: 'A unique one-time password is generated for every booking. The ride only starts after both parties confirm with the OTP — preventing wrong pickups.',
    detail: 'Fresh OTP for every trip',
    icon2: <Lock size={18} className="text-brand-500" />,
  },
  {
    icon: '📍',
    title: 'Live Location Tracking',
    desc: 'The active ride location is visible in real-time throughout the trip. No blind spots from pickup to drop.',
    detail: 'Updates every 10 seconds',
    icon2: <MapPin size={18} className="text-brand-500" />,
  },
  {
    icon: '👥',
    title: 'Share Your Ride',
    desc: 'With one tap, share your live trip details — driver info, vehicle, route and ETA — with a trusted contact outside the app.',
    detail: 'Works via any messaging app',
    icon2: <Users size={18} className="text-brand-500" />,
  },
  {
    icon: '⭐',
    title: 'Ratings & Reviews',
    desc: 'After every trip, both rider and driver rate each other. Low-rated users are flagged and reviewed automatically.',
    detail: 'Bidirectional accountability',
    icon2: <Star size={18} className="text-brand-500" />,
  },
  {
    icon: '🆘',
    title: 'SOS Emergency Button',
    desc: 'A one-tap SOS button is always visible during an active ride. It instantly alerts your emergency contacts with your live location.',
    detail: 'Alerts sent in under 3 seconds',
    icon2: <Phone size={18} className="text-brand-500" />,
  },
];

const commitments = [
  'No ride starts without OTP verification',
  'All users are real, verified college students',
  'Every trip is tracked from start to finish',
  'Women-only ride options available platform-wide',
  'SOS available on every active ride screen',
  'Reports are reviewed within 24 hours',
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white pt-20 overflow-x-hidden">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <motion.div
              animate={{ rotate: [0, 4, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-md mb-8 border border-brand-100"
            >
              <Shield size={38} className="text-brand-600" />
            </motion.div>
            <h1 className="text-5xl sm:text-6xl font-black text-surface-950 mb-5 text-balance">
              Safety comes first.
            </h1>
            <p className="text-xl text-surface-500 max-w-xl mx-auto leading-relaxed">
              Campus Commute is built on one non-negotiable principle — every student deserves to commute safely, every single day.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Six pillars */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm tracking-widest uppercase mb-3">Our Safety System</p>
            <h2 className="text-4xl font-black text-surface-950">Six layers of protection</h2>
            <p className="text-surface-500 mt-3 max-w-lg mx-auto">
              Each layer works independently and together to keep every trip secure.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="bg-surface-50 border border-surface-100 rounded-3xl p-6 h-full hover:border-brand-200 hover:bg-brand-50/30 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{p.icon}</div>
                  <h3 className="font-bold text-surface-900 text-lg mb-2">{p.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed mb-4">{p.desc}</p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 bg-white border border-brand-100 px-3 py-1.5 rounded-full w-fit shadow-sm">
                    {p.icon2}
                    {p.detail}
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Our commitments */}
      <section className="py-20 bg-brand-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-12">
            <p className="text-brand-600 font-semibold text-sm tracking-widest uppercase mb-3">Our Promise</p>
            <h2 className="text-4xl font-black text-surface-950">What we guarantee</h2>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-4">
            {commitments.map((c, i) => (
              <ScrollReveal key={i} delay={i * 0.07}>
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="flex items-start gap-3 bg-white rounded-2xl px-5 py-4 border border-brand-100 shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck size={13} className="text-brand-600" />
                  </div>
                  <p className="text-sm font-semibold text-surface-800">{c}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Report a concern */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-6 shadow-sm">
              <Eye size={24} className="text-brand-600" />
            </div>
            <h2 className="text-3xl font-black text-surface-950 mb-4">Something feel off?</h2>
            <p className="text-surface-500 leading-relaxed mb-6 max-w-md mx-auto">
              Every report is reviewed by our safety team within 24 hours. Your identity stays private.
            </p>
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold px-5 py-3 rounded-2xl">
              <Phone size={16} />
              safety@campuscommute.in
            </div>
          </ScrollReveal>
        </div>
      </section>
      <Footer />
    </div>
  );
}
