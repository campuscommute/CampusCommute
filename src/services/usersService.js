import { supabase } from '../lib/supabase';

// ─── Get public profile ───────────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, college, gender, is_verified, rating, total_rides, avatar_url, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ─── Update own profile ───────────────────────────────────────────────────────
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Upload avatar ────────────────────────────────────────────────────────────
export async function uploadAvatar(userId, file) {
  const ext  = file.name.split('.').pop();
  const path = `avatars/${userId}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('campus-commute')
    .upload(path, file, { upsert: true });
  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage.from('campus-commute').getPublicUrl(path);
  await updateProfile(userId, { avatar_url: data.publicUrl });
  return data.publicUrl;
}

// ─── Submit verification docs ─────────────────────────────────────────────────
export async function submitVerification(userId, { college, enrollmentNo, collegeIdFile, selfieFile }) {
  // Get current auth session uid (may differ from profile.id when using auth_id)
  const { data: { session } } = await supabase.auth.getSession();
  const authUid = session?.user?.id ?? userId;

  const upload = async (file, folder) => {
    const ext  = file.name.split('.').pop();
    // Use authUid as folder name so storage RLS (auth.uid() = folder) passes
    const path = `${folder}/${authUid}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('campus-commute')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('campus-commute').getPublicUrl(path).data.publicUrl;
  };

  const collegeIdUrl = collegeIdFile ? await upload(collegeIdFile, 'college-ids') : null;
  const selfieUrl    = selfieFile    ? await upload(selfieFile,    'selfies')     : null;

  const updates = {
    college,
    enrollment_no:       enrollmentNo,
    verification_status: 'pending',
    ...(collegeIdUrl && { college_id_url: collegeIdUrl }),
    ...(selfieUrl    && { selfie_url:     selfieUrl    }),
  };

  // Update by id first, fall back to auth_id match
  let { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    // Try updating via auth_id (user signed in on new device)
    const res = await supabase
      .from('profiles')
      .update(updates)
      .eq('auth_id', authUid)
      .select()
      .single();
    if (res.error) throw res.error;
    data = res.data;
  }

  return data;
}

// ─── Admin: approve / reject verification ────────────────────────────────────
export async function reviewVerification(userId, action) {
  const updates = {
    verification_status: action === 'approve' ? 'approved' : 'rejected',
    is_verified:         action === 'approve',
    ...(action === 'approve' && { verified_at: new Date().toISOString() }),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Admin: get all users ─────────────────────────────────────────────────────
export async function getAllUsers({ search, isVerified, page = 1, limit = 20 } = {}) {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search)                query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  if (isVerified !== undefined) query = query.eq('is_verified', isVerified);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
}

// ─── Admin: get stats ─────────────────────────────────────────────────────────
export async function getAdminStats() {
  const [students, rides, activeRides, pendingVerif] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('rides').select('id', { count: 'exact', head: true }),
    supabase.from('rides').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
  ]);

  return {
    totalStudents:        students.count        ?? 0,
    totalRides:           rides.count           ?? 0,
    activeRides:          activeRides.count     ?? 0,
    pendingVerifications: pendingVerif.count    ?? 0,
  };
}
