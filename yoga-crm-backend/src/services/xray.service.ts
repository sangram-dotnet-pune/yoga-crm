import type { MediaAsset, Prisma, XrayImage } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';
import { formatDate, toDate } from '../utils/dates';
import { xrayKindToApi, xrayKindToDb } from '../utils/enums';
import type { XrayDTO } from '../utils/serializers';
import type { CreateXrayInput, UpdateXrayInput } from '../validation/xray.schema';
import {
  deleteMediaAsset,
  signStorageKey,
  uploadPatientImage,
  type UploadedImage,
} from './media.service';
import { findPatientOrThrow } from './patient.service';

type XrayWithMedia = XrayImage & { media: MediaAsset };

async function toDTO(xray: XrayWithMedia): Promise<XrayDTO> {
  return {
    id: xray.id,
    patientId: xray.patientId,
    kind: xrayKindToApi(xray.kind),
    date: formatDate(xray.date),
    bodyArea: xray.bodyArea,
    title: xray.title,
    notes: xray.notes,
    mimeType: xray.media.mimeType,
    sizeBytes: xray.media.sizeBytes,
    url: await signStorageKey(xray.media.storageKey),
    createdAt: xray.createdAt.toISOString(),
  };
}

async function findXrayForClinic(clinicId: string, xrayId: string): Promise<XrayWithMedia> {
  const xray = await prisma.xrayImage.findFirst({
    where: { id: xrayId, patient: { clinicId } },
    include: { media: true },
  });
  if (!xray) {
    throw new HttpError(404, 'X-ray not found', 'XRAY_NOT_FOUND');
  }
  return xray;
}

export async function listXrays(clinicId: string, patientId: string): Promise<XrayDTO[]> {
  await findPatientOrThrow(clinicId, patientId);
  const rows = await prisma.xrayImage.findMany({
    where: { patientId },
    include: { media: true },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return Promise.all(rows.map(toDTO));
}

export async function createXray(
  clinicId: string,
  patientId: string,
  file: UploadedImage | undefined,
  input: CreateXrayInput,
): Promise<XrayDTO> {
  await findPatientOrThrow(clinicId, patientId);
  const kind = xrayKindToDb(input.kind);

  if (kind === 'LEGACY_BEFORE' || kind === 'LEGACY_AFTER') {
    const existing = await prisma.xrayImage.findFirst({
      where: { patientId, kind },
      include: { media: true },
    });
    if (existing) {
      await deleteMediaAsset(existing.media);
    }
  }

  const media = await uploadPatientImage(clinicId, patientId, file);
  try {
    const xray = await prisma.xrayImage.create({
      data: {
        patientId,
        kind,
        date: toDate(input.date),
        bodyArea: input.bodyArea ?? null,
        title: input.title ?? null,
        notes: input.notes ?? null,
        mediaId: media.id,
      },
      include: { media: true },
    });
    return await toDTO(xray);
  } catch (error) {
    await deleteMediaAsset(media);
    throw error;
  }
}

export async function updateXray(
  clinicId: string,
  xrayId: string,
  input: UpdateXrayInput,
): Promise<XrayDTO> {
  await findXrayForClinic(clinicId, xrayId);

  const data: Prisma.XrayImageUpdateInput = {};
  if (input.date !== undefined) data.date = toDate(input.date);
  if (input.bodyArea !== undefined) data.bodyArea = input.bodyArea;
  if (input.title !== undefined) data.title = input.title;
  if (input.notes !== undefined) data.notes = input.notes;

  const updated = await prisma.xrayImage.update({
    where: { id: xrayId },
    data,
    include: { media: true },
  });
  return toDTO(updated);
}

export async function deleteXray(clinicId: string, xrayId: string): Promise<void> {
  const xray = await findXrayForClinic(clinicId, xrayId);
  await deleteMediaAsset(xray.media);
}
