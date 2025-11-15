"use client";
import React from 'react';
import type { SpendingCategory } from '@/lib/api/statements';

interface CategorySwitchProps {
  value: SpendingCategory;
  onChange: (category: SpendingCategory) => void;
  disabled?: boolean;
}

export default function CategorySwitch({ value, onChange, disabled }: CategorySwitchProps) {
  const categories: Array<{ value: SpendingCategory; label: string; activeClass: string }> = [
    { value: 'Discretionary', label: 'D', activeClass: 'bg-blue-600 text-white' },
    { value: 'Non-Discret', label: 'N', activeClass: 'bg-orange-600 text-white' },
    { value: 'Funding', label: 'F', activeClass: 'bg-green-600 text-white' },
    { value: 'Unknown', label: 'U', activeClass: 'bg-gray-500 text-white' },
  ];

  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      {categories.map((cat) => {
        const isActive = value === cat.value;

        return (
          <button
            key={cat.value}
            type="button"
            disabled={disabled}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? cat.activeClass
                : 'bg-white/70 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange(cat.value)}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
