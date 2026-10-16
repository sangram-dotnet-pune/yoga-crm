import type {
  ApptStatus,
  ExpenseCategory,
  PatientStatus,
  PayMethod,
  XrayKind,
} from '@prisma/client';

export const PATIENT_STATUSES = ['Active', 'Completed', 'Follow-up'] as const;
export type PatientStatusLabel = (typeof PATIENT_STATUSES)[number];

const PATIENT_STATUS_TO_DB: Record<PatientStatusLabel, PatientStatus> = {
  Active: 'ACTIVE',
  Completed: 'COMPLETED',
  'Follow-up': 'FOLLOW_UP',
};

export function patientStatusToDb(label: PatientStatusLabel): PatientStatus {
  return PATIENT_STATUS_TO_DB[label];
}

export function patientStatusToApi(value: PatientStatus): PatientStatusLabel {
  switch (value) {
    case 'COMPLETED':
      return 'Completed';
    case 'FOLLOW_UP':
      return 'Follow-up';
    default:
      return 'Active';
  }
}

export const PAY_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'] as const;
export type PayMethodLabel = (typeof PAY_METHODS)[number];

const PAY_METHOD_TO_DB: Record<PayMethodLabel, PayMethod> = {
  Cash: 'CASH',
  UPI: 'UPI',
  Card: 'CARD',
  'Bank Transfer': 'BANK_TRANSFER',
  Other: 'OTHER',
};

export function payMethodToDb(label: PayMethodLabel): PayMethod {
  return PAY_METHOD_TO_DB[label];
}

export function payMethodToApi(value: PayMethod): PayMethodLabel {
  switch (value) {
    case 'UPI':
      return 'UPI';
    case 'CARD':
      return 'Card';
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    case 'OTHER':
      return 'Other';
    default:
      return 'Cash';
  }
}

export const EXPENSE_CATEGORIES = [
  'Equipment',
  'Supplies',
  'Rent',
  'Utilities',
  'Marketing',
  'Staff',
  'Maintenance',
  'Other',
] as const;
export type ExpenseCategoryLabel = (typeof EXPENSE_CATEGORIES)[number];

const EXPENSE_CATEGORY_TO_DB: Record<ExpenseCategoryLabel, ExpenseCategory> = {
  Equipment: 'EQUIPMENT',
  Supplies: 'SUPPLIES',
  Rent: 'RENT',
  Utilities: 'UTILITIES',
  Marketing: 'MARKETING',
  Staff: 'STAFF',
  Maintenance: 'MAINTENANCE',
  Other: 'OTHER',
};

export function expenseCategoryToDb(label: ExpenseCategoryLabel): ExpenseCategory {
  return EXPENSE_CATEGORY_TO_DB[label];
}

export function expenseCategoryToApi(value: ExpenseCategory): ExpenseCategoryLabel {
  switch (value) {
    case 'SUPPLIES':
      return 'Supplies';
    case 'RENT':
      return 'Rent';
    case 'UTILITIES':
      return 'Utilities';
    case 'MARKETING':
      return 'Marketing';
    case 'STAFF':
      return 'Staff';
    case 'MAINTENANCE':
      return 'Maintenance';
    case 'OTHER':
      return 'Other';
    default:
      return 'Equipment';
  }
}

export const APPT_TYPES = [
  'Initial assessment',
  'Follow-up',
  'Rehabilitation',
  'Therapy session',
  'Consultation',
] as const;

export const APPT_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No Show'] as const;
export type ApptStatusLabel = (typeof APPT_STATUSES)[number];

const APPT_STATUS_TO_DB: Record<ApptStatusLabel, ApptStatus> = {
  Scheduled: 'SCHEDULED',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  'No Show': 'NO_SHOW',
};

export function apptStatusToDb(label: ApptStatusLabel): ApptStatus {
  return APPT_STATUS_TO_DB[label];
}

export function apptStatusToApi(value: ApptStatus): ApptStatusLabel {
  switch (value) {
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'No Show';
    default:
      return 'Scheduled';
  }
}

export const XRAY_KINDS = ['Before', 'After', 'Record'] as const;
export type XrayKindLabel = (typeof XRAY_KINDS)[number];

const XRAY_KIND_TO_DB: Record<XrayKindLabel, XrayKind> = {
  Before: 'LEGACY_BEFORE',
  After: 'LEGACY_AFTER',
  Record: 'RECORD',
};

export function xrayKindToDb(label: XrayKindLabel): XrayKind {
  return XRAY_KIND_TO_DB[label];
}

export function xrayKindToApi(value: XrayKind): XrayKindLabel {
  switch (value) {
    case 'LEGACY_BEFORE':
      return 'Before';
    case 'LEGACY_AFTER':
      return 'After';
    default:
      return 'Record';
  }
}
