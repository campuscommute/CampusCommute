import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollReveal from '../ui/ScrollReveal';

// ─── Simple SVG social icons (lucide doesn't export Instagram/Twitter/LinkedIn)
const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconTwitter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconLinkedin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
  </svg>
);

const LINKS = {
  Product: [
    { label: 'Find a Ride',   to: '/find-ride'   },
    { label: 'Offer a Ride',  to: '/offer-ride'  },
    { label: 'Women Only',    to: '/women-only'  },
    { label: 'Live Tracking', to: '/live-ride'   },
    { label: 'Recurring Rides', to: '/offer-ride' },
  ],
  Company: [
    { label: 'How It Works',  to: '/how-it-works' },
    { label: 'Safety',        to: '/safety'       },
    { label: 'Verification',  to: '/verification' },
    { label: 'Admin Panel',   to: '/admin'        },
  ],
  Support: [
    { label: 'Help Center',   href: '#' },
    { label: 'Contact Us',    href: 'mailto:support@campuscommute.in' },
    { label: 'Privacy Policy',href: '#' },
    { label: 'Terms of Use',  href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const SOCIALS = [
  { icon: <IconInstagram />, href: '#', label: 'Instagram' },
  { icon: <IconTwitter />,   href: '#', label: 'Twitter'   },
  { icon: <IconLinkedin />,  href: '#', label: 'LinkedIn'  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-950 text-surface-400">

      {/* ── Main grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <ScrollReveal direction="up" delay={0}>
              {/* Logo */}
              <Link to="/" className="inline-flex items-center gap-2.5 group mb-5">
                <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2C8 2 4 5.5 4 10c0 6 8 12 8 12s8-6 8-12c0-4.5-4-8-8-8z" fill="currentColor" opacity="0.3"/>
                    <path d="M7 11h10M12 7v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="8" cy="14" r="1.5" fill="currentColor"/>
                    <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
                  </svg>
                </div>
                <span className="text-xl font-black text-white tracking-tight">
                  Campus <span className="text-brand-400">Commute</span>
                </span>
              </Link>

              <p className="text-sm text-surface-400 leading-relaxed max-w-xs mb-6">
                Connecting verified students for safe, affordable daily commutes.
                Share rides, save money, travel with confidence.
              </p>

              {/* Contact */}
              <div className="space-y-2.5 mb-6">
                <a href="mailto:hello@campuscommute.in"
                  className="flex items-center gap-2.5 text-sm text-surface-400 hover:text-white transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-surface-800 group-hover:bg-brand-900 flex items-center justify-center transition-colors flex-shrink-0">
                    <Mail size={14} className="text-brand-400" />
                  </div>
                  hello@campuscommute.in
                </a>
                <a href="tel:+918800000000"
                  className="flex items-center gap-2.5 text-sm text-surface-400 hover:text-white transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-surface-800 group-hover:bg-brand-900 flex items-center justify-center transition-colors flex-shrink-0">
                    <Phone size={14} className="text-brand-400" />
                  </div>
                  +91 88000 00000
                </a>
                <div className="flex items-center gap-2.5 text-sm text-surface-500">
                  <div className="w-8 h-8 rounded-xl bg-surface-800 flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-brand-400" />
                  </div>
                  Greater Noida, Delhi NCR
                </div>
              </div>

              {/* Socials */}
              <div className="flex gap-2">
                {SOCIALS.map(s => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    whileHover={{ y: -3, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-10 h-10 rounded-2xl bg-surface-800 hover:bg-brand-700 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
                  >
                    {s.icon}
                  </motion.a>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links], si) => (
            <div key={section}>
              <ScrollReveal direction="up" delay={si * 0.06}>
                <h4 className="text-white font-bold text-sm mb-4 tracking-wide">{section}</h4>
                <ul className="space-y-3">
                  {links.map(link => (
                    <li key={link.label}>
                      {link.to ? (
                        <Link
                          to={link.to}
                          className="text-sm text-surface-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm text-surface-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-600 text-center sm:text-left">
            © {year} Campus Commute. Made with ♥ for students across India.
          </p>
          <div className="flex items-center gap-4 text-xs text-surface-600">
            <a href="#" className="hover:text-surface-400 transition-colors">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:text-surface-400 transition-colors">Terms</a>
            <span>·</span>
            <a href="#" className="hover:text-surface-400 transition-colors">Cookies</a>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Shield size={11} className="text-brand-500" />
              Safe &amp; Verified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
