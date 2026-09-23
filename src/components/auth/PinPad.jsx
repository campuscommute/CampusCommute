import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinPad({ value = '', onChange, maxLength = 4, disabled = false }) {
  const press = (key) => {
    if (disabled) return;
    if (key === '⌫') {
      onChange(value.slice(0, -1));
    } else if (key === '') {
      // empty — no-op
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  };

  return (
    <div className="select-none">
      {/* PIN dots */}
      <div className="flex justify-center gap-4 mb-8">
        {Array.from({ length: maxLength }).map((_, i) => {
          const filled = i < value.length;
          return (
            <motion.div
              key={i}
              animate={{
                scale: filled ? [1, 1.25, 1] : 1,
                backgroundColor: filled ? '#4a51e8' : '#e4e8f2',
              }}
              transition={{ duration: 0.18, type: 'spring', stiffness: 500, damping: 20 }}
              className="w-4 h-4 rounded-full"
            />
          );
        })}
      </div>

      {/* Key grid */}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, idx) => {
          if (key === '') return <div key={idx} />;
          const isDelete = key === '⌫';
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => press(key)}
              disabled={disabled}
              whileTap={!disabled ? { scale: 0.88 } : {}}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={`
                h-14 rounded-2xl text-xl font-bold flex items-center justify-center
                transition-colors duration-150 select-none
                ${isDelete
                  ? 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                  : 'bg-surface-50 text-surface-900 hover:bg-brand-50 hover:text-brand-700 border border-surface-100'
                }
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:bg-brand-100'}
              `}
            >
              {isDelete ? <Delete size={20} /> : key}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
