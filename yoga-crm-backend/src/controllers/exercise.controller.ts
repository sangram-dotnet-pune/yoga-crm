import type { RequestHandler } from 'express';
import { listExercises, replaceExercises } from '../services/exercise.service';
import { clinicIdOf, paramOf } from '../utils/context';

export const listExercisesHandler: RequestHandler = async (req, res) => {
  res.json(await listExercises(clinicIdOf(req), paramOf(req, 'patientId')));
};

export const replaceExercisesHandler: RequestHandler = async (req, res) => {
  res.json(await replaceExercises(clinicIdOf(req), paramOf(req, 'patientId'), req.body));
};
