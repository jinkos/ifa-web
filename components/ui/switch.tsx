import * as React from "react";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  label?: string;
  className?: string;
}

export function Switch({ checked, onCheckedChange, id, label, className }: SwitchProps) {
  return (
    <label htmlFor={id} className={`flex items-center gap-2 cursor-pointer select-none ${className ?? ""}`}>
      <span className="relative inline-block w-10 h-6">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onCheckedChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={`block w-full h-full rounded-full transition bg-gray-300 ${checked ? "bg-blue-500" : "bg-gray-300"}`}
        ></span>
        <span
          className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`}
        ></span>
      </span>
      {label && <span className="text-sm font-medium">{label}</span>}
    </label>
  );
}
