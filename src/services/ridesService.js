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

// ─── Auto-expire rides whose date+time has passed ─────────────────────────────
// Called on app load — marks rides as 'completed' if their scheduled time passed
export async function expireOldRides() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    // Mark rides as completed if:
    //   date < today  OR  (date = today AND time has passed)
    // We do two separate updates for simplicity

    // 1. Rides from past dates
    await supabase
      .from('rides')
      .update({ status: 'completed' })
      .eq('status', 'upcoming')
      .lt('date', today);

    // 2. Rides from today that have already departed (time < now)
    // Supabase doesn't support time comparison natively so fetch and filter
    const { data: todayRides } = await supabase
      .from('rides')
      .select('id, time')
      .eq('status', 'upcoming')
      .eq('date', today);

    if (todayRides?.length) {
      const expiredIds = todayRides
        .filter(r => {
          // Convert "8:00 AM" / "8:00 PM" to 24h for comparison
          const match = r.time?.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return false;
          let [, h, m, period] = match;
          h = parseInt(h, 10);
          m = parseInt(m, 10);
          if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
          if (period.toUpperCase() === 'AM' && h === 12) h = 0;
          const rideMinutes = h * 60 + m;
          const nowMinutes  = now.getHours() * 60 + now.getMinutes();
          return nowMinutes > rideMinutes + 30; // 30-min grace period
        })
        .map(r => r.id);

      if (expiredIds.length) {
        await supabase
          .from('rides')
          .update({ status: 'completed' })
          .in('id', expiredIds);
      }
    }
  } catch {
    // Silently ignore — best-effort cleanup
  }
}

// ─── Helper: get the caller's profile id (stable DB id, not anon auth uid) ───
// Needed because driver_id in rides = profile.id, not auth.uid()
async function getCallerProfileId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const uid = session.user.id;
  // Try id first, then auth_id
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .or(`id.eq.${uid},auth_id.eq.${uid}`)
    .maybeSingle();
  return data?.id ?? uid;
}

// ─── Start a ride (driver action) ─────────────────────────────────────────────
export async function startRide(rideId) {
  const profileId = await getCallerProfileId();
  const { data, error } = await supabase
    .from('rides')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', rideId)
    .eq('driver_id', profileId)   // belt-and-suspenders: filter + RLS
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Ride not found or you are not the driver.');
  return data;
}

// ─── Complete a ride (driver action) ─────────────────────────────────────────
export async function completeRide(rideId) {
  const profileId = await getCallerProfileId();
  const { data, error } = await supabase
    .from('rides')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', rideId)
    .eq('driver_id', profileId)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Ride not found or you are not the driver.');

  // Mark all active/confirmed bookings as completed
  await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('ride_id', rideId)
    .in('status', ['confirmed', 'active']);

  return data;
}

// ─── Get all confirmed bookings for a ride (driver sees passenger list + OTPs) ─
export async function getRidePassengers(rideId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      passenger:profiles!bookings_passenger_id_fkey(
        id, name, college, gender, is_verified, rating, avatar_url, phone
      )
    `)
    .eq('ride_id', rideId)
    .in('status', ['confirmed', 'active', 'pending'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ─── Update driver GPS location (called by watchPosition during active ride) ──
// Silently ignores errors — GPS updates are best-effort
export async function updateRideLocation(rideId, { lat, lng }) {
  await supabase
    .from('rides')
    .update({
      current_lat:         lat,
      current_lng:         lng,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', rideId);
}

// ─── Subscribe to live location updates for a ride ────────────────────────────
export function subscribeToRideLocation(rideId, onUpdate) {
  return supabase
    .channel(`ride_location:${rideId}`)
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'rides',
        filter: `id=eq.${rideId}`,
      },
      (payload) => {
        const { current_lat, current_lng, status, location_updated_at } = payload.new;
        onUpdate({ lat: current_lat, lng: current_lng, status, updatedAt: location_updated_at });
      }
    )
    .subscribe();
}
