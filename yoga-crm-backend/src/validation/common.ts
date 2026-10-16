import { z } from 'zod';
import { isDateString } from '../utils/dates';
import { PATIENT_STATUSES, PAY_METHODS } from '../utils/enums';

export const dateString = z.string().refine(isDateString, 'Expected a valid YYYY-MM-DD date');

export function intInRange(min: number, max: number) {
  return z.coerce.number().int().min(min).max(max);
}

const blankOrNullToNull = (value: unknown) =>
  value === '' || value === null || value === undefined ? null : value;

export function optionalScaledInt(min: number, max: number) {
  return z
    .preprocess(blankOrNullToNull, z.coerce.number().int().min(min).max(max).nullable())
    .optional();
}

export function optionalMoney(max: number) {
  return z.coerce.number().min(0).max(max).optional();
}

export const patientStatusSchema = z.enum(PATIENT_STATUSES);
export const payMethodSchema = z.enum(PAY_METHODS);
