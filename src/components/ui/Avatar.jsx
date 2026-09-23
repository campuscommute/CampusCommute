const colorPairs = [
  ['#e0eaff', '#4a51e8'],
  ['#fce7f3', '#db2777'],
  ['#d1fae5', '#059669'],
  ['#fef3c7', '#d97706'],
  ['#ede9fe', '#7c3aed'],
  ['#fee2e2', '#dc2626'],
  ['#e0f2fe', '#0284c7'],
  ['#f0fdf4', '#16a34a'],
];

function getColor(name = '') {
  const idx = name.charCodeAt(0) % colorPairs.length;
  return colorPairs[idx];
}

export default function Avatar({
  name = '',
  src,
  size = 'md',
  className = '',
  verified = false,
}) {
  const sizes = {
    xs:  'w-7 h-7 text-xs',
    sm:  'w-9 h-9 text-sm',
    md:  'w-11 h-11 text-base',
    lg:  'w-14 h-14 text-lg',
    xl:  'w-18 h-18 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const badgeSizes = {
    xs:  'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    sm:  'w-3 h-3 -bottom-0.5 -right-0.5',
    md:  'w-4 h-4 bottom-0 right-0',
    lg:  'w-4.5 h-4.5 bottom-0.5 right-0.5',
    xl:  'w-5 h-5 bottom-0.5 right-0.5',
    '2xl': 'w-6 h-6 bottom-1 right-1',
  };

  const initials = name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const [bg, fg] = getColor(name);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size] || sizes.md} rounded-full object-cover ring-2 ring-white`}
        />
      ) : (
        <div
          className={`${sizes[size] || sizes.md} rounded-full flex items-center justify-center font-bold ring-2 ring-white`}
          style={{ backgroundColor: bg, color: fg }}
        >
          {initials}
        </div>
      )}
      {verified && (
        <span
          className={`absolute ${badgeSizes[size] || badgeSizes.md} bg-brand-600 rounded-full border-2 border-white flex items-center justify-center`}
          title="Verified Student"
        >
          <svg className="w-full h-full p-px text-white" fill="currentColor" viewBox="0 0 12 12">
            <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </span>
      )}
    </div>
  );
}
