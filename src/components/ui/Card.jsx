import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  onClick,
  padding = true,
}) {
  const base = `
    rounded-3xl
    ${glass ? 'glass' : 'bg-white border border-surface-100'}
    ${padding ? 'p-5' : ''}
    ${hover ? 'cursor-pointer transition-all duration-300 hover:-translate-y-0.5' : ''}
    card-shadow
    ${hover ? 'hover:card-shadow-hover' : ''}
    ${className}
  `;

  if (onClick || hover) {
    return (
      <motion.div
        className={base}
        onClick={onClick}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={base}>{children}</div>;
}
