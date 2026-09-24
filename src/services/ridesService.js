import { supabase } from '../lib/supabase';

// ─── Haversine distance (km) between two lat/lng points ───────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R  = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Search rides ─────────────────────────────────────────────────────────────
// Supports:
//   - text search on from_label / to_label (fuzzy)
//   - lat/lng based 10 km radius filter (applied client-side after fetch)
//   - date, preference, sortBy filters
export async function searchRides({
  from, to,
  fromLat, fromLng,   // optional — enables radius filter on pickup point
  toLat, toLng,       // optional — enables radius filter on destination
  date,
  preference,
  sortBy = 'time',
  radiusKm = 10,
} = {}) {
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

  // Text filters only when no coordinates are given
  if (from && !fromLat) query = query.ilike('from_label', `%${from}%`);
  if (to   && !toLat)   query = query.ilike('to_label',   `%${to}%`);

  if (preference) query = query.eq('preference', preference);
  if (date)       query = query.eq('date', date);
  else            query = query.gte('date', new Date().toISOString().split('T')[0]);

  if (sortBy === 'price') query = query.order('price_per_seat', { ascending: true });
  else                    query = query.order('time', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  let results = data ?? [];

  // ── Radius filter: only apply when coordinates are provided ──────────────
  if (fromLat && fromLng) {
    results = results.filter(r => {
      if (!r.from_lat || !r.from_lng) return true; // keep rides without coords
      return haversineKm(fromLat, fromLng, r.from_lat, r.from_lng) <= radiusKm;
    });
  }
  if (toLat && toLng) {
    results = results.filter(r => {
      if (!r.to_lat || !r.to_lng) return true;
      return haversineKm(toLat, toLng, r.to_lat, r.to_lng) <= radiusKm;
    });
  }

  return results;
}

// ─── Women-only rides ─────────────────────────────────────────────────────────
export async function searchWomenOnlyRides({ from, to, date, fromLat, fromLng, toLat, toLng } = {}) {
  return searchRides({ from, to, date, fromLat, fromLng, toLat, toLng, preference: 'women-only' });
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
