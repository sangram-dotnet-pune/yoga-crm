import { roundMoney } from './money';

export type PaymentStatus = 'Done' | 'Pending' | 'Partially paid';

export function derivePaymentStatus(fee: number, paid: number): PaymentStatus {
  if (fee <= 0 || paid <= 0) return 'Pending';
  if (paid >= fee) return 'Done';
  return 'Partially paid';
}

export function balanceOf(fee: number, paid: number): number {
  return roundMoney(Math.max(0, fee - paid));
}

export function creditOf(fee: number, paid: number): number {
  return roundMoney(Math.max(0, paid - fee));
}

export function ledgerTotal(amounts: number[]): number {
  return roundMoney(amounts.reduce((total, amount) => total + amount, 0));
}
