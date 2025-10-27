import React from 'react';
import { Button } from '@/components/ui/button';

export function DemoModal({
  open,
  onClose,
  title = 'Demo access by invitation only',
  contactEmail = 'ifagent@everard.me.uk',
  children
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  contactEmail?: string;
  children?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="text-sm text-gray-700 mb-4">
          {children ? (
            children
          ) : (
            <>
              This demo is restricted. For a free demo, please contact{' '}
              <a href={`mailto:${contactEmail}`} className="text-orange-600 underline">
                {contactEmail}
              </a>
              .
            </>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default DemoModal;
