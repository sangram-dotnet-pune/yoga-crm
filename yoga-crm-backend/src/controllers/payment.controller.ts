import type { RequestHandler } from 'express';
import {
  createPayment,
  deletePayment,
  listPayments,
  reconcilePaid,
  updatePayment,
} from '../services/payment.service';
import { clinicIdOf, paramOf } from '../utils/context';

export const listPaymentsHandler: RequestHandler = async (req, res) => {
  res.json(await listPayments(clinicIdOf(req), paramOf(req, 'patientId')));
};

export const createPaymentHandler: RequestHandler = async (req, res) => {
  const result = await createPayment(clinicIdOf(req), paramOf(req, 'patientId'), req.body);
  res.status(201).json(result);
};

export const updatePaymentHandler: RequestHandler = async (req, res) => {
  res.json(await updatePayment(clinicIdOf(req), paramOf(req, 'id'), req.body));
};

export const deletePaymentHandler: RequestHandler = async (req, res) => {
  res.json(await deletePayment(clinicIdOf(req), paramOf(req, 'id')));
};

export const reconcilePaymentsHandler: RequestHandler = async (req, res) => {
  res.json(await reconcilePaid(clinicIdOf(req), paramOf(req, 'patientId')));
};
