import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({
  open = false,
  onClose,
  children,
  title,
  size = 'md',
  bottomSheet = false,
}) {
  const sizes = {
    sm:   'max-w-sm',
    md:   'max-w-md',
    lg:   'max-w-lg',
    xl:   'max-w-xl',
    full: 'max-w-2xl',
  };

  // lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 sm:px-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={bottomSheet ? { y: '100%' } : { opacity: 0, scale: 0.94, y: 16 }}
            animate={bottomSheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={bottomSheet ? { y: '100%' } : { opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`
              relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl
              w-full ${sizes[size]}
              max-h-[92vh] flex flex-col overflow-hidden
            `}
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-surface-200 rounded-full" />
            </div>

            {/* Header */}
            {(title || onClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
                {title && <h3 className="text-lg font-bold text-surface-900">{title}</h3>}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="ml-auto w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center text-surface-500 hover:text-surface-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
