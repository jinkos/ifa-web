// ------------------------
// Type Definitions
// ------------------------

export type Frequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "six_monthly"
  | "annually"
  | "unknown";

export type NetGross = "net" | "gross" | "unknown";

export interface CashFlow {
  periodic_amount?: number;
  frequency?: Frequency;
  net_gross?: NetGross;
}

export interface ForwardValueAssumptions {
  annual_growth_rate: number;        // asset growth rate
  contribution_growth_rate: number;  // contribution/rent growth
  inflation_rate: number;            // inflation / indexation
  loan_interest_rate: number;        // debt interest
  tax_rate: number;                  // flat effective tax
  income_generation_rate: number;    // yield/withdrawal rate
  above_inflation_growth_rate?: number; // real growth above inflation (for DB/state pensions), default 1%
}

export interface ForwardValueResult {
  item_type: string;
  future_capital_value: number;
  retirement_income_contribution: number;
  debug?: Record<string, any>;
}

// ------------------------
// Math Helpers
// ------------------------

function compound(amount: number | undefined, rate: number, years: number): number {
  if (!amount || amount <= 0) return 0;
  return amount * Math.pow(1 + rate, years);
}

function annualiseCashflow(cf?: CashFlow): number {
  if (!cf || !cf.periodic_amount) return 0;
  const amt = cf.periodic_amount;
  switch (cf.frequency) {
    case "weekly": return amt * 52;
    case "monthly": return amt * 12;
    case "quarterly": return amt * 4;
    case "six_monthly": return amt * 2;
    case "annually": return amt * 1;
    default: return 0;
  }
}

function netAfterTax(annualGross: number, cf: CashFlow | undefined, taxRate: number): number {
  if (!cf) return 0;
  if (cf.net_gross === "net") return annualGross;
  if (cf.net_gross === "gross") return annualGross * (1 - taxRate);
  return annualGross;
}

function growCashflow(annualAmount: number, growthRate: number, years: number): number {
  return annualAmount * Math.pow(1 + growthRate, years);
}

function futureValueOfContributions(
  cf: CashFlow | undefined,
  assumptions: ForwardValueAssumptions,
  years: number
): number {
  if (!cf || !cf.periodic_amount) return 0;
  const annualNow = annualiseCashflow(cf);
  const escalated = annualNow * Math.pow(1 + assumptions.contribution_growth_rate, years);
  const r = assumptions.annual_growth_rate;
  return r === 0 ? escalated * years : escalated * ((Math.pow(1 + r, years) - 1) / r);
}

function periodsPerYear(freq: Frequency | undefined): number {
  switch (freq) {
    case "weekly":
      return 52;
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "six_monthly":
      return 2;
    case "annually":
      return 1;
    default:
      return 12; // sensible default
  }
}

function futureDebtWithRepayments(
  balanceNow: number | undefined,
  repayment: CashFlow | undefined,
  annualRate: number,
  years: number
): { futureBalance: number; periodsApplied: number; paidOffEarly: boolean } {
  let B = Math.max(balanceNow ?? 0, 0);
  if (B === 0) return { futureBalance: 0, periodsApplied: 0, paidOffEarly: false };

  const n = periodsPerYear(repayment?.frequency ?? "monthly");
  const r = annualRate / n;
  const P = Math.max(repayment?.periodic_amount ?? 0, 0);
  const N = Math.max(0, Math.round(years * n));

  let paidOffEarly = false;
  let i = 0;
  for (i = 0; i < N; i++) {
    // accrue interest for the period
    B = B * (1 + r);
    // subtract repayment
    if (P > 0) {
      B = B - P;
      if (B <= 0) {
        B = 0;
        paidOffEarly = true;
        break;
      }
    }
  }
  return { futureBalance: B, periodsApplied: i, paidOffEarly };
}

// ------------------------
// Projection Helpers
// ------------------------

function projectPotStyleAsset(
  startingValue: number | undefined,
  contribution: CashFlow | undefined,
  assumptions: ForwardValueAssumptions,
  years: number,
  taxSheltered: boolean
): ForwardValueResult {
  const potFromStart = compound(startingValue ?? 0, assumptions.annual_growth_rate, years);
  const potFromContribs = futureValueOfContributions(contribution, assumptions, years);
  const futurePot = potFromStart + potFromContribs;
  const grossIncome = futurePot * assumptions.income_generation_rate;
  const netIncome = taxSheltered ? grossIncome : grossIncome * (1 - assumptions.tax_rate);
  return {
    item_type: "investment",
    future_capital_value: futurePot,
    retirement_income_contribution: netIncome,
    debug: { potFromStart, potFromContribs },
  };
}

function projectPropertyAsset(
  propertyValue: number | undefined,
  loanBalance: number | undefined,
  loanRepayment: CashFlow | undefined,
  rentalIncome: CashFlow | undefined,
  assumptions: ForwardValueAssumptions,
  years: number,
  mode: "main_home" | "holiday_home" | "buy_to_let"
): ForwardValueResult {
  const propertyNow = Math.max(propertyValue ?? 0, 0);
  const propertyFuture = compound(propertyNow, assumptions.annual_growth_rate, years);
  const openingDebt = loanBalance ?? 0;
  const debtFuture = openingDebt > 0
    ? futureDebtWithRepayments(openingDebt, loanRepayment, assumptions.loan_interest_rate, years).futureBalance
    : 0;
  const equity = (propertyFuture - debtFuture);

  // Compute rental that scales with property value using current yield
  let rentYield = 0; // annual rent as a proportion of current property value
  let rentFutureNet = 0;
  if (mode === "buy_to_let" && rentalIncome) {
    const annualRentNow = annualiseCashflow(rentalIncome);
    if (propertyNow > 0 && annualRentNow > 0) {
      rentYield = annualRentNow / propertyNow;
      // If current rent is marked as gross, apply tax at retirement; if net, keep as is
      if (rentalIncome.net_gross === "gross") {
        const futureGross = propertyFuture * rentYield;
        rentFutureNet = futureGross * (1 - assumptions.tax_rate);
      } else {
        // treat unknown or net as net for the proportion
        rentFutureNet = propertyFuture * rentYield;
        if (rentalIncome.net_gross === "unknown") {
          // conservative: apply tax
          rentFutureNet = rentFutureNet * (1 - assumptions.tax_rate);
        }
      }
    }
  }

  // Income from selling (drawdown on equity at retirement)
  const sellIncomeNet = equity * assumptions.income_generation_rate * (1 - assumptions.tax_rate);

  // Default retirement income: for BTL use scaled rent; for others use draw on equity
  const retirementIncome = mode === "buy_to_let" ? rentFutureNet : sellIncomeNet;

  return {
    item_type: "property",
    future_capital_value: equity,
    retirement_income_contribution: retirementIncome,
    debug: { propertyFuture, debtFuture, equity, rentYield, rentFutureNet, sellIncomeNet },
  };
}

function projectDebtItem(
  balanceNow: number | undefined,
  repayment: CashFlow | undefined,
  assumptions: ForwardValueAssumptions,
  years: number
): ForwardValueResult {
  const futureDebt = futureDebtWithRepayments(balanceNow ?? 0, repayment, assumptions.loan_interest_rate, years).futureBalance;
  return {
    item_type: "debt",
    future_capital_value: -futureDebt,
    retirement_income_contribution: 0,
    debug: { futureDebt },
  };
}

function projectPensionIncomeOnly(
  pensionCF: CashFlow | undefined,
  assumptions: ForwardValueAssumptions,
  years: number
): ForwardValueResult {
  // Pensions quoted "in today's money"; grow only by above-inflation (real) rate
  const annualBase = annualiseCashflow(pensionCF);
  const realRate = assumptions.above_inflation_growth_rate ?? 0.01; // default 1%
  const retirementIncome = growCashflow(annualBase, realRate, years);
  return {
    item_type: "pension_income",
    future_capital_value: 0,
    retirement_income_contribution: retirementIncome,
    debug: { annualBase, realRate },
  };
}

// ------------------------
// The Main Class
// ------------------------

export class BalanceSheetItemProjector {
  bsItem: any;  // could be strongly typed to your BSItem interface
  assumptions: ForwardValueAssumptions;

  constructor(bsItem: any, assumptions?: Partial<ForwardValueAssumptions>) {
    this.bsItem = bsItem;
    this.assumptions = Object.assign(
      {
        annual_growth_rate: 0.04,
        contribution_growth_rate: 0.03,
        inflation_rate: 0.025,
        loan_interest_rate: 0.05,
        tax_rate: 0.2,
        income_generation_rate: 0.04,
        above_inflation_growth_rate: 0.01,
      },
      assumptions
    );
  }

  project(years: number): ForwardValueResult {
    const t = this.bsItem.type;
    const data = this.bsItem.ite;

    // Investment / pension pots
    if (
      [
        "current_account",
        "gia",
        "isa",
        "premium_bond",
        "savings_account",
        "uni_fees_savings_plan",
        "vct",
        "workplace_pension",
        "personal_pension",
      ].includes(t)
    ) {
      const taxSheltered = t === "isa";
      return projectPotStyleAsset(
        data.investment_value,
        data.contribution,
        this.assumptions,
        years,
        taxSheltered
      );
    }

    // Property
    if (["main_residence", "holiday_home", "buy_to_let"].includes(t)) {
      const propertyVal = data.value ?? data.property_value;
      const loanBal = data.loan?.balance ?? 0;
      const loanRepayment = data.loan?.repayment;
      const rentCF = data.rental_income;
      const mode = t === "buy_to_let" ? "buy_to_let" : (t === "main_residence" ? "main_home" : "holiday_home");
      return projectPropertyAsset(propertyVal, loanBal, loanRepayment, rentCF, this.assumptions, years, mode);
    }

    // Debt
    if (["credit_card", "personal_loan", "student_loan"].includes(t)) {
      return projectDebtItem(data.balance, data.repayment, this.assumptions, years);
    }

    // Income-only pensions
    if (["state_pension", "defined_benefit_pension"].includes(t)) {
      return projectPensionIncomeOnly(data.pension, this.assumptions, years);
    }

    // Salary / expenses
    if (
      ["salary_income", "side_hustle_income", "self_employment_income", "expenses"].includes(t)
    ) {
      return {
        item_type: t,
        future_capital_value: 0,
        retirement_income_contribution: 0,
        debug: { note: "treated as non-retirement asset" },
      };
    }

    // Default
    return {
      item_type: t,
      future_capital_value: 0,
      retirement_income_contribution: 0,
      debug: { note: "unhandled item type" },
    };
  }

  currentValue(): number {
    const t = this.bsItem.type;
    const data = this.bsItem.ite;

    // Investments / pensions
    if (
      [
        "current_account",
        "gia",
        "isa",
        "premium_bond",
        "savings_account",
        "uni_fees_savings_plan",
        "vct",
        "workplace_pension",
        "personal_pension",
      ].includes(t)
    ) {
      return data.investment_value ?? 0;
    }

    // Properties
    if (["main_residence", "holiday_home", "buy_to_let"].includes(t)) {
  const propertyVal = data.value ?? data.property_value ?? 0;
  const loanBal = data.loan?.balance ?? 0;
  return (propertyVal - loanBal);
    }

    // Debts
    if (["credit_card", "personal_loan", "student_loan"].includes(t)) {
      return -(data.balance ?? 0);
    }

    // Non-assets
    return 0;
  }
}
