import { useState, useRef, useEffect } from 'react';

export interface SearchSelectOption {
  id: string;
  name: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  id?: string;
  'aria-label'?: string;
  excludeId?: string; /* option id to exclude (e.g. selected "from" in "to") */
}

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  id,
  'aria-label': ariaLabel,
  excludeId,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const displayText = selected ? selected.name : placeholder;
  const isPlaceholder = !value;

  const list = excludeId ? options.filter((o) => o.id !== excludeId) : options;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div
      className="rs-search-select-wrap rs-search-dropdown-wrap"
      ref={wrapRef}
    >
      <button
        type="button"
        id={id}
        className={`rs-search-trigger ${isPlaceholder ? 'empty' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel || placeholder}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {displayText}
      </button>
      {open && (
        <div
          className="rs-search-dropdown"
          role="listbox"
          aria-label={ariaLabel || placeholder}
        >
          <button
            type="button"
            className="rs-search-dropdown-option placeholder"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            role="option"
          >
            {placeholder}
          </button>
          {list.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="rs-search-dropdown-option"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              role="option"
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
