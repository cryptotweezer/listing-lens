// Unit tests for the money card arithmetic: NSW transfer duty bands, repayments and cash flow.
import { describe, expect, it } from "vitest";
import { moneyFigures, nswTransferDuty, parseAmount, perYear, weeklyRepayment } from "../lib/money";

describe("nswTransferDuty (2026/27)", () => {
  it("matches the published band bases", () => {
    expect(nswTransferDuty(1_290_000)).toBe(52_237);
    expect(nswTransferDuty(3_870_000)).toBe(194_137);
    expect(nswTransferDuty(387_000)).toBe(11_602);
  });
  it("applies the rate above each threshold", () => {
    expect(nswTransferDuty(2_000_000)).toBe(52_237 + 39_050);
    expect(nswTransferDuty(1_000)).toBe(20);
  });
});

describe("repayments and cash flow", () => {
  it("gives the standard P&I repayment", () => {
    // $1.6M over 30 years at 6%: about $9,593 a month.
    expect(Math.round((weeklyRepayment(1_600_000, 6) * 52) / 12)).toBe(9593);
  });
  it("puts it together", () => {
    const m = moneyFigures({ price: 2_000_000, depositPct: 20, ratePct: 6, strataAnnual: 10_400, rentWeekly: 1700 });
    expect(m.upfront).toBe(400_000 + 91_287);
    expect(Math.round(m.grossYieldPct!)).toBe(4);
    expect(m.cashFlow!).toBeLessThan(0);
  });
  it("parses amounts and yearly rates", () => {
    expect(parseAmount("850k")).toBe(850_000);
    expect(parseAmount("$1.2m")).toBe(1_200_000);
    expect(parseAmount("abc")).toBeNull();
    expect(Math.round(perYear(21, 2) * 10) / 10).toBe(10);
  });
});
