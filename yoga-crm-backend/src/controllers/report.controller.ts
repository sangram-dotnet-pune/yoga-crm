import type { RequestHandler } from 'express';
import { buildPatientReport, collectReportData } from '../services/report.service';
import { clinicIdOf, paramOf } from '../utils/context';

export const getPatientReportHandler: RequestHandler = async (req, res) => {
  const { data, filename } = await collectReportData(clinicIdOf(req), paramOf(req, 'id'));
  const pdf = await buildPatientReport(data);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', String(pdf.length));
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).end(pdf);
};
