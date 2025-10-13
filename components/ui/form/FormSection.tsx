import React from 'react';

export default function FormSection({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
      {children}
    </section>
  );
}
