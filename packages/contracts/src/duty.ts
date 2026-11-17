// NSW transfer duty (stamp duty), shared by the panel's cost card and the chat agent's calculator.

/** General transfer duty bands, 2026/27 (Revenue NSW, "How to calculate transfer duty"). */
const DUTY_BANDS: [from: number, base: number, ratePer100: number][] = [
  [0, 0, 1.25],
  [18_000, 225, 1.5],
  [38_000, 525, 1.75],
  [103_000, 1_662, 3.5],
  [387_000, 11_602, 4.5],
  [1_290_000, 52_237, 5.5],
  [3_870_000, 194_137, 7], // premium property duty
];
export const DUTY_SOURCE = "Revenue NSW transfer duty rates 2026/27";

/** Standard transfer duty: no first home buyer concessions and no foreign purchaser surcharge. */
export function nswTransferDuty(price: number): number {
  if (!(price > 0)) return 0;
  const [from, base, rate] = [...DUTY_BANDS].reverse().find(([f]) => price > f) ?? DUTY_BANDS[0]!;
  return Math.max(20, Math.ceil(base + ((price - from) * rate) / 100));
}
