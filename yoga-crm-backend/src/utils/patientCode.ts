import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';

const MIN_ID = 1001;
const MAX_ID = 9998;

export async function generatePatientCode(clinicId: string): Promise<string> {
  const span = MAX_ID - MIN_ID + 1;

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidate = `YC-${MIN_ID + Math.floor(Math.random() * span)}`;
    const existing = await prisma.patient.findUnique({
      where: { clinicId_patientCode: { clinicId, patientCode: candidate } },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  for (let number = MIN_ID; number <= MAX_ID; number += 1) {
    const candidate = `YC-${number}`;
    const existing = await prisma.patient.findUnique({
      where: { clinicId_patientCode: { clinicId, patientCode: candidate } },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  throw new HttpError(409, 'Unable to allocate a patient id', 'ID_EXHAUSTED');
}
