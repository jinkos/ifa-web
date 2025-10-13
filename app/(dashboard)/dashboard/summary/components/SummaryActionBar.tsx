import React from 'react';
import ActionBar from '@/components/action-bar';

type Props = {
  className?: string;
  loading: boolean;
  saving: boolean;
  saved: boolean;
  saveError?: string | null;
  extracting: boolean;
  extractError?: string | null;
  canAct: boolean;
  fieldSuggestions: Record<string, any> | null;
  onAcceptFields: () => void;
  onRejectFields: () => void;
  onSave: () => Promise<void>;
  onExtract: () => Promise<void>;
};

export default function SummaryActionBar({
  className,
  loading,
  saving,
  saved,
  saveError,
  extracting,
  extractError,
  canAct,
  fieldSuggestions,
  onAcceptFields,
  onRejectFields,
  onSave,
  onExtract,
}: Props) {
  return (
    <ActionBar
      className={className}
      loading={loading}
      saving={saving}
      saved={saved}
      saveError={saveError}
      extracting={extracting}
      extractError={extractError}
      canAct={canAct}
      extras={fieldSuggestions && Object.keys(fieldSuggestions).length > 0 ? (
        <div className="flex items-center gap-2 mr-2">
          <button
            type="button"
            className="px-3 py-1 rounded border border-amber-400 text-amber-800 bg-amber-100 hover:bg-amber-200"
            onClick={onAcceptFields}
          >
            Accept All ({Object.keys(fieldSuggestions).length})
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
            onClick={onRejectFields}
          >
            Reject All
          </button>
        </div>
      ) : null}
      onSave={onSave}
      onExtract={onExtract}
    />
  );
}
