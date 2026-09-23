const Ride = require('../models/Ride.model');
const Booking = require('../models/Booking.model');

// ─── POST /api/rides — create ─────────────────────────────────────────────
exports.createRide = async (req, res, next) => {
  try {
    const {
      from, to, date, time, totalSeats, pricePerSeat,
      preference, isRecurring, recurringDays, vehicle,
    } = req.body;

    const ride = await Ride.create({
      driver: req.user._id,
      from, to, date, time,
      totalSeats,
      availableSeats: totalSeats,
      pricePerSeat,
      preference: preference || 'everyone',
      isRecurring: isRecurring || false,
      recurringDays: recurringDays || [],
      vehicle: vehicle || {},
    });

    await ride.populate('driver', 'name college isVerified rating avatar gender');

    res.status(201).json({ success: true, message: 'Ride published.', ride });
  } catch (err) { next(err); }
};

// ─── GET /api/rides — search ──────────────────────────────────────────────
exports.searchRides = async (req, res, next) => {
  try {
    const {
      from, to, date, preference,
      sortBy = 'time',       // time | price
      page = 1, limit = 20,
    } = req.query;

    const filter = { status: 'upcoming', availableSeats: { $gte: 1 } };

    if (from) filter['from.label'] = { $regex: from, $options: 'i' };
    if (to)   filter['to.label']   = { $regex: to,   $options: 'i' };

    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end   = new Date(date); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else {
      // Default to today onwards
      filter.date = { $gte: new Date() };
    }

    if (preference) filter.preference = preference;

    const sortMap = { time: { time: 1 }, price: { pricePerSeat: 1 } };
    const sort = sortMap[sortBy] || { date: 1, time: 1 };

    const skip = (page - 1) * limit;
    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .populate('driver', 'name college isVerified rating avatar gender vehicle')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Ride.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: rides,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/rides/:id — single ride ────────────────────────────────────
exports.getRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name college isVerified rating totalRides avatar gender vehicle phone');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
    res.json({ success: true, ride });
  } catch (err) { next(err); }
};

// ─── PUT /api/rides/:id — update (driver only) ────────────────────────────
exports.updateRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to update this ride.' });
    }
    if (ride.status !== 'upcoming') {
      return res.status(400).json({ success: false, message: 'Cannot update a ride that is not upcoming.' });
    }

    const allowed = ['time', 'pricePerSeat', 'vehicle', 'preference', 'isRecurring', 'recurringDays'];
    allowed.forEach(k => { if (req.body[k] !== undefined) ride[k] = req.body[k]; });

    await ride.save();
    res.json({ success: true, message: 'Ride updated.', ride });
  } catch (err) { next(err); }
};

// ─── DELETE /api/rides/:id — cancel (driver only) ─────────────────────────
exports.cancelRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    if (ride.driver.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    ride.status = 'cancelled';
    await ride.save();

    // Cancel all pending/confirmed bookings
    await Booking.updateMany(
      { ride: ride._id, status: { $in: ['pending', 'confirmed'] } },
      { status: 'cancelled', cancelledBy: 'driver', cancelledAt: new Date() }
    );

    res.json({ success: true, message: 'Ride cancelled.' });
  } catch (err) { next(err); }
};

// ─── GET /api/rides/driver/me — my offered rides ──────────────────────────
exports.getMyOfferedRides = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { driver: req.user._id };
    if (status) filter.status = status;

    const [rides, total] = await Promise.all([
      Ride.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Ride.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: rides,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── PATCH /api/rides/:id/start — start ride ─────────────────────────────
exports.startRide = async (req, res, next) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, driver: req.user._id });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
    if (ride.status !== 'upcoming') return res.status(400).json({ success: false, message: 'Ride is not in upcoming state.' });

    ride.status    = 'active';
    ride.startedAt = new Date();
    await ride.save();

    res.json({ success: true, message: 'Ride started.', ride });
  } catch (err) { next(err); }
};

// ─── PATCH /api/rides/:id/complete — complete ride ───────────────────────
exports.completeRide = async (req, res, next) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, driver: req.user._id });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
    if (ride.status !== 'active') return res.status(400).json({ success: false, message: 'Ride is not active.' });

    ride.status      = 'completed';
    ride.completedAt = new Date();
    await ride.save();

    // Mark all active bookings as completed
    await Booking.updateMany({ ride: ride._id, status: 'active' }, { status: 'completed' });

    res.json({ success: true, message: 'Ride completed.', ride });
  } catch (err) { next(err); }
};
