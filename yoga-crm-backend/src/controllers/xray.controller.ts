import type { RequestHandler } from 'express';
import { createXray, deleteXray, listXrays, updateXray } from '../services/xray.service';
import { clinicIdOf, paramOf } from '../utils/context';

export const listXraysHandler: RequestHandler = async (req, res) => {
  res.json(await listXrays(clinicIdOf(req), paramOf(req, 'patientId')));
};

export const createXrayHandler: RequestHandler = async (req, res) => {
  const xray = await createXray(clinicIdOf(req), paramOf(req, 'patientId'), req.file, req.body);
  res.status(201).json(xray);
};

export const updateXrayHandler: RequestHandler = async (req, res) => {
  res.json(await updateXray(clinicIdOf(req), paramOf(req, 'id'), req.body));
};

export const deleteXrayHandler: RequestHandler = async (req, res) => {
  await deleteXray(clinicIdOf(req), paramOf(req, 'id'));
  res.status(204).end();
};
