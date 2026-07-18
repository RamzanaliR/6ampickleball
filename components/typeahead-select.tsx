"use client";

import { useId, useRef, useState } from "react";

type Option = { id: string; label: string };

export function TypeaheadSelect({
  name,
  options,
  placeholder,
  emptyMessage = "No matches",
}: {
  name: string;
  options: Option[];
  placeholder: string;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const matches =
    query.trim().length === 0
      ? options.slice(0, 8)
      : options
          .filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
          .slice(0, 8);

  function selectOption(option: Option) {
    setQuery(option.label);
    setSelectedId(option.id);
    setOpen(false);
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    // Only close if focus is leaving the whole combobox, not moving to an option inside it.
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <input type="hidden" name={name} value={selectedId} />
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
      />
      {open && (
        <ul
          id={listId}
          className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] py-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3.5 py-2 text-sm text-[var(--color-ink-muted)]">{emptyMessage}</li>
          ) : (
            matches.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => selectOption(o)}
                  className="block w-full px-3.5 py-2 text-left text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper)]"
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
