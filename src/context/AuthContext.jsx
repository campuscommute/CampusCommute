import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH STRATEGY
//  Supabase auth.signUp sends confirmation emails we can't stop from the client.
//  So we skip Supabase Auth entirely for account creation.
//
//  Instead:
//  1. SIGN UP  → insert row into `profiles` table directly (anon key is allowed
//               via a permissive RLS insert policy we set up below).
//               Hash the PIN with a simple but consistent derivation stored in
//               the `pin_hash` column.  Then call signInAnonymously to get a
//               real Supabase session, and link the profile to that session uid.
//
//  2. SIGN IN  → look up profile by phone/email, verify PIN hash, then call
//               supabase.auth.signInWithPassword using email + derived password
//               (the account was created via signUp without email confirmation
//               because we use a SYSTEM EMAIL that never actually sends).
//
//  Cleanest real solution for Supabase free tier:
//  - Store a real email in profiles (for reference)
//  - Use a fixed internal email pattern for Supabase Auth that never triggers
//    SMTP (use the phone number itself as a local part + a domain that has no
//    MX records so Supabase's mailer fails silently — but "Confirm email" = OFF
//    means no email attempt at all)
//  - Require "Confirm email" = OFF in dashboard (one-time setup)
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// Internal Supabase auth email — never actually emailed, just an identifier
// Using a domain guaranteed to have no MX records
const toAuthEmail = (phone) => `cc_${phone}@auth.internal`;

// Deterministic password from PIN + phone tail
const buildPassword = (pin, phone) =>
  `${pin}xX${phone.replace(/\D/g, '').slice(-6)}`;

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
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

  // ─── SIGN UP ──────────────────────────────────────────────────────────────
  const signUp = useCallback(async ({ email, phone, pin, name, college, gender }) => {
    const cleanPhone = phone.replace(/\D/g, '');

    // Validate
    if (!name?.trim())                                    throw new Error('Name is required.');
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
    if (cleanPhone.length !== 10)                         throw new Error('Enter a valid 10-digit mobile number.');
    if (!/^\d{4}$/.test(pin))                             throw new Error('PIN must be exactly 4 digits.');
    if (!college?.trim())                                 throw new Error('College is required.');
    if (!gender)                                          throw new Error('Please select your gender.');

    const authEmail = toAuthEmail(cleanPhone);
    const password  = buildPassword(pin, cleanPhone);

    // ── Check if auth user already exists by trying to sign in ────────────
    // This catches the case where signup partially completed before
    const { data: existingSignIn } = await supabase.auth.signInWithPassword({
      email: authEmail, password,
    });
    if (existingSignIn?.session) {
      // Auth user exists and PIN matches — just ensure profile is complete
      await supabase.from('profiles').upsert({
        id:      existingSignIn.user.id,
        name:    name.trim(),
        email:   email.trim().toLowerCase(),
        phone:   cleanPhone,
        college: college.trim(),
        gender,
        is_verified:         false,
        verification_status: 'unsubmitted',
        rating:              0,
        total_rides:         0,
      });
      return { session: existingSignIn.session, user: existingSignIn.user };
    }

    // ── Duplicate check on profiles table ─────────────────────────────────
    const { data: byPhone } = await supabase
      .from('profiles').select('id').eq('phone', cleanPhone).maybeSingle();
    if (byPhone) throw new Error('This mobile number is already registered. Try logging in instead.');

    const { data: byEmail } = await supabase
      .from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (byEmail) throw new Error('This email is already registered. Try logging in instead.');

    // ── Create Supabase auth user ──────────────────────────────────────────
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email:    authEmail,
      password,
      options: {
        data: { name, real_email: email.trim().toLowerCase(), college, gender, phone: cleanPhone },
      },
    });

    if (signUpErr) {
      const m = signUpErr.message?.toLowerCase() ?? '';
      if (m.includes('rate limit') || m.includes('email')) {
        throw new Error(
          'Setup needed: Supabase Dashboard → Authentication → Providers → Email → ' +
          'turn OFF "Confirm email" → Save. Then try again.'
        );
      }
      throw new Error(signUpErr.message);
    }

    // ── Get session — sign in if signUp didn't return one ─────────────────
    let finalSession = signUpData?.session;
    let finalUser    = signUpData?.user;

    if (!finalSession) {
      const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
        email: authEmail, password,
      });
      if (siErr || !si?.session) {
        // Auth user exists but can't sign in = email confirmation still ON
        // Clean up the incomplete auth entry if possible
        throw new Error(
          'Supabase Dashboard → Authentication → Providers → Email → ' +
          'turn OFF "Confirm email" → Save. Then try again.'
        );
      }
      finalSession = si.session;
      finalUser    = si.user;
    }

    // ── Upsert full profile ────────────────────────────────────────────────
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id:                  finalUser.id,
      name:                name.trim(),
      email:               email.trim().toLowerCase(),
      phone:               cleanPhone,
      college:             college.trim(),
      gender,
      is_verified:         false,
      verification_status: 'unsubmitted',
      rating:              0,
      total_rides:         0,
    });
    if (profileErr) console.error('Profile upsert error:', profileErr.message);

    return { session: finalSession, user: finalUser };
  }, []);

  // ─── SIGN IN with phone + PIN ─────────────────────────────────────────────
  const signInWithPhone = useCallback(async ({ phone, pin }) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) throw new Error('Enter a valid 10-digit mobile number.');
    if (!/^\d{4}$/.test(pin))     throw new Error('PIN must be 4 digits.');

    // Check profile exists first — gives a clear "not registered" message
    const { data: prof } = await supabase
      .from('profiles').select('phone').eq('phone', cleanPhone).maybeSingle();
    if (!prof) throw new Error('No account found. Please sign up first.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    toAuthEmail(cleanPhone),
      password: buildPassword(pin, cleanPhone),
    });
    if (error) {
      // Auth user missing but profile exists = orphaned record
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Incorrect PIN. Please try again.');
      }
      throw new Error(error.message);
    }
    return data;
  }, []);

  // ─── SIGN IN with email + PIN ─────────────────────────────────────────────
  const signInWithEmail = useCallback(async ({ email, pin }) => {
    if (!email?.trim())       throw new Error('Email is required.');
    if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be 4 digits.');

    const { data: prof } = await supabase
      .from('profiles').select('phone').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (!prof) throw new Error('No account found with this email. Please sign up first.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    toAuthEmail(prof.phone),
      password: buildPassword(pin, prof.phone),
    });
    if (error) {
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Incorrect PIN. Please try again.');
      }
      throw new Error(error.message);
    }
    return data;
  }, []);

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setSession(null);
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
      isFemale:    profile?.gender === 'female',
      isAdmin:     profile?.role   === 'admin',
      signUp, signInWithPhone, signInWithEmail,
      signOut, updateProfile,
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
