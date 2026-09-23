import { motion } from 'framer-motion';
import { ArrowDown, Calendar, Clock, MapPin, Share2, Star, Users } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';

export default function RideDetailsModal({ ride, open, onClose, onRequest, onCounterOffer }) {
  const toast = useToast();

  if (!ride) return null;
  const { driver, from, to, time, date, seats, price, preference, duration, distance } = ride;

  const handleShare = () => {
    toast('Ride link copied to clipboard!', 'success');
  };

  const handleCounterOffer = () => {
    onCounterOffer?.();
    toast('Counter offer opened', 'info');
  };

  return (
    <Modal open={open} onClose={onClose} title="Ride Details" size="md" bottomSheet>
      {/* Driver info */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-surface-50 rounded-2xl">
        <Avatar name={driver?.name} size="lg" verified={driver?.verified} />
        <div className="flex-1">
          <h3 className="font-bold text-surface-900 text-lg">{driver?.name}</h3>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {driver?.verified && <Badge variant="brand">🎓 Verified Student</Badge>}
            <Badge variant="neutral">{driver?.college}</Badge>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Star size={13} className="text-amber-400" fill="currentColor" />
            <span className="text-sm font-semibold text-surface-900">{driver?.rating}</span>
            <span className="text-surface-400 text-xs">· {driver?.totalRides} rides</span>
          </div>
        </div>
      </div>

      {/* Route timeline */}
      <div className="mb-5">
        <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Route</h4>
        <div className="relative flex flex-col gap-0 pl-5">
          {/* Timeline line */}
          <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-gradient-to-b from-brand-400 via-brand-300 to-brand-500" />

          {/* Pickup */}
          <div className="relative flex items-start gap-3 pb-5">
            <div className="absolute -left-3 w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-sm flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-surface-400 font-medium">Pickup</p>
              <p className="font-bold text-surface-900">{from}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-surface-500">
                  <Clock size={11} /> {time}
                </span>
                {date && (
                  <span className="flex items-center gap-1 text-xs text-surface-500">
                    <Calendar size={11} /> {date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="relative flex items-start gap-3">
            <div className="absolute -left-3 w-4 h-4 rounded-full bg-red-400 border-2 border-white shadow-sm flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-surface-400 font-medium">Destination</p>
              <p className="font-bold text-surface-900">{to}</p>
              {duration && (
                <p className="text-xs text-surface-400 mt-1">~{duration} · {distance}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ride details grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Price', value: `₹${price}`, sub: 'per seat' },
          { label: 'Seats', value: seats, sub: 'available' },
          { label: 'Preference', value: preference === 'women-only' ? 'Women' : 'Everyone', sub: 'rider type' },
        ].map(d => (
          <div key={d.label} className="bg-surface-50 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-surface-900">{d.value}</p>
            <p className="text-xs text-surface-400 font-medium">{d.label}</p>
          </div>
        ))}
      </div>

      {/* Vehicle info */}
      {driver?.vehicle && (
        <div className="bg-surface-50 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="text-sm font-semibold text-surface-900">{driver.vehicle}</p>
            <p className="text-xs text-surface-400">{driver.vehicleColor} · Verified</p>
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <Button fullWidth size="lg" onClick={onRequest}>
          Request Seat
        </Button>
        <div className="flex gap-3">
          <Button
            fullWidth
            variant="secondary"
            size="md"
            onClick={handleCounterOffer}
          >
            Make Counter Offer
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={<Share2 size={16} />}
            onClick={handleShare}
            className="flex-shrink-0"
          >
            Share
          </Button>
        </div>
      </div>
    </Modal>
  );
}
