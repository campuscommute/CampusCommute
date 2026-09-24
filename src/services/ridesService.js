import { supabase } from '../lib/supabase';

// ─── Search rides ─────────────────────────────────────────────────────────────
export async function searchRides({ from, to, date, preference, sortBy = 'time' } = {}) {
  let query = supabase
    .from('rides')
    .select(`
      *,
      driver:profiles!rides_driver_id_fkey (
        id, name, college, gender, is_verified, rating, total_rides, avatar_url
      )
    `)
    .eq('status', 'upcoming')
    .gt('available_seats', 0);

  if (from)       query = query.ilike('from_label', `%${from}%`);
  if (to)         query = query.ilike('to_label',   `%${to}%`);
  if (preference) query = query.eq('preference', preference);
  if (date)       query = query.eq('date', date);           // date is DATE column, pass as YYYY-MM-DD
  else            query = query.gte('date', new Date().toISOString().split('T')[0]); // today onwards

  if (sortBy === 'price') query = query.order('price_per_seat', { ascending: true });
  else                    query = query.order('time', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ─── Women-only rides ─────────────────────────────────────────────────────────
export async function searchWomenOnlyRides({ from, to, date } = {}) {
  return searchRides({ from, to, date, preference: 'women-only' });
}

// ─── Get single ride ──────────────────────────────────────────────────────────
export async function getRide(id) {
  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      driver:profiles!rides_driver_id_fkey (
        id, name, college, gender, is_verified, rating, total_rides, avatar_url, phone
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ─── Create ride ──────────────────────────────────────────────────────────────
export async function createRide(payload) {
  const { data, error } = await supabase
    .from('rides')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Update ride ──────────────────────────────────────────────────────────────
export async function updateRide(id, updates) {
  const { data, error } = await supabase
    .from('rides')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Cancel ride ──────────────────────────────────────────────────────────────
export async function cancelRide(id) {
  const { data, error } = await supabase
    .from('rides')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── My offered rides ─────────────────────────────────────────────────────────
export async function getMyOfferedRides(driverId) {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
