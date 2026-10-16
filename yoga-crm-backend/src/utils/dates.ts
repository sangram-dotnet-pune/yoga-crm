const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value: string): boolean {
  return DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

export function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(value: string, days: number): string {
  const date = toDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}
