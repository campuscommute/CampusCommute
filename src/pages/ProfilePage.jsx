import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Bell, Camera, Car, CheckCircle,
  ChevronRight, Edit3, GraduationCap, Heart,
  Lock, LogOut, Mail, MapPin, Phone, Save,
  Shield, Star, TrendingUp, User, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import { useToast } from '../components/ui/Toast';

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ open, onClose, profile, onSaved }) {
  const { updateProfile } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:    profile?.name    || '',
    college: profile?.college || '',
    phone:   profile?.phone   || '',
    email:   profile?.email   || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync when profile prop changes
  useEffect(() => {
    if (profile) {
      setForm({
        name:    profile.name    || '',
        college: profile.college || '',
        phone:   profile.phone   || '',
        email:   profile.email   || '',
      });
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.college.trim()) e.college = 'College is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const ext  = avatarFile.name.split('.').pop();
        const path = `avatars/${profile.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('campus-commute')
          .upload(path, avatarFile, { upsert: true });
        if (!upErr) {
          const { data } = supabase.storage.from('campus-commute').getPublicUrl(path);
          avatarUrl = data.publicUrl;
        }
      }

      await updateProfile({
        name:       form.name.trim(),
        college:    form.college.trim(),
        avatar_url: avatarUrl,
      });

      toast('Profile updated!', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls = (err) => `
    w-full px-4 py-3 rounded-2xl bg-surface-50 border text-surface-900 text-sm font-medium
    placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-200
    transition-all duration-200
    ${err ? 'border-red-300 bg-red-50' : 'border-surface-100'}
  `;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* Handle */}
          <div className="sm:hidden flex justify-center pt-3">
            <div className="w-10 h-1 bg-surface-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="text-lg font-black text-surface-950">Edit Profile</h3>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-surface-500 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 overflow-y-auto max-h-[70vh] space-y-4">
            {/* Avatar picker */}
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-surface-100 border-2 border-surface-200">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-50">
                        <span className="text-3xl font-black text-brand-600">
                          {form.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || '?'}
                        </span>
                      </div>
                    )
                  }
                </div>
                <motion.button
                  onClick={() => fileRef.current?.click()}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center shadow-md border-2 border-white"
                >
                  <Camera size={13} className="text-white" />
                </motion.button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <p className="text-xs text-surface-400">Tap to change photo</p>
            </div>

            {/* Fields */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input value={form.name} onChange={set('name')} placeholder="Your full name"
                  className={`${inputCls(errors.name)} pl-9`} />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1 pl-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
                College <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input value={form.college} onChange={set('college')} placeholder="Your college"
                  className={`${inputCls(errors.college)} pl-9`} />
              </div>
              {errors.college && <p className="text-xs text-red-500 mt-1 pl-1">{errors.college}</p>}
            </div>

            {/* Read-only fields */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
                Mobile Number <span className="text-surface-300 font-normal">(cannot change)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-300" />
                <input value={form.phone ? `+91 ${form.phone}` : ''} readOnly
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-surface-100 border border-surface-100 text-surface-400 text-sm font-medium cursor-not-allowed" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
                Email <span className="text-surface-300 font-normal">(cannot change)</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-300" />
                <input value={form.email} readOnly
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-surface-100 border border-surface-100 text-surface-400 text-sm font-medium cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-surface-100 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" loading={saving} icon={<Save size={15} />} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Section helpers ──────────────────────────────────────────────────────────
function SectionRow({ icon, label, value, onClick, toggle, toggled, onToggle, danger }) {
  return (
    <motion.button
      type="button"
      onClick={toggle ? undefined : onClick}
      whileHover={!toggle ? { x: 3 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl transition-colors text-left
        ${toggle ? '' : danger
          ? 'hover:bg-red-50 cursor-pointer'
          : 'hover:bg-surface-50 cursor-pointer'
        }
      `}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
        ${danger ? 'bg-red-50' : 'bg-surface-50'}`}>
        <span className={danger ? 'text-red-500' : 'text-surface-500'}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? 'text-red-600' : 'text-surface-800'}`}>{label}</p>
        {value && <p className="text-xs text-surface-400 mt-0.5 truncate">{value}</p>}
      </div>
      {toggle
        ? <Toggle checked={toggled} onChange={onToggle} size="sm" />
        : <ChevronRight size={16} className="text-surface-300 flex-shrink-0" />
      }
    </motion.button>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-3xl card-shadow border border-surface-50 overflow-hidden mb-4">
      <div className="px-4 pt-4 pb-1">
        <p className="text-xs font-bold text-surface-400 uppercase tracking-wider px-1">{title}</p>
      </div>
      <div className="px-1 pb-2">{children}</div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
      className="text-center"
    >
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-2xl font-black text-surface-950">{value ?? '—'}</p>
      <p className="text-xs text-surface-400 font-medium">{label}</p>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate  = useNavigate();
  const toast     = useToast();
  const { profile, isAuthenticated, isVerified, signOut, refreshProfile } = useAuth();

  const [editOpen, setEditOpen]         = useState(false);
  const [notifications, setNotifications] = useState(
    profile?.preferences?.notifications ?? true
  );
  const [rideUpdates, setRideUpdates]   = useState(
    profile?.preferences?.rideUpdates ?? true
  );
  const [womenOnly, setWomenOnly]       = useState(
    profile?.preferences?.womenOnly ?? false
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast('Signed out successfully', 'success');
  };

  const handlePrefToggle = async (key, val) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: { ...profile?.preferences, [key]: val } })
        .eq('id', profile?.id);
      if (error) throw error;
      toast('Preference saved', 'success');
    } catch {
      toast('Could not save preference', 'error');
    }
  };

  const displayName   = profile?.name    || 'Your Name';
  const displayCollege= profile?.college || 'College';
  const displayPhone  = profile?.phone   ? `+91 ${profile.phone}` : 'Not set';
  const displayEmail  = profile?.email   || 'Not set';
  const joinedDate    = profile?.created_at
    ? new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' })
        .format(new Date(profile.created_at))
    : '—';

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-28 sm:pb-8">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        {/* ── Hero card ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-6 card-shadow border border-surface-50 mb-5 mt-4"
        >
          <div className="flex items-start gap-4">
            {/* Avatar + edit button */}
            <div className="relative flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-3xl object-cover border-2 border-surface-100 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center shadow-sm">
                  <span className="text-3xl font-black text-brand-600">
                    {displayName.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                  </span>
                </div>
              )}
              <motion.button
                onClick={() => setEditOpen(true)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center shadow-md border-2 border-white"
              >
                <Edit3 size={13} className="text-white" />
              </motion.button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl font-black text-surface-950 truncate">{displayName}</h2>

              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {isVerified
                  ? <Badge variant="brand">🎓 Verified Student</Badge>
                  : <Badge variant="warning">⏳ Unverified</Badge>
                }
                {displayCollege !== 'College' && (
                  <Badge variant="neutral">{displayCollege}</Badge>
                )}
                {profile?.gender && (
                  <Badge variant="neutral" className="capitalize">{profile.gender}</Badge>
                )}
              </div>

              <p className="text-xs text-surface-400 mt-2 flex items-center gap-1">
                <MapPin size={11} /> Member since {joinedDate}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-surface-100">
            <StatCard
              icon={<TrendingUp size={16} className="text-brand-500" />}
              value={profile?.total_rides ?? 0}
              label="Rides"
              delay={0.1}
            />
            <StatCard
              icon={<Star size={16} className="text-amber-500" />}
              value={profile?.rating ? Number(profile.rating).toFixed(1) : '—'}
              label="Rating"
              delay={0.18}
            />
            <StatCard
              icon={<Heart size={16} className="text-red-400" />}
              value={profile?.total_reviews ?? 0}
              label="Reviews"
              delay={0.26}
            />
          </div>
        </motion.div>

        {/* ── Personal Details ───────────────────────────────────────── */}
        <Section title="Personal Details">
          <SectionRow
            icon={<User size={16} />}
            label="Full Name"
            value={displayName}
            onClick={() => setEditOpen(true)}
          />
          <SectionRow
            icon={<GraduationCap size={16} />}
            label="College"
            value={displayCollege}
            onClick={() => setEditOpen(true)}
          />
          <SectionRow
            icon={<Phone size={16} />}
            label="Mobile Number"
            value={displayPhone}
            onClick={() => toast('Mobile number cannot be changed', 'info')}
          />
          <SectionRow
            icon={<Mail size={16} />}
            label="Email Address"
            value={displayEmail}
            onClick={() => toast('Email cannot be changed', 'info')}
          />
        </Section>

        {/* ── Verification ───────────────────────────────────────────── */}
        <Section title="Verification">
          <SectionRow
            icon={
              isVerified
                ? <CheckCircle size={16} className="text-green-500" />
                : <Shield size={16} />
            }
            label={isVerified ? 'Verified Student' : 'Get Verified'}
            value={
              isVerified
                ? 'College ID + Selfie confirmed'
                : 'Upload your college ID to unlock all features'
            }
            onClick={() => navigate('/verification')}
          />
        </Section>

        {/* ── Ride Preferences ───────────────────────────────────────── */}
        <Section title="Ride Preferences">
          <SectionRow
            icon={<Car size={16} />}
            label="Women Only Rides"
            value="Show only female drivers"
            toggle
            toggled={womenOnly}
            onToggle={val => {
              setWomenOnly(val);
              handlePrefToggle('womenOnly', val);
            }}
          />
          <SectionRow
            icon={<Shield size={16} />}
            label="Auto-share Location"
            value="Share with emergency contact during rides"
            toggle
            toggled={true}
            onToggle={() => toast('Preference updated', 'success')}
          />
        </Section>

        {/* ── Notifications ──────────────────────────────────────────── */}
        <Section title="Notifications">
          <SectionRow
            icon={<Bell size={16} />}
            label="Push Notifications"
            value={notifications ? 'Enabled' : 'Disabled'}
            toggle
            toggled={notifications}
            onToggle={val => {
              setNotifications(val);
              handlePrefToggle('notifications', val);
              toast(val ? 'Notifications enabled' : 'Notifications disabled', 'info');
            }}
          />
          <SectionRow
            icon={<Bell size={16} />}
            label="Ride Updates"
            value={rideUpdates ? 'Enabled' : 'Disabled'}
            toggle
            toggled={rideUpdates}
            onToggle={val => {
              setRideUpdates(val);
              handlePrefToggle('rideUpdates', val);
              toast(val ? 'Ride updates on' : 'Ride updates off', 'info');
            }}
          />
        </Section>

        {/* ── Account ────────────────────────────────────────────────── */}
        <Section title="Account">
          <SectionRow
            icon={<Lock size={16} />}
            label="Change PIN"
            value="Update your 4-digit login PIN"
            onClick={() => toast('PIN change coming soon', 'info')}
          />
          <SectionRow
            icon={<LogOut size={16} />}
            label="Sign Out"
            danger
            onClick={handleSignOut}
          />
        </Section>

        <p className="text-center text-xs text-surface-300 pb-4">
          Campus Commute v1.0 · Built with ♥ for students
        </p>
      </div>

      {/* ── Edit modal ─────────────────────────────────────────────── */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSaved={refreshProfile}
      />
    </div>
  );
}
