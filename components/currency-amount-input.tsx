"use client";

import { useState } from "react";

export function CurrencyAmountInput({
  name,
  required,
  defaultValue,
}: {
  name: string;
  required?: boolean;
  defaultValue?: number;
}) {
  const [display, setDisplay] = useState(
    defaultValue ? defaultValue.toLocaleString("en-US") : ""
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
    setDisplay(digitsOnly ? Number(digitsOnly).toLocaleString("en-US") : "");
  }

  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-ink)]">Amount (TZS)</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder="0"
        className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 font-[family-name:var(--font-mono)] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
      />
      <input type="hidden" name={name} value={display.replace(/,/g, "")} required={required} />
    </label>
  );
}
