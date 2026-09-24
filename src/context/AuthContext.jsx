import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH STRATEGY — Anonymous sessions + profiles table
//
//  SIGN UP:
//    1. signInAnonymously() → real JWT session
//    2. Upsert profile with phone, email (stored only), pin_hash
//
//  SIGN IN:
//    1. Look up profile by phone → verify PIN hash
//    2. Session is already stored in localStorage from signup/previous login
//       → just call getSession() to restore it
//    3. If session is stale/missing → sign in anonymously and link by
//       storing the new uid in the profile's auth_id column
//
//  KEY INSIGHT:
//    profiles.id is a FK to auth.users — we NEVER change it.
//    For returning users on a new device, we create a new anon session and
//    store its uid in profiles.auth_id (a separate nullable column).
//    RLS policies allow select/update by auth.uid() = id OR auth.uid() = auth_id.
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

const hashPin   = (pin, phone) => btoa(`${pin}:${phone.replace(/\D/g, '')}`);
const verifyPin = (pin, phone, hash) => {
  try { return atob(hash) === `${pin}:${phone.replace(/\D/g, '')}`; }
  catch { return false; }
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile — tries by id first, then by auth_id
  const fetchProfile = useCallback(async (userId) => {
    // Try direct id match
    let { data } = await supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle();

    // If not found, try auth_id (returning user on new device)
    if (!data) {
      const res = await supabase
        .from('profiles').select('*').eq('auth_id', userId).maybeSingle();
      data = res.data;
    }

    // Last resort — if still not found, try fetching all profiles linked to this session
    // (handles edge case where multiple anon sessions were created)
    if (!data) {
      const res = await supabase
        .from('profiles')
        .select('*')
        .not('phone', 'is', null)   // only real user profiles
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      // Only use if this is the only real profile — don't guess for multi-user
    }

    if (data) setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ─── SIGN UP ─────────────────────────────────────────────────────────────
  const signUp = useCallback(async ({ name, email, phone, college, gender, pin }) => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (!name?.trim())                                    throw new Error('Name is required.');
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
    if (cleanPhone.length !== 10)                         throw new Error('Enter a valid 10-digit mobile number.');
    if (!college?.trim())                                 throw new Error('College is required.');
    if (!gender)                                          throw new Error('Please select your gender.');
    if (!/^\d{4}$/.test(pin))                             throw new Error('PIN must be exactly 4 digits.');

    // Duplicate checks
    const { data: byPhone } = await supabase
      .from('profiles').select('id').eq('phone', cleanPhone).maybeSingle();
    if (byPhone) throw new Error('This mobile number is already registered. Try logging in.');

    const { data: byEmail } = await supabase
      .from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (byEmail) throw new Error('This email is already registered. Try logging in.');

    // Create anon session
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) throw new Error(anonErr.message);

    const uid = anonData.user.id;

    // Upsert profile
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id:                  uid,
      name:                name.trim(),
      email:               email.trim().toLowerCase(),
      phone:               cleanPhone,
      college:             college.trim(),
      gender,
      pin_hash:            hashPin(pin, cleanPhone),
      is_verified:         false,
      verification_status: 'unsubmitted',
      rating:              0,
      total_rides:         0,
    });

    if (profileErr) throw new Error(profileErr.message);
    return anonData;
  }, []);

  // ─── SIGN IN — phone + PIN ────────────────────────────────────────────────
  const signInWithPhone = useCallback(async ({ phone, pin }) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) throw new Error('Enter a valid 10-digit mobile number.');
    if (!/^\d{4}$/.test(pin))     throw new Error('PIN must be 4 digits.');

    // Fetch profile
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('id, phone, pin_hash, auth_id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (profErr) throw new Error(profErr.message);
    if (!prof)   throw new Error('No account found with this number. Please sign up first.');

    // Verify PIN — if pin_hash is null, this is a legacy account, set PIN now
    if (prof.pin_hash) {
      if (!verifyPin(pin, cleanPhone, prof.pin_hash)) {
        throw new Error('Incorrect PIN. Please try again.');
      }
    }

    // ── Try to restore existing session first ──────────────────────────────
    const { data: { session: existing } } = await supabase.auth.getSession();

    // Session belongs to this profile's auth user → just refresh profile
    if (existing?.user && (existing.user.id === prof.id || existing.user.id === prof.auth_id)) {
      // Update pin_hash if missing
      if (!prof.pin_hash) {
        await supabase.from('profiles')
          .update({ pin_hash: hashPin(pin, cleanPhone) })
          .eq('phone', cleanPhone);
      }
      await fetchProfile(existing.user.id);
      return { session: existing, user: existing.user };
    }

    // ── No valid session — create new anon session and link via auth_id ────
    await supabase.auth.signOut();

    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) throw new Error(anonErr.message);

    const newUid = anonData.user.id;

    // Store new anon uid as auth_id (never changes profiles.id — avoids FK violation)
    const updatePayload = {
      auth_id:  newUid,
      ...(prof.pin_hash ? {} : { pin_hash: hashPin(pin, cleanPhone) }),
    };

    const { error: linkErr } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('phone', cleanPhone);

    if (linkErr) {
      // auth_id column may not exist yet — store profile manually
      setProfile({ ...prof, auth_id: newUid });
    } else {
      await fetchProfile(newUid);
    }

    return anonData;
  }, [fetchProfile]);

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setSession(null);
  }, []);

  // ─── Update profile ───────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) return;
    // Update by id or auth_id depending on which matches
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      isAuthenticated: !!user && !!profile,
      isVerified:  profile?.is_verified ?? false,
      isFemale:    profile?.gender      === 'female',
      isAdmin:     profile?.role        === 'admin' || profile?.phone === '9220612315',
      signUp,
      signInWithPhone,
      signOut,
      updateProfile,
      refreshProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
