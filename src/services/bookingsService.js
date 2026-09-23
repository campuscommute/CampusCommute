import { supabase } from '../lib/supabase';

// ─── Helper: 4-digit OTP ──────────────────────────────────────────────────────
const makeOTP = () => String(Math.floor(1000 + Math.random() * 9000));

// ─── Request / book a seat ────────────────────────────────────────────────────
export async function requestBooking({ rideId, passengerId, seatsBooked = 1, offeredPrice }) {
  // Fetch ride
  const { data: ride, error: rideErr } = await supabase
    .from('rides')
    .select('price_per_seat, available_seats, preference, driver_id')
    .eq('id', rideId)
    .single();
  if (rideErr) throw rideErr;

  if (ride.available_seats < seatsBooked)
    throw new Error(`Only ${ride.available_seats} seat(s) available.`);
  if (ride.driver_id === passengerId)
    throw new Error('You cannot book your own ride.');

  const isCounterOffer = offeredPrice && offeredPrice !== ride.price_per_seat;
  const finalPrice     = offeredPrice ?? ride.price_per_seat;
  const otp            = isCounterOffer ? null : makeOTP();

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert([{
      ride_id:              rideId,
      passenger_id:         passengerId,
      seats_booked:         seatsBooked,
      total_amount:         finalPrice * seatsBooked,
      original_price:       ride.price_per_seat,
      offered_price:        isCounterOffer ? offeredPrice : null,
      counter_offer_status: isCounterOffer ? 'pending' : 'none',
      status:               isCounterOffer ? 'pending' : 'confirmed',
      otp:                  otp,
    }])
    .select()
    .single();
  if (error) throw error;

  // Reserve seats immediately if not a counter offer
  if (!isCounterOffer) {
    const { error: updateErr } = await supabase
      .from('rides')
      .update({ available_seats: ride.available_seats - seatsBooked })
      .eq('id', rideId);
    if (updateErr) throw updateErr;
  }

  return { booking, otp };
}

// ─── My bookings ──────────────────────────────────────────────────────────────
export async function getMyBookings(passengerId, status) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      ride:rides (
        *,
        driver:profiles!rides_driver_id_fkey (
          id, name, college, is_verified, rating, avatar_url, gender
        )
      )
    `)
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ─── Get single booking ───────────────────────────────────────────────────────
export async function getBooking(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, ride:rides(*, driver:profiles!rides_driver_id_fkey(*))`)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export async function verifyOTP(bookingId, enteredOtp) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('otp, status')
    .eq('id', bookingId)
    .single();
  if (error) throw error;
  if (booking.otp !== String(enteredOtp)) throw new Error('Incorrect OTP.');
  if (booking.status !== 'confirmed') throw new Error('Booking is not in confirmed state.');

  const { data, error: updateErr } = await supabase
    .from('bookings')
    .update({ status: 'active', otp_verified: true, otp_verified_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();
  if (updateErr) throw updateErr;
  return data;
}

// ─── Cancel booking ───────────────────────────────────────────────────────────
export async function cancelBooking(bookingId, reason = '') {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status:              'cancelled',
      cancelled_by:        'passenger',
      cancelled_at:        new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Respond to counter offer (driver) ───────────────────────────────────────
export async function respondCounterOffer(bookingId, action) {
  const otp = action === 'accept' ? makeOTP() : null;
  const { data, error } = await supabase
    .from('bookings')
    .update({
      counter_offer_status: action === 'accept' ? 'accepted' : 'rejected',
      status:               action === 'accept' ? 'confirmed' : 'cancelled',
      otp:                  otp,
    })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return { booking: data, otp };
}

// ─── Rate a ride ──────────────────────────────────────────────────────────────
export async function rateBooking(bookingId, { score, comment }) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ passenger_rating: score, passenger_comment: comment, rated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
