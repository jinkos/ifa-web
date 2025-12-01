"use client";
import React from "react";
import LooseNumberInput from "@/components/ui/loose-number-input";
import type { BalanceSheetItemKind } from "@/lib/types/balance";

interface Props {
  pbsItems: any[];
  getItemBg: (t: BalanceSheetItemKind) => string;
  getItemKey: (it: any, idx: number) => string;
  isIhtAsset: (kind: BalanceSheetItemKind) => boolean;
  ihtIgnore: Record<string, boolean>;
  setIhtIgnore: (f: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  ihtTrust: Record<string, boolean>;
  setIhtTrust: (f: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
}

export default function IhtPlanning(props: Props) {
  const { pbsItems, getItemBg, getItemKey, isIhtAsset, ihtIgnore, setIhtIgnore, ihtTrust, setIhtTrust } = props;

  return (
    <>
      {/* Assets list (title, type, value) with same coloring */}
      <div className="mt-6 border rounded-md bg-white dark:bg-black">
        <div className="px-4 py-3 border-b font-medium">Assets</div>
        <div className="p-4 space-y-3">
          {pbsItems && pbsItems.length > 0 ? (
            pbsItems
              .filter((it: any) => isIhtAsset(it.type as BalanceSheetItemKind))
              .map((it: any, idx: number) => {
                const rawInvestment = it.ite?.investment_value;
                const rawValue = it.ite?.value;
                const rawProperty = it.ite?.property_value;
                const value = (rawInvestment ?? rawValue ?? rawProperty ?? null);
                const title = it.description || it.type;
                const bg = getItemBg(it.type as BalanceSheetItemKind);
                const key = getItemKey(it, idx);
                const ignored = !!ihtIgnore[key];
                const numeric = Number(value);
                const isNaN = Number.isNaN(numeric);
                return (
                  <div key={`asset-${key}`} className={`rounded-md border p-3 ${bg} dark:bg-neutral-950`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{title}</div>
                        <div className="text-xs text-muted-foreground">{String(it.type).replaceAll('_', ' ')}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium tabular-nums text-right w-[160px]">
                          {value == null || isNaN ? '—' : `£${numeric.toLocaleString('en-GB')}`}
                        </div>
                        <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={!!ihtTrust[key]}
                            onChange={(e) => {
                              setIhtTrust((prev) => ({ ...prev, [key]: e.target.checked }));
                            }}
                          />
                          Trust
                        </label>
                        <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={ignored}
                            onChange={(e) => {
                              setIhtIgnore((prev) => ({ ...prev, [key]: e.target.checked }));
                            }}
                          />
                          Ignore
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-sm text-muted-foreground">No assets found in balance sheet.</div>
          )}
        </div>
      </div>
    </>
  );
}
