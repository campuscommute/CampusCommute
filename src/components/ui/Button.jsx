import { motion } from 'framer-motion';

const variants = {
  primary:   'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md',
  secondary: 'bg-white border border-surface-200 text-surface-800 hover:bg-surface-50 hover:border-surface-300 shadow-sm',
  ghost:     'text-surface-700 hover:bg-surface-100 hover:text-surface-900',
  danger:    'bg-danger-500 hover:bg-danger-600 text-white shadow-sm',
  success:   'bg-success-500 hover:bg-success-600 text-white shadow-sm',
  outline:   'border-2 border-brand-600 text-brand-600 hover:bg-brand-50',
  glass:     'glass text-surface-800 hover:bg-white/80',
};

const sizes = {
  xs:  'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
  sm:  'px-4 py-2 text-sm gap-2 rounded-xl',
  md:  'px-5 py-2.5 text-sm gap-2 rounded-2xl',
  lg:  'px-6 py-3 text-base gap-2.5 rounded-2xl',
  xl:  'px-8 py-4 text-lg gap-3 rounded-3xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  );
}
