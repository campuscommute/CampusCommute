import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Loader } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Debounce helper
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── OpenStreetMap Nominatim autocomplete ─────────────────────────────────────
export default function LocationInput({
  label,
  value,
  onChange,       // (displayText) => void  — for the visible label
  onSelect,       // ({ label, lat, lng }) => void — when user picks a result
  placeholder = 'Enter location',
  error,
}) {
  const [query, setQuery]         = useState(value || '');
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [selected, setSelected]   = useState(false); // true after user picks
  const containerRef              = useRef(null);
  const debouncedQuery            = useDebouncedValue(query, 400);

  // Sync external value changes
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Fetch suggestions from Nominatim
  useEffect(() => {
    if (selected || debouncedQuery.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=6&countrycodes=in&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      }
    )
      .then(r => r.json())
      .then(data => {
        setResults(data);
        setOpen(data.length > 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedQuery, selected]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    setSelected(false);
    setQuery(e.target.value);
    onChange?.(e.target.value);
  };

  const handlePick = (place) => {
    const label = place.display_name
      .split(',')
      .slice(0, 3)
      .join(', ')
      .trim();
    setQuery(label);
    setSelected(true);
    setOpen(false);
    setResults([]);
    onChange?.(label);
    onSelect?.({ label, lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
  };

  return (
    <div className="flex-1 min-w-0" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-surface-500 mb-1.5 pl-1">
          {label} <span className="text-red-400">*</span>
        </label>
      )}
      <div className="relative">
        {/* Pin icon */}
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none z-10">
          {loading ? <Loader size={15} className="animate-spin" /> : <MapPin size={15} />}
        </span>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`
            w-full pl-9 pr-4 py-3 rounded-2xl bg-surface-50 border text-surface-900
            font-semibold placeholder:text-surface-300 text-sm
            focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300
            transition-all duration-200
            ${error ? 'border-red-300 bg-red-50' : 'border-surface-100'}
          `}
        />

        {/* Dropdown */}
        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-surface-100
                         rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto"
            >
              {results.map((place, i) => {
                const shortName = place.display_name.split(',').slice(0, 3).join(', ');
                const type      = place.type || place.class || '';
                return (
                  <li key={place.place_id}>
                    <button
                      type="button"
                      onMouseDown={() => handlePick(place)}
                      className={`
                        w-full text-left px-4 py-3 flex items-start gap-3
                        hover:bg-brand-50 transition-colors
                        ${i < results.length - 1 ? 'border-b border-surface-50' : ''}
                      `}
                    >
                      <MapPin size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate">{shortName}</p>
                        {type && <p className="text-xs text-surface-400 capitalize">{type}</p>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}
