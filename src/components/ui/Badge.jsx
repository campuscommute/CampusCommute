const variants = {
  brand:    'bg-brand-100 text-brand-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-700',
  neutral:  'bg-surface-100 text-surface-600',
  purple:   'bg-purple-100 text-purple-700',
  pink:     'bg-pink-100 text-pink-700',
};

export default function Badge({ children, variant = 'neutral', className = '', dot = false }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-xs font-semibold tracking-wide
        ${variants[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} />
      )}
      {children}
    </span>
  );
}
