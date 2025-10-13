"use client";
import React from 'react';

export type ActionBarProps = {
  loading?: boolean;
  saving?: boolean;
  saved?: boolean;
  saveError?: string | null;
  extracting?: boolean;
  extractError?: string | null;
  canAct?: boolean; // team/client presence; when false, disable actions
  onSave: () => void | Promise<void>;
  onExtract: () => void | Promise<void>;
  className?: string;
  saveLabel?: string;
  extractLabel?: string;
  extras?: React.ReactNode; // optional extra toolbar actions rendered next to buttons
};

export function ActionBar(props: ActionBarProps) {
  const {
    loading = false,
    saving = false,
    saved = false,
    saveError = null,
    extracting = false,
    extractError = null,
    canAct = true,
    onSave,
    onExtract,
    className,
    saveLabel = 'Save',
    extractLabel = 'Extract from Docs',
  } = props;

  const saveDisabled = saving || loading || !canAct;
  const extractDisabled = extracting || loading || !canAct;

  return (
    <div className={`flex items-center justify-between ${className ?? ''}`}>
      <div className="text-sm text-gray-600">
        {loading ? 'Loading…' : saved ? 'All changes saved.' : 'Edit fields then click Save.'}
      </div>
      <div className="flex items-center gap-3">
        {props.extras}
        {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
        <button
          className={`px-4 py-2 rounded text-white ${saveDisabled ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
          disabled={saveDisabled}
          onClick={() => void onSave()}
        >
          {saving ? 'Saving…' : saveLabel}
        </button>
        <button
          className={`px-4 py-2 rounded text-white ${extractDisabled ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          disabled={extractDisabled}
          onClick={() => void onExtract()}
        >
          {extracting ? 'Extracting…' : extractLabel}
        </button>
        {extractError && <span className="text-red-600 text-sm">{extractError}</span>}
      </div>
    </div>
  );
}

export default ActionBar;