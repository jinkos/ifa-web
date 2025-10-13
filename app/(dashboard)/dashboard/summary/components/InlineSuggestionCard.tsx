"use client";
import { Button } from '@/components/ui/button';
import React from 'react';

type Props = {
  type: 'conflict' | 'removal';
  title?: string;
  currentContent?: React.ReactNode;
  incomingContent?: React.ReactNode;
  onAccept: (e: React.MouseEvent) => void;
  onReject?: (e: React.MouseEvent) => void;
  acceptLabel?: string;
  rejectLabel?: string;
  className?: string;
};

export default function InlineSuggestionCard({
  type,
  title,
  currentContent,
  incomingContent,
  onAccept,
  onReject,
  acceptLabel,
  rejectLabel,
  className,
}: Props) {
  if (type === 'conflict') {
    return (
      <div className={`mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm suggestion-card ${className ?? ''}`}>
        {title && <div className="font-medium mb-1">{title}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-gray-600">Current</div>
            {currentContent}
          </div>
          <div>
            <div className="text-xs text-gray-600">Incoming</div>
            {incomingContent}
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={onAccept}>{acceptLabel ?? 'Accept Incoming'}</Button>
          {onReject && (
            <Button size="sm" variant="outline" onClick={onReject}>{rejectLabel ?? 'Keep Current'}</Button>
          )}
        </div>
      </div>
    );
  }
  // removal
  return (
    <div className={`mt-2 rounded-md border border-gray-300 bg-gray-50 p-3 text-sm suggestion-card ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <span>{title ?? 'Missing in incoming data. Remove this item?'}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onAccept}>{acceptLabel ?? 'Accept Remove'}</Button>
          {onReject && (
            <Button size="sm" variant="ghost" onClick={onReject}>{rejectLabel ?? 'Keep'}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
