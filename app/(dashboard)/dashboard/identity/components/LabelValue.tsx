import React from 'react';

export default function LabelValue({ label, children, className = '' }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 py-0.5 ${className}`}>
      <div className="text-xs text-slate-400 uppercase tracking-wider leading-none">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
