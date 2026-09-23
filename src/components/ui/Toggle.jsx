import { motion } from 'framer-motion';

export default function Toggle({ checked = false, onChange, size = 'md' }) {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: 16 },
    md: { track: 'w-12 h-6', thumb: 'w-4.5 h-4.5', translate: 24 },
    lg: { track: 'w-14 h-7', thumb: 'w-5.5 h-5.5', translate: 28 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      className={`
        relative inline-flex items-center flex-shrink-0 rounded-full cursor-pointer
        transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
        ${s.track}
        ${checked ? 'bg-brand-600' : 'bg-surface-200'}
      `}
      role="switch"
      aria-checked={checked}
    >
      <motion.span
        className={`inline-block rounded-full bg-white shadow-sm ${s.thumb}`}
        animate={{ x: checked ? s.translate - 2 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
