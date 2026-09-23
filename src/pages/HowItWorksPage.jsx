import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from '../components/ui/ScrollReveal';
import Button from '../components/ui/Button';
import Footer from '../components/layout/Footer';

const steps = [
  {
    num: '01',
    title: 'Find',
    icon: <MapPin size={28} className="text-brand-600" />,
    desc: 'Enter your pickup point, destination and preferred time. See all available rides on your route instantly.',
    details: [
      'Search by location or route name',
      'Filter by time, price or gender preference',
      'See verified driver profiles before booking',
    ],
  },
  {
    num: '02',
    title: 'Connect',
    icon: <Users size={28} className="text-brand-600" />,
    desc: 'Choose a ride from verified students travelling your way. Review ratings and make a counter offer if needed.',
    details: [
      'Browse driver profiles and ratings',
      'Make a counter offer on the fare',
      'Get instant booking confirmation',
    ],
  },
  {
    num: '03',
    title: 'Ride',
    icon: <CheckCircle size={28} className="text-brand-600" />,
    desc: 'Confirm your seat with the ride OTP and start your journey. Track live location and share your trip.',
    details: [
      'Confirm ride with a unique OTP',
      'Track the driver in real-time',
      'Share live location with a trusted contact',
    ],
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pt-20 overflow-x-hidden">

      {/* Hero */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <p className="text-brand-600 font-semibold text-sm tracking-widest uppercase mb-4">Simple Process</p>
            <h1 className="text-5xl sm:text-6xl font-black text-surface-950 mb-5 text-balance">
              Your commute, made simple.
            </h1>
            <p className="text-xl text-surface-500 max-w-xl mx-auto leading-relaxed">
              Three steps to go from your doorstep to campus — with verified students, every time.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="bg-white rounded-3xl p-8 card-shadow border border-surface-100 flex flex-col sm:flex-row gap-6 items-start"
                >
                  {/* Step number + icon */}
                  <div className="flex-shrink-0 flex flex-row sm:flex-col items-center gap-4 sm:gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center shadow-sm">
                      {step.icon}
                    </div>
                    <span className="text-4xl font-black text-brand-100 leading-none select-none hidden sm:block">
                      {step.num}
                    </span>
                    <span className="sm:hidden text-2xl font-black text-brand-200 leading-none select-none">
                      {step.num}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-surface-950 mb-2">{step.title}</h2>
                    <p className="text-surface-500 leading-relaxed mb-5">{step.desc}</p>
                    <ul className="space-y-2">
                      {step.details.map((d, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: j * 0.08 }}
                          className="flex items-start gap-2.5 text-sm text-surface-600 font-medium"
                        >
                          <CheckCircle size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
                          {d}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Connector arrow (not last) */}
                  {i < steps.length - 1 && (
                    <div className="hidden sm:flex items-center self-center text-brand-200">
                      <ArrowRight size={24} />
                    </div>
                  )}
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-black text-surface-950 mb-5 text-balance">
              Ready to get started?
            </h2>
            <p className="text-surface-500 mb-8">
              Join verified students already commuting smarter every day.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/find-ride')} iconRight={<ArrowRight size={18} />}>
                Find a Ride
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/offer-ride')}>
                Offer a Ride
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
      <Footer />
    </div>
  );
}
