const Booking = require('../models/Booking.model');
const Ride    = require('../models/Ride.model');
const User    = require('../models/User.model');
const { generateOTP } = require('../utils/token.util');

// ─── POST /api/bookings — request seat ───────────────────────────────────
exports.requestBooking = async (req, res, next) => {
  try {
    const { rideId, seatsBooked = 1, offeredPrice } = req.body;

    const ride = await Ride.findById(rideId).populate('driver');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
    if (ride.status !== 'upcoming') return res.status(400).json({ success: false, message: 'This ride is no longer available.' });
    if (ride.availableSeats < seatsBooked) return res.status(400).json({ success: false, message: `Only ${ride.availableSeats} seat(s) available.` });

    // Can't book own ride
    if (ride.driver._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot book your own ride.' });
    }

    // Women-only rides — gender check
    if (ride.preference === 'women-only' && req.user.gender !== 'female') {
      return res.status(403).json({ success: false, message: 'This is a women-only ride.' });
    }

    // No duplicate booking
    const existing = await Booking.findOne({ ride: rideId, passenger: req.user._id, status: { $in: ['pending', 'confirmed', 'active'] } });
    if (existing) return res.status(409).json({ success: false, message: 'You have already booked this ride.' });

    const finalPrice = offeredPrice || ride.pricePerSeat;
    const isCounterOffer = offeredPrice && offeredPrice !== ride.pricePerSeat;

    const booking = await Booking.create({
      ride:           rideId,
      passenger:      req.user._id,
      seatsBooked,
      totalAmount:    finalPrice * seatsBooked,
      originalPrice:  ride.pricePerSeat,
      offeredPrice:   isCounterOffer ? offeredPrice : undefined,
      counterOfferStatus: isCounterOffer ? 'pending' : 'none',
      status: isCounterOffer ? 'pending' : 'confirmed',
    });

    // If not a counter offer, reserve seats and generate OTP
    if (!isCounterOffer) {
      ride.availableSeats -= seatsBooked;
      await ride.save();

      // Generate OTP valid for 24 hours
      const otp = generateOTP();
      booking.otp = {
        code:      otp,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verified:  false,
      };
      booking.status = 'confirmed';
      await booking.save();
    }

    await booking.populate([
      { path: 'ride', populate: { path: 'driver', select: 'name college isVerified rating avatar' } },
      { path: 'passenger', select: 'name college isVerified' },
    ]);

    res.status(201).json({
      success: true,
      message: isCounterOffer ? 'Counter offer sent to driver.' : 'Seat confirmed!',
      booking,
      ...(booking.otp?.code && { otp: booking.otp.code }),
    });
  } catch (err) { next(err); }
};

// ─── GET /api/bookings/me — my bookings ──────────────────────────────────
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { passenger: req.user._id };
    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate({ path: 'ride', populate: { path: 'driver', select: 'name college isVerified rating avatar gender' } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/bookings/:id ────────────────────────────────────────────────
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'ride', populate: { path: 'driver', select: 'name college isVerified rating avatar phone' } })
      .populate('passenger', 'name college isVerified avatar');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Only the passenger or driver can view
    const rideDriverId = booking.ride?.driver?._id?.toString();
    if (booking.passenger._id.toString() !== req.user._id.toString() && rideDriverId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// ─── PATCH /api/bookings/:id/verify-otp ──────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id).select('+otp.code');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.otp.verified) return res.status(400).json({ success: false, message: 'OTP already used.' });
    if (new Date() > booking.otp.expiresAt) return res.status(400).json({ success: false, message: 'OTP expired.' });
    if (booking.otp.code !== String(otp)) return res.status(400).json({ success: false, message: 'Incorrect OTP.' });

    booking.otp.verified  = true;
    booking.otp.verifiedAt = new Date();
    booking.status = 'active';
    await booking.save();

    res.json({ success: true, message: 'OTP verified. Ride started!' });
  } catch (err) { next(err); }
};

// ─── PATCH /api/bookings/:id/cancel ─────────────────────────────────────
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.passenger.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking.' });
    }

    booking.status          = 'cancelled';
    booking.cancelledBy     = 'passenger';
    booking.cancelledAt     = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by passenger';
    await booking.save();

    // Restore seat
    if (booking.status !== 'pending') {
      await Ride.findByIdAndUpdate(booking.ride, { $inc: { availableSeats: booking.seatsBooked } });
    }

    res.json({ success: true, message: 'Booking cancelled.' });
  } catch (err) { next(err); }
};

// ─── PATCH /api/bookings/:id/counter-offer — driver responds ─────────────
exports.respondCounterOffer = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    const booking = await Booking.findById(req.params.id).populate('ride');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the driver can respond to a counter offer.' });
    }
    if (booking.counterOfferStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending counter offer.' });
    }

    if (action === 'accept') {
      booking.counterOfferStatus = 'accepted';
      booking.totalAmount = booking.offeredPrice * booking.seatsBooked;
      booking.status = 'confirmed';

      // Reserve seats + generate OTP
      const otp = generateOTP();
      booking.otp = { code: otp, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verified: false };

      await Ride.findByIdAndUpdate(booking.ride._id, { $inc: { availableSeats: -booking.seatsBooked } });
    } else {
      booking.counterOfferStatus = 'rejected';
      booking.status = 'cancelled';
      booking.cancelledBy = 'driver';
      booking.cancelledAt = new Date();
    }

    await booking.save();

    res.json({
      success: true,
      message: action === 'accept' ? 'Counter offer accepted.' : 'Counter offer rejected.',
      booking,
      ...(action === 'accept' && booking.otp?.code && { otp: booking.otp.code }),
    });
  } catch (err) { next(err); }
};

// ─── POST /api/bookings/:id/rate — post-trip rating ──────────────────────
exports.rateRide = async (req, res, next) => {
  try {
    const { score, comment, rateAs } = req.body; // rateAs: 'passenger' | 'driver'
    const booking = await Booking.findById(req.params.id).populate('ride');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only rate a completed booking.' });

    const isPassenger = booking.passenger.toString() === req.user._id.toString();
    const isDriver    = booking.ride.driver.toString() === req.user._id.toString();

    if (isPassenger) {
      if (booking.passengerRating?.score) return res.status(400).json({ success: false, message: 'Already rated.' });
      booking.passengerRating = { score, comment, ratedAt: new Date() };

      // Update driver's average rating
      const driver = await User.findById(booking.ride.driver);
      const newTotal  = driver.totalReviews + 1;
      driver.rating   = ((driver.rating * driver.totalReviews) + score) / newTotal;
      driver.totalReviews = newTotal;
      await driver.save();
    } else if (isDriver) {
      if (booking.driverRating?.score) return res.status(400).json({ success: false, message: 'Already rated.' });
      booking.driverRating = { score, comment, ratedAt: new Date() };

      const passenger = await User.findById(booking.passenger);
      const newTotal  = passenger.totalReviews + 1;
      passenger.rating     = ((passenger.rating * passenger.totalReviews) + score) / newTotal;
      passenger.totalReviews = newTotal;
      await passenger.save();
    } else {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    await booking.save();
    res.json({ success: true, message: 'Rating submitted.' });
  } catch (err) { next(err); }
};
