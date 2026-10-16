import type { RequestHandler } from 'express';
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  updateAppointment,
} from '../services/appointment.service';
import { clinicIdOf, paramOf } from '../utils/context';
import { listAppointmentsQuerySchema } from '../validation/appointment.schema';

export const listAppointmentsHandler: RequestHandler = async (req, res) => {
  const query = listAppointmentsQuerySchema.parse(req.query);
  res.json(await listAppointments(clinicIdOf(req), query));
};

export const createAppointmentHandler: RequestHandler = async (req, res) => {
  res.status(201).json(await createAppointment(clinicIdOf(req), req.body));
};

export const updateAppointmentHandler: RequestHandler = async (req, res) => {
  res.json(await updateAppointment(clinicIdOf(req), paramOf(req, 'id'), req.body));
};

export const deleteAppointmentHandler: RequestHandler = async (req, res) => {
  await deleteAppointment(clinicIdOf(req), paramOf(req, 'id'));
  res.status(204).end();
};
