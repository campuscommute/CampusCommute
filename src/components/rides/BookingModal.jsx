import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { requestBooking } from '../../services/bookingsService';
import { useAuth } from '../../context/AuthContext';

const OTP = '4827';

function OTPDigit({ digit, index }) {
  return (
    <motion.div
      initial={{ scale: 0, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.08, type: 'spring', stiffness: 500, damping: 25 }}
      className="w-14 h-16 sm:w-16 sm:h-18 rounded-2xl bg-brand-50 border-2 border-brand-200
                 flex items-center justify-center text-3xl font-black text-brand-700 shadow-sm"
    >
      {digit}
    </motion.div>
  );
}

export default function BookingModal({ ride, open, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');

  const handleConfirm = async () => {
    if (!user) { toast('Please sign in to book a ride', 'error'); return; }
    setLoading(true);
    try {
      const result = await requestBooking({
        rideId:      ride.id,
        passengerId: user.id,
        seatsBooked: 1,
      });
      setOtp(result.otp ?? '');
      setConfirmed(true);
    } catch (err) {
      toast(err.message || 'Booking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    setOtp('');
    onClose();
  };

  const handleShare = () => {
    toast('Ride details shared!', 'success');
  };

  if (!ride) return null;

  return (
    <Modal open={open} onClose={handleClose} size="sm" bottomSheet>
      <AnimatePresence mode="wait">
        {!confirmed ? (
          /* Confirmation step */
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">🚗</span>
              </div>
              <h2 className="text-2xl font-black text-surface-950 mb-1">Confirm Booking</h2>
              <p className="text-surface-500 text-sm">Review your ride details</p>
            </div>

            {/* Ride summary */}
            <div className="bg-surface-50 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-surface-900">
                  <span>{ride.from ?? ride.from_label}</span>
                  <ArrowRight size={14} className="text-brand-500" />
                  <span>{ride.to ?? ride.to_label}</span>
                </div>
                <span className="font-black text-brand-600 text-lg">₹{ride.price_per_seat ?? ride.price}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-surface-500 font-medium">
                <span>🕐 {ride.time}</span>
                <span>📅 {ride.date ? new Date(ride.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ride.date}</span>
                <span>👤 {ride.driver?.name}</span>
              </div>
            </div>

            <Button fullWidth size="lg" loading={loading} onClick={handleConfirm}>
              Confirm & Book
            </Button>
            <Button fullWidth variant="ghost" size="md" onClick={handleClose} className="mt-2">
              Cancel
            </Button>
          </motion.div>
        ) : (
          /* Success + OTP step */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="text-center"
          >
            {/* Success checkmark */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
                className="relative"
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <CheckCircle size={40} className="text-green-500" />
                </motion.div>
                {/* Ring pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-green-200"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                />
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-2xl font-black text-surface-950 mb-1"
            >
              You're booked! ✓
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-surface-500 text-sm mb-5"
            >
              {ride.from} → {ride.to} · {ride.time}
            </motion.p>

            {/* OTP */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-brand-50 border border-brand-100 rounded-3xl p-5 mb-4"
            >
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">
                Your Ride OTP
              </p>
              <div className="flex justify-center gap-3 mb-3">
                {otp.split('').map((d, i) => (
                  <OTPDigit key={i} digit={d} index={i} />
                ))}
              </div>
              <p className="text-xs text-surface-500 leading-relaxed">
                Share this OTP <strong>only when the ride begins.</strong>
              </p>
            </motion.div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                icon={<Share2 size={15} />}
                onClick={handleShare}
                className="flex-1"
              >
                Share Ride
              </Button>
              <Button
                size="md"
                className="flex-1"
                onClick={() => { handleClose(); navigate('/my-rides'); }}
              >
                View Ride
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
