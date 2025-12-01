"use client";
import React from "react";
import LooseNumberInput from "@/components/ui/loose-number-input";

interface Props {
  estateNetWorth: number;
  netChangeOnDeath: string;
  setNetChangeOnDeath: (s: string) => void;
  trustAssetsTotal: number;
  taxableEstate: number;
  giftsPrevSevenYears: number;
  setGiftsPrevSevenYears: (n: number) => void;
  parseLooseNumber: (s: string) => number;
  taxableEstateIncludingGifts: number;
  lifetimeAllowances: number;
  setLifetimeAllowances: (n: number) => void;
  nilRateBand: number;
  giftsToCharityOnDeath: number;
  setGiftsToCharityOnDeath: (n: number) => void;
  aprBprTotal: number;
  exemptGiftsAnnual: number;
  setExemptGiftsAnnual: (n: number) => void;
  residenceNrbApplying: number;
  setResidenceNrbApplying: (n: number) => void;
}

export default function IhtSummary(props: Props) {
  const {
    estateNetWorth,
    netChangeOnDeath,
    setNetChangeOnDeath,
    trustAssetsTotal,
    taxableEstate,
    giftsPrevSevenYears,
    setGiftsPrevSevenYears,
    parseLooseNumber,
    taxableEstateIncludingGifts,
    lifetimeAllowances,
    setLifetimeAllowances,
    nilRateBand,
    giftsToCharityOnDeath,
    setGiftsToCharityOnDeath,
    aprBprTotal,
    exemptGiftsAnnual,
    setExemptGiftsAnnual,
    residenceNrbApplying,
    setResidenceNrbApplying,
  } = props;

  // Derived summary values
  const estateSubjectToIht = Math.max(
    0,
    (Number(taxableEstateIncludingGifts) || 0)
      - (Number(nilRateBand) || 0)
      - (Number(giftsToCharityOnDeath) || 0)
      - (Number(aprBprTotal) || 0)
      - (Number(exemptGiftsAnnual) || 0)
      - (Number(residenceNrbApplying) || 0)
  );
  const charityGift = Math.max(0, Number(giftsToCharityOnDeath) || 0);
  const reducedRateApplies = estateSubjectToIht > 0 && charityGift >= 0.1 * estateSubjectToIht;
  const ihtRate = reducedRateApplies ? 0.36 : 0.4;
  const ihtPayable = Math.max(0, Math.round(estateSubjectToIht * ihtRate));
  const netEstateAfterTax = Math.max(0, Math.round(estateSubjectToIht - ihtPayable));
  // Estate to beneficiaries including previous gifts = Net estate after tax + Add back assets in trust + Add back APR/BPR
  const beneficiariesIncludingPrevGifts = Math.max(
    0,
    Math.round(
      (Number(netEstateAfterTax) || 0)
      + (Number(trustAssetsTotal) || 0)
      + (Number(aprBprTotal) || 0)
    )
  );
  // Additional derived fields for extended summary
  const deductRemainingGiftsAlreadyMade = Math.max(0, Number(giftsPrevSevenYears) || 0);
  const addBackAprBpr = Math.max(0, Number(aprBprTotal) || 0);
  const valueToBeneficiariesOnDeath = Math.max(0, beneficiariesIncludingPrevGifts - deductRemainingGiftsAlreadyMade);
  const effectiveIhtRateOnTaxableEstate = (() => {
    const denom = (Number(ihtPayable) || 0) + (Number(valueToBeneficiariesOnDeath) || 0) + (Number(charityGift) || 0);
    return denom > 0 ? (ihtPayable / denom) : 0;
  })();
  // Baseline Amount = Taxable Estate Including Gifts + Nil Rate Band + Exempt Gifts (annual)
  const baselineAmount = (
    (Number(taxableEstateIncludingGifts) || 0)
    + (Number(nilRateBand) || 0)
    + (Number(exemptGiftsAnnual) || 0)
  );

  return (
    <div className="mb-6 border rounded-md bg-white dark:bg-black">
      <div className="px-4 py-3 border-b font-medium">Estate Value on Death (IHT Summary)</div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* Left column: first 13 fields through Estate Subject to IHT */}
          <div className="space-y-2">
            <div className="flex justify-between"><span>Current value of estate - net worth</span><span className="font-medium tabular-nums">£{Number(estateNetWorth).toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between">
              <span>Net change to estate on death</span>
              <span className="font-medium">
                <LooseNumberInput
                  value={netChangeOnDeath}
                  onChange={(s) => setNetChangeOnDeath(s)}
                  className="w-32"
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Assets written in trust</span>
              <span className="font-medium tabular-nums">£{Number(trustAssetsTotal).toLocaleString('en-GB')}</span>
            </div>
            <div className="flex justify-between"><span>Taxable Estate</span><span className="font-medium tabular-nums">£{Number(taxableEstate).toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between">
              <span>Add Gifts in previous 7 years</span>
              <span className="font-medium">
                <LooseNumberInput
                  value={String(giftsPrevSevenYears)}
                  onChange={(s) => setGiftsPrevSevenYears(parseLooseNumber(s))}
                  className="w-32"
                />
              </span>
            </div>
            <div className="flex justify-between"><span>Taxable Estate Including Gifts</span><span className="font-medium tabular-nums">£{Number(taxableEstateIncludingGifts).toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Number of Lifetime Allowances</span><span className="font-medium"><input type="number" min={0} className="w-20 px-2 py-1 border rounded text-right" value={String(lifetimeAllowances)} onChange={(e) => { const n = Number(e.target.value); setLifetimeAllowances(Number.isNaN(n) ? 0 : Math.max(0, n)); }} /></span></div>
            <div className="flex justify-between"><span>Nil rate band (assuming past gifts are over 7 years)</span><span className="font-medium tabular-nums">£{Number(nilRateBand).toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between">
              <span>Gifts to charity on death</span>
              <span className="font-medium">
                <input
                  type="number"
                  min={0}
                  className="w-32 px-2 py-1 border rounded text-right"
                  value={String(giftsToCharityOnDeath)}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setGiftsToCharityOnDeath(Number.isNaN(n) ? 0 : Math.max(0, n));
                  }}
                />
              </span>
            </div>
            <div className="flex justify-between"><span>APR / BPR qualifying investments</span><span className="font-medium tabular-nums">£{Number(aprBprTotal).toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Exempt Gifts (i.e. £3k annual gift)</span><span className="font-medium"><LooseNumberInput value={String(exemptGiftsAnnual)} onChange={(s) => setExemptGiftsAnnual(parseLooseNumber(s))} className="w-32" /></span></div>
            <div className="flex justify-between"><span>Amount of Residence NRB Applying</span><span className="font-medium"><LooseNumberInput value={String(residenceNrbApplying)} onChange={(s) => setResidenceNrbApplying(parseLooseNumber(s))} className="w-32" /></span></div>
            <div className="flex justify-between"><span>Estate Subject to IHT</span><span className="font-medium tabular-nums">£{estateSubjectToIht.toLocaleString('en-GB')}</span></div>
          </div>
          {/* Right column: subsequent fields and outputs */}
          <div className="space-y-2">
            <div className="flex justify-between"><span>IHT Rate Payable</span><span className="font-medium tabular-nums">{Math.round(ihtRate * 100)}%</span></div>
            <div className="flex justify-between"><span>IHT Payable</span><span className="font-medium tabular-nums">£{ihtPayable.toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Net Estate after tax</span><span className="font-medium tabular-nums">£{netEstateAfterTax.toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Add back assets written in trust</span><span className="font-medium tabular-nums">£{Number(trustAssetsTotal).toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Add back APR / BPR</span><span className="font-medium tabular-nums">£{Number(addBackAprBpr).toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Estate to beneficiaries including previous gifts</span><span className="font-medium tabular-nums">£{beneficiariesIncludingPrevGifts.toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Deduct remaining gifts already made</span><span className="font-medium tabular-nums">£{deductRemainingGiftsAlreadyMade.toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Value to beneficiaries on death</span><span className="font-medium tabular-nums">£{valueToBeneficiariesOnDeath.toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Value passed to charity on death</span><span className="font-medium tabular-nums">£{charityGift.toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Effective IHT Rate on Taxable Estate</span><span className="font-medium tabular-nums">{(effectiveIhtRateOnTaxableEstate * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>Baseline Amount</span><span className="font-medium tabular-nums">£{baselineAmount.toLocaleString('en-GB')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
