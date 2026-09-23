import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, ArrowLeft, CheckCircle,
  GraduationCap, Mail, Phone, User, X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import PinPad from './PinPad';

// ─── Reusable field ───────────────────────────────────────────────────────────
function Field({ label, icon, type = 'text', value, onChange, placeholder, error, maxLength, inputMode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
        {label} <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">{icon}</span>}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`
            w-full py-3 rounded-2xl bg-surface-50 border text-surface-900 text-sm font-medium
            placeholder:text-surface-300 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300
            ${icon ? 'pl-9 pr-4' : 'px-4'}
            ${error ? 'border-red-300 bg-red-50' : 'border-surface-100'}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}

function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl"
    >
      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </motion.div>
  );
}

// ─── Phone input with +91 prefix ─────────────────────────────────────────────
function PhoneField({ value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
        Mobile Number <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
        <span className="absolute left-9 top-1/2 -translate-y-1/2 text-surface-600 text-sm font-bold">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="98765 43210"
          className={`
            w-full pl-16 pr-4 py-3 rounded-2xl bg-surface-50 border text-surface-900
            text-sm font-medium placeholder:text-surface-300 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300
            ${error ? 'border-red-300 bg-red-50' : 'border-surface-100'}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}

// ─── SIGN UP: Details → PIN → Confirm → Done ─────────────────────────────────
function SignUpFlow({ onSwitch, onSuccess, onClose, forceGender }) {
  const { signUp } = useAuth();

  const [step, setStep]     = useState('details');
  const [form, setForm]     = useState({
    name: '', email: '', phone: '', college: '', gender: forceGender || '',
  });
  const [pin, setPin]           = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const validateDetails = () => {
    const e = {};
    if (!form.name.trim())                               e.name    = 'Name is required';
    if (!form.email.trim())                              e.email   = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email))        e.email   = 'Enter a valid email';
    if (form.phone.replace(/\D/g,'').length !== 10)      e.phone   = 'Enter a valid 10-digit number';
    if (!form.college.trim())                            e.college = 'College is required';
    if (!forceGender && !form.gender)                    e.gender  = 'Please select your gender';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDetailsContinue = () => {
    if (!validateDetails()) return;
    setError('');
    setStep('pin');
  };

  const handlePinSet = (val) => {
    setPin(val);
    if (val.length === 4) setTimeout(() => setStep('confirm'), 180);
  };

  const handleConfirmPin = async (val) => {
    setConfirm(val);
    if (val.length !== 4) return;

    if (val !== pin) {
      setError("PINs don't match. Try again.");
      setConfirm('');
      setPin('');
      setTimeout(() => setStep('pin'), 350);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signUp({
        name:    form.name,
        email:   form.email,
        phone:   form.phone,
        college: form.college,
        gender:  forceGender || form.gender,
        pin:     val,
      });
      setStep('done');
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 1800);
    } catch (err) {
      setError(err.message);
      setConfirm('');
      setPin('');
      setStep('pin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">

      {/* ── Details ── */}
      {step === 'details' && (
        <motion.div key="details"
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-5">
            <h2 className="text-2xl font-black text-surface-950">Create account</h2>
            <p className="text-surface-400 text-sm mt-1">All fields are required</p>
          </div>

          <ErrorBanner msg={error} />

          <div className="space-y-3 mt-3">
            <Field
              label="Full Name" icon={<User size={15} />}
              value={form.name} onChange={set('name')}
              placeholder="As on college ID" error={fieldErrors.name}
            />

            {/* Email — collected for profile, not used to log in */}
            <Field
              label="Email Address" icon={<Mail size={15} />} type="email"
              value={form.email} onChange={set('email')}
              placeholder="you@example.com" error={fieldErrors.email}
            />
            <p className="text-[11px] text-surface-400 -mt-1 pl-1">
              Used for account recovery only. You'll log in with your mobile number.
            </p>

            <PhoneField value={form.phone} onChange={set('phone')} error={fieldErrors.phone} />

            <Field
              label="College" icon={<GraduationCap size={15} />}
              value={form.college} onChange={set('college')}
              placeholder="GNIOT, DTU, Jamia…" error={fieldErrors.college}
            />

            {/* Gender */}
            {!forceGender && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
                  Gender <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  {['male', 'female', 'other'].map(g => (
                    <button key={g} type="button" onClick={() => set('gender')(g)}
                      className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 capitalize transition-all
                        ${form.gender === g
                          ? 'bg-brand-50 border-brand-400 text-brand-700'
                          : 'bg-surface-50 border-surface-100 text-surface-500 hover:border-brand-200'}`}
                    >{g}</button>
                  ))}
                </div>
                {fieldErrors.gender && <p className="text-xs text-red-500 mt-1 pl-1">{fieldErrors.gender}</p>}
              </div>
            )}

            <Button fullWidth size="lg" onClick={handleDetailsContinue} className="mt-1">
              Continue
            </Button>
          </div>

          <p className="text-center text-sm text-surface-500 mt-4">
            Already have an account?{' '}
            <button type="button" onClick={onSwitch}
              className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Log in
            </button>
          </p>
        </motion.div>
      )}

      {/* ── Set PIN ── */}
      {step === 'pin' && (
        <motion.div key="pin"
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-surface-950">Set your PIN</h2>
            <p className="text-surface-400 text-sm mt-1">Choose a 4-digit PIN to secure your account</p>
          </div>
          <ErrorBanner msg={error} />
          <div className="mt-4"><PinPad value={pin} onChange={handlePinSet} /></div>
          <button
            onClick={() => { setStep('details'); setPin(''); setError(''); }}
            className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-sm text-surface-400 hover:text-surface-700 transition-colors mt-3 mx-auto"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </motion.div>
      )}

      {/* ── Confirm PIN ── */}
      {step === 'confirm' && (
        <motion.div key="confirm"
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-surface-950">Confirm PIN</h2>
            <p className="text-surface-400 text-sm mt-1">Re-enter your 4-digit PIN</p>
          </div>
          <ErrorBanner msg={error} />
          <div className="mt-4">
            <PinPad value={confirm} onChange={handleConfirmPin} disabled={loading} />
            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-surface-500">
                <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                Creating account…
              </div>
            )}
          </div>
          <button
            onClick={() => { setStep('pin'); setConfirm(''); setError(''); }}
            className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600 transition-colors mt-5 mx-auto"
          >
            <ArrowLeft size={12} /> Change PIN
          </button>
        </motion.div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <motion.div key="done"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="py-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle size={40} className="text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-black text-surface-950 mb-2">Account created! 🎉</h2>
          <p className="text-surface-400 text-sm">Welcome to Campus Commute, {form.name.split(' ')[0]}.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── SIGN IN — mobile + PIN only ─────────────────────────────────────────────
function SignInFlow({ onSwitch, onSuccess, onClose }) {
  const { signInWithPhone } = useAuth();

  const [phone, setPhone]     = useState('');
  const [pin, setPin]         = useState('');
  const [step, setStep]       = useState('phone');   // 'phone' | 'pin'
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handlePhoneContinue = () => {
    setError('');
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setStep('pin');
  };

  const handlePinEntry = async (val) => {
    setPin(val);
    if (val.length !== 4) return;

    setLoading(true);
    setError('');
    try {
      await signInWithPhone({ phone, pin: val });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const formatted = phone.replace(/(\d{5})(\d{1,5})/, '$1 $2');

  return (
    <AnimatePresence mode="wait">

      {/* ── Phone step ── */}
      {step === 'phone' && (
        <motion.div key="phone"
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-5">
            <h2 className="text-2xl font-black text-surface-950">Welcome back</h2>
            <p className="text-surface-400 text-sm mt-1">Enter your registered mobile number</p>
          </div>

          <ErrorBanner msg={error} />

          <div className="space-y-4 mt-3">
            <PhoneField value={phone} onChange={setPhone} />

            <Button fullWidth size="lg" onClick={handlePhoneContinue}>
              Continue
            </Button>
          </div>

          <p className="text-center text-sm text-surface-500 mt-5">
            No account?{' '}
            <button type="button" onClick={onSwitch}
              className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Sign up free
            </button>
          </p>
        </motion.div>
      )}

      {/* ── PIN step ── */}
      {step === 'pin' && (
        <motion.div key="pin"
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-surface-950">Enter your PIN</h2>
            <p className="text-surface-400 text-sm mt-1 flex items-center justify-center gap-1.5">
              <Phone size={13} className="text-brand-500" />
              +91 {formatted}
            </p>
          </div>

          <ErrorBanner msg={error} />

          <div className="mt-4">
            <PinPad value={pin} onChange={handlePinEntry} disabled={loading} />
            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-surface-500">
                <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                Signing in…
              </div>
            )}
          </div>

          <button
            onClick={() => { setStep('phone'); setPin(''); setError(''); }}
            className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600 transition-colors mt-5 mx-auto"
          >
            <ArrowLeft size={12} /> Change number
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
export default function AuthModal({ open, onClose, defaultTab = 'login', onSuccess, forceGender }) {
  const [tab, setTab] = useState(defaultTab);

  const handleClose = () => {
    onClose?.();
    setTimeout(() => setTab(defaultTab), 300);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3">
            <div className="w-10 h-1 bg-surface-200 rounded-full" />
          </div>

          {/* Close */}
          <button onClick={handleClose}
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-surface-500 transition-colors z-10">
            <X size={18} />
          </button>

          {/* Logo */}
          <div className="flex justify-center pt-6 pb-2">
            <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2C8 2 4 5.5 4 10c0 6 8 12 8 12s8-6 8-12c0-4.5-4-8-8-8z" fill="currentColor" opacity="0.3"/>
                <path d="M7 11h10M12 7v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mx-6 mt-4 bg-surface-100 rounded-2xl p-1">
            {[['login', 'Log In'], ['register', 'Sign Up']].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${tab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
              >{label}</button>
            ))}
          </div>

          {/* Content */}
          <div className="px-5 pb-6 pt-4 overflow-y-auto" style={{ maxHeight: 'min(75vh, 620px)' }}>
            <AnimatePresence mode="wait">
              {tab === 'login'
                ? <SignInFlow    key="login"    onSwitch={() => setTab('register')} onSuccess={onSuccess} onClose={handleClose} />
                : <SignUpFlow    key="register" onSwitch={() => setTab('login')}    onSuccess={onSuccess} onClose={handleClose} forceGender={forceGender} />
              }
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
