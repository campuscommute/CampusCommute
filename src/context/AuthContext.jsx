import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH STRATEGY — Anonymous sessions + profiles table
//
//  No email provider, no phone/SMS provider needed.
//  Requires only "Allow anonymous sign-ins" enabled in Supabase dashboard:
//    Authentication → Configuration → Allow anonymous sign-ins → ON
//
//  SIGN UP:
//    1. signInAnonymously() → get a real JWT session + user.id
//    2. Upsert profile row with name, email (stored only), phone, college,
//       gender, pin_hash
//
//  SIGN IN:
//    1. Look up profile by phone number
//    2. Verify PIN against stored pin_hash
//    3. signInAnonymously() to get a fresh session
//    4. Update the anon user's profile link to match the stored profile id
//       — or simply restore the session from stored refresh_token
//
//  SESSION PERSISTENCE:
//    Supabase stores the anonymous session in localStorage automatically.
//    On revisit, getSession() returns it and we fetch the linked profile.
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// PIN hash — base64(pin:phone) — obfuscation only, not cryptographic
const hashPin = (pin, phone) =>
  btoa(`${pin}:${phone.replace(/\D/g, '')}`);

const verifyPin = (pin, phone, hash) => {
  try { return atob(hash) === `${pin}:${phone.replace(/\D/g, '')}`; }
  catch { return false; }
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
    return data;
  }, []);

  // On mount — restore session from localStorage
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

    // Validate
    if (!name?.trim())                                     throw new Error('Name is required.');
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email))  throw new Error('Enter a valid email address.');
    if (cleanPhone.length !== 10)                          throw new Error('Enter a valid 10-digit mobile number.');
    if (!college?.trim())                                  throw new Error('College is required.');
    if (!gender)                                           throw new Error('Please select your gender.');
    if (!/^\d{4}$/.test(pin))                              throw new Error('PIN must be exactly 4 digits.');

    // Duplicate phone check
    const { data: byPhone } = await supabase
      .from('profiles').select('id').eq('phone', cleanPhone).maybeSingle();
    if (byPhone) throw new Error('This mobile number is already registered. Try logging in.');

    // Duplicate email check
    const { data: byEmail } = await supabase
      .from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (byEmail) throw new Error('This email is already used. Try logging in.');

    // Create anonymous Supabase session
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) {
      if (anonErr.message?.toLowerCase().includes('anonymous')) {
        throw new Error(
          'Enable anonymous sign-ins: Supabase Dashboard → Authentication → Configuration → Allow anonymous sign-ins → ON'
        );
      }
      throw new Error(anonErr.message);
    }

    const uid = anonData.user.id;

    // Insert profile — email stored here, never used for auth
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

  // ─── SIGN IN — mobile + PIN ───────────────────────────────────────────────
  const signInWithPhone = useCallback(async ({ phone, pin }) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) throw new Error('Enter a valid 10-digit mobile number.');
    if (!/^\d{4}$/.test(pin))     throw new Error('PIN must be 4 digits.');

    // Fetch profile
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('id, phone, pin_hash')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (profErr) throw new Error(profErr.message);
    if (!prof)   throw new Error('No account found with this number. Please sign up first.');

    // Verify PIN
    if (!prof.pin_hash)                              throw new Error('Account setup incomplete. Please sign up again.');
    if (!verifyPin(pin, cleanPhone, prof.pin_hash))  throw new Error('Incorrect PIN. Please try again.');

    // Check if current session already belongs to this user
    const { data: { session: existing } } = await supabase.auth.getSession();
    if (existing?.user?.id === prof.id) {
      await fetchProfile(prof.id);
      return { session: existing, user: existing.user };
    }

    // Sign out any stale session, then sign in anonymously and link to profile
    await supabase.auth.signOut();

    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) throw new Error(anonErr.message);

    // If the anon uid differs from the stored profile id, we need to
    // update the profile row to the new anon uid (first-time sign-in on new device)
    if (anonData.user.id !== prof.id) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ id: anonData.user.id })
        .eq('id', prof.id);

      // If update fails (FK constraints etc.), link by fetching by phone again
      if (updateErr) {
        // Fall back — just fetch by phone after linking
        await fetchProfile(prof.id);
      } else {
        await fetchProfile(anonData.user.id);
      }
    } else {
      await fetchProfile(prof.id);
    }

    return anonData;
  }, [fetchProfile]);

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  // ─── Update profile ───────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', user.id).select().single();
    if (error) throw error;
    setProfile(data);
    return data;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      isAuthenticated: !!user,
      isVerified:  profile?.is_verified ?? false,
      isFemale:    profile?.gender      === 'female',
      isAdmin:     profile?.role        === 'admin',
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
