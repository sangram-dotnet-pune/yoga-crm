import { z } from 'zod';
import { dateString } from './common';
import { XRAY_KINDS } from '../utils/enums';

export const xrayKindSchema = z.enum(XRAY_KINDS);

export const createXraySchema = z.object({
  date: dateString,
  kind: xrayKindSchema.default('Record'),
  bodyArea: z.string().trim().optional(),
  title: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const updateXraySchema = z.object({
  date: dateString.optional(),
  bodyArea: z.string().trim().nullable().optional(),
  title: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export type CreateXrayInput = z.infer<typeof createXraySchema>;
export type UpdateXrayInput = z.infer<typeof updateXraySchema>;
