import type { RequestHandler } from 'express';
import { createVisit, deleteVisit, listVisits, updateVisit } from '../services/visit.service';
import { clinicIdOf, paramOf } from '../utils/context';

export const listVisitsHandler: RequestHandler = async (req, res) => {
  res.json(await listVisits(clinicIdOf(req), paramOf(req, 'patientId')));
};

export const createVisitHandler: RequestHandler = async (req, res) => {
  const visit = await createVisit(clinicIdOf(req), paramOf(req, 'patientId'), req.body);
  res.status(201).json(visit);
};

export const updateVisitHandler: RequestHandler = async (req, res) => {
  res.json(await updateVisit(clinicIdOf(req), paramOf(req, 'id'), req.body));
};

export const deleteVisitHandler: RequestHandler = async (req, res) => {
  await deleteVisit(clinicIdOf(req), paramOf(req, 'id'));
  res.status(204).end();
};
