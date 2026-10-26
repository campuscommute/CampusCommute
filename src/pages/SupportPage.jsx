import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle, ChevronDown, Clock, HelpCircle,
  Loader, MessageSquare, Phone, Send
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitTicket, getMyTickets } from '../services/supportService';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { useEffect } from 'react';

const CATEGORIES = [
  'Booking Issue',
  'Payment Issue',
  'Driver Complaint',
  'Account Problem',
  'Verification Help',
  'Safety Concern',
  'App Bug',
  'Other',
];

const FAQ = [
  {
    q: 'How do I cancel a booking?',
    a: 'Go to My Rides → find your booking → tap Cancel. Cancellations made more than 1 hour before departure are free.',
  },
  {
    q: 'What is the OTP used for?',
    a: 'The OTP verifies you are in the correct vehicle. Share it with the driver only when the ride starts — never before.',
  },
  {
    q: 'How long does verification take?',
    a: 'Verification is usually reviewed within 30 minutes during working hours. You will be notified once complete.',
  },
  {
    q: 'Can I change my pickup location?',
    a: 'Contact the driver directly via the Messages tab to coordinate any changes. Route deviations are at the driver\'s discretion.',
  },
  {
    q: 'What if my driver does not show up?',
    a: 'File a report via the SOS or Report option on the live ride screen. The driver\'s account will be reviewed.',
  },
];

const statusConfig = {
  open:        { label: 'Open',        variant: 'brand'   },
  in_progress: { label: 'In Progress', variant: 'warning' },
  resolved:    { label: 'Resolved',    variant: 'success' },
  closed:      { label: 'Closed',      variant: 'neutral' },
};

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="border border-surface-100 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-50 transition-colors"
      >
        <span className="font-semibold text-surface-900 text-sm pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-surface-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-surface-600 leading-relaxed border-t border-surface-50 pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const toast = useToast();
  const { user, profile } = useAuth();

  const [tab, setTab] = useState('faq'); // faq | contact | tickets

  // Form state
  const [form, setForm] = useState({
    name:     profile?.name  || '',
    email:    profile?.email || '',
    phone:    profile?.phone || '',
    category: 'Booking Issue',
    subject:  '',
    message:  '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  // Past tickets
  const [tickets,        setTickets]        = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Load tickets when tab changes to 'tickets'
  useEffect(() => {
    if (tab !== 'tickets' || !user) return;
    setTicketsLoading(true);
    getMyTickets(profile?.id ?? user.id)
      .then(setTickets)
      .catch(() => toast('Could not load your tickets', 'error'))
      .finally(() => setTicketsLoading(false));
  }, [tab, user]);

  // Pre-fill from profile when it loads
  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        name:  f.name  || profile.name  || '',
        email: f.email || profile.email || '',
        phone: f.phone || profile.phone || '',
      }));
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!form.name.trim())    { toast('Please enter your name', 'error');    return; }
    if (!form.subject.trim()) { toast('Please enter a subject', 'error');    return; }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast('Message must be at least 10 characters', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await submitTicket({
        userId:   profile?.id ?? user?.id ?? null,
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        category: form.category,
        subject:  form.subject,
        message:  form.message,
      });
      setSubmitted(true);
      toast('Support ticket submitted!', 'success');
    } catch (err) {
      toast(err.message || 'Failed to submit. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `
    w-full px-4 py-3 rounded-2xl bg-surface-50 border border-surface-100
    text-surface-900 font-medium text-sm placeholder:text-surface-300
    focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300
    transition-all duration-200
  `;

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-28 sm:pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-6 pb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-4">
            <HelpCircle size={26} className="text-brand-600" />
          </div>
          <h1 className="text-3xl font-black text-surface-950 mb-2">Help & Support</h1>
          <p className="text-surface-500 text-sm">We're here to help. Typical response time is under 2 hours.</p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-surface-100 rounded-2xl p-1 mb-6">
          {[
            { id: 'faq',     label: 'FAQs'           },
            { id: 'contact', label: 'Contact Us'      },
            { id: 'tickets', label: 'My Tickets'      },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === t.id
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── FAQ tab ── */}
          {tab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="bg-white rounded-3xl p-5 card-shadow border border-surface-100">
                <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Frequently Asked Questions</p>
                <div className="space-y-2">
                  {FAQ.map((item, i) => (
                    <FAQItem key={i} q={item.q} a={item.a} index={i} />
                  ))}
                </div>
              </div>

              {/* Quick contact card */}
              <div className="bg-brand-600 rounded-3xl p-5 text-white">
                <p className="font-bold mb-1">Can't find your answer?</p>
                <p className="text-white/70 text-sm mb-4">Submit a ticket and we'll get back to you within 2 hours.</p>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setTab('contact')}
                  icon={<MessageSquare size={15} />}
                  className="bg-white/20 text-white border-white/20 hover:bg-white/30"
                >
                  Contact Support
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Contact tab ── */}
          {tab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-3xl p-6 card-shadow border border-surface-100"
                  >
                    <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-5">Submit a Support Request</p>

                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Your Name *</label>
                        <input className={inputCls} placeholder="Full name" value={form.name} onChange={set('name')} />
                      </div>

                      {/* Email + Phone */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Email</label>
                          <input className={inputCls} type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Phone</label>
                          <input className={inputCls} type="tel" placeholder="10-digit number" value={form.phone} onChange={set('phone')} />
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Category *</label>
                        <div className="relative">
                          <select className={`${inputCls} appearance-none cursor-pointer`} value={form.category} onChange={set('category')}>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Subject *</label>
                        <input className={inputCls} placeholder="Brief description of your issue" value={form.subject} onChange={set('subject')} />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
                          Message * <span className="font-normal text-surface-400">({form.message.length}/2000)</span>
                        </label>
                        <textarea
                          rows={5}
                          className={`${inputCls} resize-none`}
                          placeholder="Describe your issue in detail — the more info you give, the faster we can help."
                          value={form.message}
                          onChange={set('message')}
                          maxLength={2000}
                        />
                      </div>

                      <Button
                        fullWidth
                        size="lg"
                        loading={submitting}
                        onClick={handleSubmit}
                        icon={<Send size={16} />}
                      >
                        Submit Ticket
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-8 card-shadow border border-surface-100 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
                    >
                      <CheckCircle size={40} className="text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-black text-surface-950 mb-2">Ticket Submitted</h3>
                    <p className="text-surface-500 text-sm mb-6 leading-relaxed">
                      We've received your request. Our team will review it and get back to you within 2 hours.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => { setSubmitted(false); setForm(f => ({ ...f, subject: '', message: '' })); }}
                      >
                        New Ticket
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setTab('tickets')}
                      >
                        View My Tickets
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── My Tickets tab ── */}
          {tab === 'tickets' && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {!user ? (
                <div className="bg-white rounded-3xl p-10 text-center card-shadow border border-surface-100">
                  <p className="text-surface-500">Sign in to view your support tickets.</p>
                </div>
              ) : ticketsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader size={28} className="text-brand-400 animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center card-shadow border border-surface-100">
                  <MessageSquare size={36} className="text-surface-200 mx-auto mb-3" />
                  <p className="font-semibold text-surface-700 mb-1">No tickets yet</p>
                  <p className="text-surface-400 text-sm mb-4">Your submitted support requests will appear here.</p>
                  <Button size="sm" onClick={() => setTab('contact')}>Submit a Request</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((t, i) => {
                    const st = statusConfig[t.status] ?? statusConfig.open;
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-3xl p-5 card-shadow border border-surface-100"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-bold text-surface-900 text-sm">{t.subject}</p>
                            <p className="text-xs text-surface-400 mt-0.5">
                              {t.category} · {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-sm text-surface-600 leading-relaxed mb-3 line-clamp-2">{t.message}</p>

                        {/* Admin reply */}
                        {t.admin_reply && (
                          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3.5 mt-2">
                            <p className="text-xs font-bold text-brand-600 mb-1.5 flex items-center gap-1.5">
                              <MessageSquare size={11} /> Support Team Reply
                            </p>
                            <p className="text-sm text-surface-700 leading-relaxed">{t.admin_reply}</p>
                            {t.replied_at && (
                              <p className="text-xs text-surface-400 mt-1.5 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(t.replied_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
