import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH — instant load via localStorage cache
//  Strategy:
//   1. On mount: read cached profile from localStorage immediately (sync, 0ms)
//   2. Verify session in background (async)
//   3. Hard 400ms timeout — if Supabase hasn't responded, show unauthenticated
//   4. Profile cached in localStorage so repeat visits are instant
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext  = createContext(null);
const PROFILE_KEY  = 'cc_profile_cache';

// ─── Admin phone list — phones that always get admin access regardless of DB role
const ADMIN_PHONES = ['9220612315'];

const isAdminPhone = (phone) => {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '');
  return ADMIN_PHONES.some(p => clean === p || clean.endsWith(p));
};

const hashPin   = (pin, phone) => btoa(`${pin}:${phone.replace(/\D/g, '')}`);
const verifyPin = (pin, phone, hash) => {
  try { return atob(hash) === `${pin}:${phone.replace(/\D/g, '')}`; }
  catch { return false; }
};

// Read/write profile cache
const readCachedProfile  = ()  => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; } };
const writeCachedProfile = (p) => { try { if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); else localStorage.removeItem(PROFILE_KEY); } catch {} };

export function AuthProvider({ children }) {
  // Seed from cache synchronously — instant first render
  const cached = readCachedProfile();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(cached);
  const [session, setSession] = useState(null);
  // loading = false immediately if we have a cached profile — no spinner
  const [loading, setLoading] = useState(!cached);

  const fetchProfile = useCallback(async (userId) => {
    // Single query — try id first, auth_id second using OR
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${userId},auth_id.eq.${userId}`)
      .maybeSingle();

    if (data) {
      setProfile(data);
      writeCachedProfile(data);
    }
    return data;
  }, []);

  useEffect(() => {
    // Hard timeout:
    // - If we have a cached profile, 600ms is enough (session verify + race)
    // - If no cache (fresh visit / new device), give Supabase 3s to fully load
    const timeout = setTimeout(() => setLoading(false), cached ? 600 : 3000);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      clearTimeout(timeout);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        // No session — clear cache, mark as not loading
        setProfile(null);
        writeCachedProfile(null);
        setLoading(false);
      }
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        writeCachedProfile(null);
      }
    });

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
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

    const { data: byPhone } = await supabase
      .from('profiles').select('id').eq('phone', cleanPhone).maybeSingle();
    if (byPhone) throw new Error('This mobile number is already registered. Try logging in.');

    const { data: byEmail } = await supabase
      .from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (byEmail) throw new Error('This email is already registered. Try logging in.');

    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) throw new Error(anonErr.message);

    const uid = anonData.user.id;
    const newProfile = {
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
    };

    const { error: profileErr } = await supabase.from('profiles').upsert(newProfile);
    if (profileErr) throw new Error(profileErr.message);

    // Cache immediately so next render is instant
    writeCachedProfile(newProfile);
    setProfile(newProfile);
    return anonData;
  }, []);

  // ─── SIGN IN — phone + PIN ────────────────────────────────────────────────
  const signInWithPhone = useCallback(async ({ phone, pin }) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) throw new Error('Enter a valid 10-digit mobile number.');
    if (!/^\d{4}$/.test(pin))     throw new Error('PIN must be 4 digits.');

    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('id, phone, pin_hash, auth_id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (profErr) throw new Error(profErr.message);
    if (!prof)   throw new Error('No account found with this number. Please sign up first.');

    if (prof.pin_hash && !verifyPin(pin, cleanPhone, prof.pin_hash)) {
      throw new Error('Incorrect PIN. Please try again.');
    }

    // Restore existing session if it already belongs to this profile
    const { data: { session: existing } } = await supabase.auth.getSession();
    if (existing?.user && (existing.user.id === prof.id || existing.user.id === prof.auth_id)) {
      if (!prof.pin_hash) {
        await supabase.from('profiles').update({ pin_hash: hashPin(pin, cleanPhone) }).eq('phone', cleanPhone);
      }
      const fullProfile = await fetchProfile(existing.user.id);
      return { session: existing, user: existing.user, profile: fullProfile };
    }

    // New anon session + link via auth_id
    await supabase.auth.signOut();
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) throw new Error(anonErr.message);

    const newUid = anonData.user.id;
    await supabase.from('profiles').update({
      auth_id:  newUid,
      ...(prof.pin_hash ? {} : { pin_hash: hashPin(pin, cleanPhone) }),
    }).eq('phone', cleanPhone);

    const fullProfile = await fetchProfile(newUid);
    return { ...anonData, profile: fullProfile };
  }, [fetchProfile]);

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setSession(null);
    writeCachedProfile(null);
  }, []);

  // ─── Update profile ───────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) return;
    // Use profile.id (stable DB pk) — user.id is the anon auth uid which can
    // differ on new-device logins when the profile was created on another session
    const profileId = profile?.id ?? user.id;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    writeCachedProfile(data);
    return data;
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      isAuthenticated: !!user && !!profile,
      isVerified:  profile?.is_verified ?? false,
      isFemale:    profile?.gender      === 'female',
      isAdmin:     profile?.role === 'admin' || isAdminPhone(profile?.phone),
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
