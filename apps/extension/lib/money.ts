// Plain arithmetic for the "do the numbers work?" card. No market estimates here: every input is a figure
// already in the panel (asking price, rent, strata) or one the user sets (deposit, rate, budget).

import { DUTY_SOURCE, nswTransferDuty } from "@mb/contracts";

export { DUTY_SOURCE, nswTransferDuty };

/** Principal and interest repayment per week for a loan over `years`. */
export function weeklyRepayment(loan: number, ratePct: number, years = 30): number {
  if (!(loan > 0)) return 0;
  const n = years * 12;
  const r = ratePct / 100 / 12;
  const monthly = r === 0 ? loan / n : (loan * r) / (1 - (1 + r) ** -n);
  return (monthly * 12) / 52;
}

/** Total change over `years` as a yearly rate: +1.9% over 10 years is about +0.19% a year. */
export const perYear = (totalPct: number, years: number) => ((1 + totalPct / 100) ** (1 / years) - 1) * 100;

/** "850k", "$1.2m", "1,200,000" or "900" -> a number; null when it does not parse. */
export function parseAmount(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  const n = Number(s.replace(/[^0-9.]/g, "")) * (/k$/.test(s) ? 1e3 : /m$/.test(s) ? 1e6 : 1);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export interface MoneyInputs {
  price: number;
  depositPct: number;
  ratePct: number;
  strataAnnual: number;
  /** Weekly rent the home would earn (or cost to rent), when known. */
  rentWeekly: number | null;
}

export function moneyFigures(i: MoneyInputs) {
  const deposit = i.price * (i.depositPct / 100);
  const duty = nswTransferDuty(i.price);
  const loan = i.price - deposit;
  const repay = weeklyRepayment(loan, i.ratePct);
  const strata = i.strataAnnual / 52;
  const own = repay + strata;
  return {
    deposit,
    duty,
    upfront: deposit + duty,
    loan,
    repay,
    strata,
    /** Weekly cost to own: repayments plus strata. */
    own,
    grossYieldPct: i.rentWeekly ? ((i.rentWeekly * 52) / i.price) * 100 : null,
    /** Investor's weekly cash flow before rates, insurance, management, vacancy and tax. */
    cashFlow: i.rentWeekly ? i.rentWeekly - own : null,
  };
}
