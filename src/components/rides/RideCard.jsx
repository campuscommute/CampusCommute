import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Star, Users } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function RideCard({
  ride,
  onRequest,
  onDetails,
  compact = false,
  animIndex = 0,
}) {
  const { driver, from, to, time, date, seats, price, preference, rating } = ride;
  const driverRating = driver?.rating || rating;
  const isWomenOnly = preference === 'women-only';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animIndex * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -3 }}
      className="bg-white rounded-3xl p-5 card-shadow hover:card-shadow-hover transition-shadow cursor-pointer border border-surface-50"
      onClick={onDetails}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={driver?.name} size="md" verified={driver?.verified} />
          <div>
            <p className="font-semibold text-surface-900 text-sm leading-tight">{driver?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-surface-500">{driver?.college}</span>
              {driver?.verified && (
                <Badge variant="brand" className="text-[10px] py-0 px-2">
                  🎓 Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-surface-900">₹{price}</p>
          <p className="text-xs text-surface-400 font-medium">per seat</p>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-3 bg-surface-50 rounded-2xl px-4 py-3">
        <div className="flex-1">
          <p className="text-xs text-surface-400 font-medium mb-0.5">From</p>
          <p className="font-bold text-surface-900 text-sm">{from}</p>
        </div>
        <div className="flex-shrink-0 text-brand-400">
          <ArrowRight size={16} />
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs text-surface-400 font-medium mb-0.5">To</p>
          <p className="font-bold text-surface-900 text-sm">{to}</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-surface-500 text-xs font-medium">
          <Clock size={13} />
          <span>{time}</span>
        </div>
        {date && (
          <div className="flex items-center gap-1.5 text-surface-500 text-xs font-medium">
            <Calendar size={13} />
            <span>{date}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-surface-500 text-xs font-medium">
          <Users size={13} />
          <span>{seats} seats left</span>
        </div>
        {driverRating && (
          <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold ml-auto">
            <Star size={12} fill="currentColor" />
            <span>{driverRating}</span>
          </div>
        )}
        {isWomenOnly && (
          <Badge variant="pink" className="ml-auto">
            👩 Women Only
          </Badge>
        )}
      </div>

      {/* CTA */}
      <Button
        fullWidth
        size="sm"
        onClick={(e) => { e.stopPropagation(); onRequest?.(); }}
      >
        Request Seat
      </Button>
    </motion.div>
  );
}
