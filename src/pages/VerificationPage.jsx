import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera, CheckCircle, Clock, GraduationCap,
  Shield, Upload, X
} from 'lucide-react';
import { useRef, useState } from 'react';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { submitVerification } from '../services/usersService';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { num: '01', label: 'College ID', icon: <GraduationCap size={20} /> },
  { num: '02', label: 'Selfie', icon: <Camera size={20} /> },
  { num: '03', label: 'Review', icon: <Shield size={20} /> },
];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={step.num} className="flex items-center">
            <motion.div
              animate={{
                backgroundColor: done || active ? '#4a51e8' : '#e4e8f2',
                scale: active ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className={`
                w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm
                transition-all duration-300
                ${done ? 'bg-brand-600 text-white shadow-sm'
                : active ? 'bg-brand-600 text-white shadow-md ring-4 ring-brand-100'
                : 'bg-surface-100 text-surface-400'}
              `}>
                {done ? <CheckCircle size={18} /> : step.icon}
              </div>
              <span className={`
                text-[11px] font-semibold mt-1.5 whitespace-nowrap
                ${active ? 'text-brand-600' : done ? 'text-surface-600' : 'text-surface-300'}
              `}>
                {step.label}
              </span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <div className="flex items-center mx-2 mb-5">
                <motion.div
                  className="h-0.5 w-10 sm:w-16"
                  animate={{ backgroundColor: done ? '#4a51e8' : '#e4e8f2' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────
// onUpload now receives the actual File object so callers can store it
function UploadZone({ label, hint, icon, uploaded, onUpload }) {
  const inputRef = useRef(null);

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer
        transition-all duration-300 group
        ${uploaded
          ? 'border-green-400 bg-green-50'
          : 'border-surface-200 bg-surface-50 hover:border-brand-300 hover:bg-brand-50/30'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />

      <AnimatePresence mode="wait">
        {uploaded ? (
          <motion.div
            key="done"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <div>
              <p className="font-bold text-green-700">{label} uploaded</p>
              <p className="text-xs text-green-500 mt-1">Looking good!</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-100 group-hover:bg-brand-100 transition-colors flex items-center justify-center text-surface-400 group-hover:text-brand-500">
              {icon}
            </div>
            <div>
              <p className="font-semibold text-surface-700 group-hover:text-surface-900 transition-colors">
                {label}
              </p>
              <p className="text-xs text-surface-400 mt-1">{hint}</p>
            </div>
            <span className="text-xs bg-white border border-surface-200 text-surface-500 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Upload size={12} />
              Choose file
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Step panels ─────────────────────────────────────────────────────────────
function StepCollegeID({ onNext }) {
  const [idFile, setIdFile] = useState(null);
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [enroll, setEnroll] = useState('');

  const inputClass = `
    w-full px-4 py-3 rounded-2xl bg-surface-50 border border-surface-100
    text-surface-900 font-medium text-sm placeholder:text-surface-300
    focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300
    transition-all duration-200
  `;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-2xl font-black text-surface-950 mb-1 text-center">Upload your College ID</h2>
      <p className="text-surface-500 text-sm text-center mb-7">Your ID is only used for verification.</p>

      <UploadZone
        label="College ID"
        hint="JPG, PNG or PDF · Max 5MB"
        icon={<Upload size={24} />}
        uploaded={!!idFile}
        onUpload={setIdFile}
      />

      <div className="grid gap-4 mt-5">
        <div>
          <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Full Name</label>
          <input className={inputClass} placeholder="As on college ID" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">College</label>
          <select className={`${inputClass} cursor-pointer`} value={college} onChange={e => setCollege(e.target.value)}>
            <option value="">Select college</option>
            {['GNIOT', 'DTU', 'Jamia Millia', 'IIT Delhi', 'JNU', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">Enrollment Number</label>
          <input className={inputClass} placeholder="e.g. GN2024001" value={enroll} onChange={e => setEnroll(e.target.value)} />
        </div>
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-6"
        disabled={!idFile || !name || !college || !enroll}
        onClick={() => onNext({ idFile, name, college, enroll })}
      >
        Continue
      </Button>
    </motion.div>
  );
}

function StepSelfie({ onNext, loading }) {
  const [selfieFile, setSelfieFile] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-2xl font-black text-surface-950 mb-1 text-center">Take a Selfie</h2>
      <p className="text-surface-500 text-sm text-center mb-7">
        A clear, well-lit photo of your face. No filters.
      </p>

      <UploadZone
        label="Take or upload selfie"
        hint="Make sure your face is clearly visible"
        icon={<Camera size={28} />}
        uploaded={!!selfieFile}
        onUpload={setSelfieFile}
      />

      <div className="mt-5 bg-surface-50 rounded-2xl p-4 border border-surface-100">
        <p className="text-xs font-semibold text-surface-600 mb-2">Tips for a good selfie</p>
        <ul className="space-y-1.5">
          {[
            'Face should be fully visible and centered',
            'Good lighting — avoid backlighting',
            'Remove sunglasses or hats',
            'Neutral expression is fine',
          ].map(tip => (
            <li key={tip} className="flex items-start gap-2 text-xs text-surface-500">
              <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-6"
        disabled={!selfieFile}
        loading={loading}
        onClick={() => onNext({ selfieFile })}
      >
        Submit for Review
      </Button>
    </motion.div>
  );
}

function StepReview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="text-center"
    >
      {/* Animated verification icon */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <motion.div
            className="w-24 h-24 rounded-3xl bg-brand-50 flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GraduationCap size={44} className="text-brand-600" />
          </motion.div>
          <motion.div
            className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-400 border-3 border-white flex items-center justify-center shadow-sm"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Clock size={14} className="text-white" />
          </motion.div>
        </div>
      </div>

      <h2 className="text-2xl font-black text-surface-950 mb-2">Verification Pending</h2>
      <p className="text-surface-500 mb-6 max-w-xs mx-auto leading-relaxed">
        We're reviewing your details. This usually takes under 30 minutes.
      </p>

      {/* Status steps */}
      <div className="bg-surface-50 rounded-2xl p-5 text-left mb-6 border border-surface-100">
        {[
          { label: 'Documents received', done: true },
          { label: 'ID verification in progress', done: false, active: true },
          { label: 'Selfie match', done: false },
          { label: 'Account activated', done: false },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              s.done ? 'bg-green-500' : s.active ? 'bg-amber-400 animate-pulse' : 'bg-surface-200'
            }`}>
              {s.done
                ? <CheckCircle size={12} className="text-white" />
                : <div className="w-2 h-2 rounded-full bg-white" />
              }
            </div>
            <span className={`text-sm font-medium ${s.done ? 'text-surface-700' : s.active ? 'text-amber-600' : 'text-surface-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-surface-400">
        You'll receive a notification once verified. 🎓
      </p>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VerificationPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // Collected data lifted here so submitVerification can access everything
  const [verificationData, setVerificationData] = useState({
    idFile: null, name: '', college: '', enroll: '', selfieFile: null,
  });
  const toast = useToast();
  const { user } = useAuth();

  const handleStep1 = (data) => {
    setVerificationData(prev => ({ ...prev, ...data }));
    setStep(1);
  };

  const handleStep2 = async ({ selfieFile }) => {
    if (!user) { toast('Please sign in first', 'error'); return; }
    setSubmitting(true);
    try {
      await submitVerification(user.id, {
        college:       verificationData.college,
        enrollmentNo:  verificationData.enroll,
        collegeIdFile: verificationData.idFile,
        selfieFile,
      });
      setStep(2);
      toast('Documents submitted!', 'success');
    } catch (err) {
      toast(err.message || 'Submission failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center pt-20 pb-28 sm:pb-16 px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 pt-4"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-surface-950 mb-2">
            Become a Verified Student
          </h1>
          <p className="text-surface-500 text-sm">
            Unlock all features and build trust with co-riders.
          </p>
        </motion.div>

        <StepIndicator currentStep={step} />

        <div className="bg-white rounded-3xl p-6 sm:p-8 card-shadow border border-surface-100">
          <AnimatePresence mode="wait">
            {step === 0 && <StepCollegeID key="id" onNext={handleStep1} />}
            {step === 1 && <StepSelfie key="selfie" onNext={handleStep2} loading={submitting} />}
            {step === 2 && <StepReview key="review" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
