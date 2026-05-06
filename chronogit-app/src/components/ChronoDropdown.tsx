import { useEffect, useRef, useState } from "react";

type ChronoDropdownOption = {
  value: string;
  title: string;
  subtitle?: string;
};

type Props = {
  value: string;
  options: ChronoDropdownOption[];
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
};

export function ChronoDropdown({
  value,
  options,
  onChange,
  label,
  placeholder = "Search...",
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);

  const filtered = options.filter((option) => {
    const needle = query.trim().toLowerCase();

    if (!needle) return true;

    return `${option.title} ${option.subtitle || ""} ${option.value}`
      .toLowerCase()
      .includes(needle);
  });

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);

    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className={`cg-unified-dropdown ${className}`} ref={rootRef}>
      <button
        type="button"
        className="cg-unified-dropdown__button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          <strong>{selected?.title || label}</strong>
          <em>{selected?.subtitle || selected?.value || value}</em>
        </span>

        <b>{open ? "▲" : "▼"}</b>
      </button>

      {open ? (
        <div className="cg-unified-dropdown__menu">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />

          <div className="cg-unified-dropdown__list">
            {filtered.length ? (
              filtered.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={
                    option.value === value
                      ? "cg-unified-dropdown__item cg-unified-dropdown__item--selected"
                      : "cg-unified-dropdown__item"
                  }
                  onClick={() => {
                    onChange(option.value);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <strong>{option.title}</strong>
                  <span>{option.subtitle || option.value}</span>
                </button>
              ))
            ) : (
              <div className="cg-unified-dropdown__empty">
                No matches.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
