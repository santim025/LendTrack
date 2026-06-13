"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  debounceMs = 200,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs <= 0) {
      onChange(localValue);
      return;
    }
    const handler = setTimeout(() => onChange(localValue), debounceMs);
    return () => clearTimeout(handler);
  }, [localValue, debounceMs, onChange]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary-new)] pointer-events-none"
        strokeWidth={1.75}
      />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] py-2.5 pl-10 pr-9 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-colors focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/20"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-tertiary-new)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
