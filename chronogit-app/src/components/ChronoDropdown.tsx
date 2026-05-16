import { useEffect, useMemo, useRef, useState } from "react";

export type ChronoDropdownOption = {
  value: string;
  title: string;
  subtitle?: string;
  badge?: string;
};

type Props = {
  label?: string;
  value: string;
  options: ChronoDropdownOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ChronoDropdown({
  label,
  value,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyText = "No matches.",
  onChange,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;

    return options.filter((option) =>
      `${option.title} ${option.subtitle || ""} ${option.badge || ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [options, query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className={`cg-unified-dropdown ${className}`.trim()} ref={rootRef}>
      {label ? (
        <label className="cg-unified-dropdown__label">
          {label}
        </label>
      ) : null}

      <button
        type="button"
        className="cg-unified-dropdown__button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          <strong>{selected?.title || placeholder}</strong>
          {selected?.subtitle ? <em>{selected.subtitle}</em> : null}
        </span>
        <b>{open ? "▲" : "▼"}</b>
      </button>

      {open ? (
        <div className="cg-unified-dropdown__menu">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
          />

          <div className="cg-unified-dropdown__list">
            {filteredOptions.length ? filteredOptions.map((option) => (
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
                <span>{option.subtitle || option.badge || option.value}</span>
              </button>
            )) : (
              <div className="cg-unified-dropdown__empty">{emptyText}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
