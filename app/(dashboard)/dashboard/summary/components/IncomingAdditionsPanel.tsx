import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  additions: any[];
  title?: string;
  renderItem: (inc: any) => React.ReactNode;
  onAccept: (index: number) => void;
  onDismiss: (index: number) => void;
};

export default function IncomingAdditionsPanel({ additions, title = 'Incoming new items', renderItem, onAccept, onDismiss }: Props) {
  if (!additions || additions.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="font-semibold mb-2">{title}</div>
      <div className="space-y-2">
        {additions.map((inc, i) => (
          <div key={i} className="rounded-md border border-green-300 bg-green-50 p-3 text-sm suggestion-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {renderItem(inc)}
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={(e) => { e.preventDefault(); onAccept(i); }}>Accept Add</Button>
              <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); onDismiss(i); }}>Dismiss</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
