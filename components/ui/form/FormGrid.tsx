import React from 'react';

export default function FormGrid({ children, colsMd = 2 }: { children: React.ReactNode; colsMd?: number }) {
  const mdClass = `md:grid-cols-${colsMd}`;
  return (
    <div className={`grid grid-cols-1 ${mdClass} gap-4`}>
      {children}
    </div>
  );
}
