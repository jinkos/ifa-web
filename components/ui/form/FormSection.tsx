import React from 'react';

export default function FormSection({ title, children, className = '', action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={className}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div>{action}</div>
        </div>
      )}
      {children}
    </section>
  );
}
