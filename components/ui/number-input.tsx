"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function formatNumber(n: number, opts?: { minDecimals?: number; maxDecimals?: number; useGrouping?: boolean }) {
  const { minDecimals, maxDecimals, useGrouping } = opts || {};
  const nfOpts: Intl.NumberFormatOptions = {
    minimumFractionDigits: typeof minDecimals === 'number' ? minDecimals : 0,
    maximumFractionDigits: typeof maxDecimals === 'number' ? maxDecimals : (typeof minDecimals === 'number' ? minDecimals : 0),
    useGrouping: useGrouping ?? true,
  };
  return new Intl.NumberFormat(undefined, nfOpts).format(n);
}

function parseNumeric(input: string, allowNegative = false): number | null {
  const s = (input || "").replace(/[,\s]/g, "");
  if (s === "") return null;
  const m = allowNegative ? /^-?\d*(?:\.\d*)?$/ : /^\d*(?:\.\d*)?$/;
  if (!m.test(s)) return NaN as any;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

export type NumberInputProps = {
  value: number | null | undefined;
  onValueChange: (v: number | null) => void;
  decimals?: number; // if provided, used for both min and max decimals
  minDecimals?: number; // optional override for minimum fraction digits
  maxDecimals?: number; // optional override for maximum fraction digits
  thousandSeparator?: boolean;
  allowNegative?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  inputClassName?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">;

export function NumberInput({
  value,
  onValueChange,
  decimals = 0,
  minDecimals,
  maxDecimals,
  thousandSeparator = true,
  allowNegative = false,
  className,
  placeholder,
  disabled,
  readOnly,
  inputClassName,
  ...rest
}: NumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const lastCommitted = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (focused) return; // don't clobber while editing
    lastCommitted.current = value;
  }, [value, focused]);

  const display = useMemo(() => {
    if (focused) return draft;
    const v = value;
    if (v == null) return "";
    if (!Number.isFinite(v as any)) return "";
    const min = typeof minDecimals === 'number' ? minDecimals : (typeof decimals === 'number' ? decimals : 0);
    const max = typeof maxDecimals === 'number' ? maxDecimals : (typeof decimals === 'number' ? decimals : min);
    return formatNumber(v as number, { minDecimals: min, maxDecimals: max, useGrouping: thousandSeparator });
  }, [focused, draft, value, decimals, minDecimals, maxDecimals, thousandSeparator]);

  return (
    <div className={cn("relative", className)}>
      <input
        {...rest}
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
          inputClassName
        )}
        placeholder={placeholder}
        value={display}
        onFocus={(e) => {
          setFocused(true);
          const v = lastCommitted.current;
          setDraft(v == null ? "" : String(v));
          // select all for quick overwrite
          requestAnimationFrame(() => {
            try { e.currentTarget.select(); } catch {}
          });
        }}
        onBlur={() => {
          setFocused(false);
          // On blur, normalise and commit
          const parsed = parseNumeric(draft, allowNegative);
          if (parsed === null) {
            onValueChange(null);
          } else if (Number.isFinite(parsed)) {
            const roundTo = typeof maxDecimals === 'number' ? maxDecimals : (typeof decimals === 'number' ? decimals : 0);
            const rounded = roundTo > 0 ? Number(parsed.toFixed(roundTo)) : Math.round(parsed);
            onValueChange(rounded);
          }
        }}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const parsed = parseNumeric(raw, allowNegative);
          if (parsed === null) {
            onValueChange(null);
          } else if (Number.isFinite(parsed)) {
            onValueChange(parsed);
          }
        }}
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}

export type PercentInputProps = Omit<NumberInputProps, "decimals" | "thousandSeparator" | "inputClassName"> & {
  decimals?: number; // legacy support; if provided, sets both min/max
  showSuffix?: boolean;
};

export function PercentInput({ value, onValueChange, decimals, showSuffix = false, className, minDecimals, maxDecimals, ...rest }: PercentInputProps) {
  // Default: show at least one decimal, up to two when blurred
  const minD = typeof minDecimals === 'number' ? minDecimals : (typeof decimals === 'number' ? decimals : 1);
  const maxD = typeof maxDecimals === 'number' ? maxDecimals : (typeof decimals === 'number' ? decimals : 2);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <NumberInput
        {...rest}
        value={value}
        onValueChange={(v) => onValueChange(v == null ? 0 : v)}
        minDecimals={minD}
        maxDecimals={maxD}
        thousandSeparator={false}
        className="flex-1"
      />
      {showSuffix ? <span className="text-sm text-muted-foreground">%</span> : null}
    </div>
  );
}
