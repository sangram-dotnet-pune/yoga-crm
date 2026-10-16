import type { RequestHandler } from 'express';
import { getOutcomes } from '../services/analytics.service';
import { clinicIdOf } from '../utils/context';
import { outcomesQuerySchema } from '../validation/outcomes.schema';

export const getOutcomesHandler: RequestHandler = async (req, res) => {
  const { range } = outcomesQuerySchema.parse(req.query);
  res.json(await getOutcomes(clinicIdOf(req), range));
};
