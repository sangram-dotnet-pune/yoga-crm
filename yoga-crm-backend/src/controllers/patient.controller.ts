import type { RequestHandler } from 'express';
import {
  createPatient,
  deletePatient,
  getPatientDetail,
  listPatients,
  updatePatient,
} from '../services/patient.service';
import { clinicIdOf, paramOf } from '../utils/context';
import { listPatientsQuerySchema } from '../validation/patient.schema';

export const listPatientsHandler: RequestHandler = async (req, res) => {
  const query = listPatientsQuerySchema.parse(req.query);
  res.json(await listPatients(clinicIdOf(req), query));
};

export const getPatientHandler: RequestHandler = async (req, res) => {
  res.json(await getPatientDetail(clinicIdOf(req), paramOf(req, 'id')));
};

export const createPatientHandler: RequestHandler = async (req, res) => {
  res.status(201).json(await createPatient(clinicIdOf(req), req.body));
};

export const updatePatientHandler: RequestHandler = async (req, res) => {
  res.json(await updatePatient(clinicIdOf(req), paramOf(req, 'id'), req.body));
};

export const deletePatientHandler: RequestHandler = async (req, res) => {
  await deletePatient(clinicIdOf(req), paramOf(req, 'id'));
  res.status(204).end();
};
