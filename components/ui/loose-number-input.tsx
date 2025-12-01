"use client";
import React from 'react';

export type LooseNumberInputProps = {
  value: string;
  onChange: (next: string) => void;
  onValueChange?: (nextNumber: number) => void;
  className?: string;
  placeholder?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  align?: "left" | "right" | "center";
  negativeClassName?: string; // applied when parsed value < 0
};

export function parseLooseNumber(s: string | number | null | undefined): number {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  if (typeof s !== "string") return 0;
  const trimmed = s.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "+") return 0;
  const n = Number(trimmed);
  return Number.isNaN(n) ? 0 : n;
}

export default function LooseNumberInput({
  value,
  onChange,
  onValueChange,
  className,
  placeholder,
  inputMode = "decimal",
  align = "right",
  negativeClassName = "text-red-600",
}: LooseNumberInputProps) {
  const parsed = parseLooseNumber(value);
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const negClass = parsed < 0 ? negativeClassName : "";
  return (
    <input
      type="text"
      inputMode={inputMode}
      className={["px-2 py-1 border rounded", alignClass, className, negClass].filter(Boolean).join(" ")}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        const next = e.target.value;
        onChange(next);
        if (onValueChange) onValueChange(parseLooseNumber(next));
      }}
      onBlur={(e) => {
        const n = parseLooseNumber(e.target.value);
        const normalized = String(n);
        if (normalized !== value) {
          onChange(normalized);
          if (onValueChange) onValueChange(n);
        }
      }}
    />
  );
}
