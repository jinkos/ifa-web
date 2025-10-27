"use client";
import React from 'react';

export default function SuggestionInline({
  value,
  onAccept,
  onReject,
  label = 'Incoming:'
}: {
  value: React.ReactNode;
  onAccept: () => void;
  onReject: () => void;
  label?: string;
}) {
  return (
    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 flex items-center justify-between">
      <div className="truncate pr-3">
        <span className="opacity-80 mr-1">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-1 rounded bg-gray-900 text-white hover:bg-black"
          onClick={onAccept}
        >
          Accept
        </button>
        <button
          type="button"
          className="px-3 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
          onClick={onReject}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
