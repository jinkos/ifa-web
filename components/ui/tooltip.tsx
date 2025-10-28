import React from 'react';

export function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  // Minimal tooltip: use native title for demo simplicity
  return <span title={String(content)}>{children}</span>;
}
