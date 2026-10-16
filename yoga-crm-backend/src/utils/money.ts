export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? roundMoney(amount) : 0;
}
