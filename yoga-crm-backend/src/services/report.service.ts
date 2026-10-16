import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';
import { formatDate } from '../utils/dates';
import { payMethodToApi, patientStatusToApi, xrayKindToApi } from '../utils/enums';
import { toAmount } from '../utils/money';
import { downloadStorageObject } from './media.service';

export const REPORT_DISCLAIMER =
  'This report summarizes recorded clinical information and patient-reported/clinician-entered ' +
  'outcomes. It is not an automated radiological diagnosis.';

const FONT_DIR = join(__dirname, '..', '..', 'assets', 'fonts');
const FONT_REGULAR = readFileSync(join(FONT_DIR, 'NotoSans-Regular.ttf'));
const FONT_BOLD = readFileSync(join(FONT_DIR, 'NotoSans-Bold.ttf'));

const MX = 45;
const CONTENT_W = 505;
const HEADER_Y = 30;
const BOTTOM = 782;
const FOOTER_Y = 806;

const C = {
  ink: '#142033',
  muted: '#8490a1',
  border: '#e4eaf1',
  tint: '#eaf2ff',
  primary: '#1d63be',
  green: '#198754',
  amber: '#9a6400',
  amberTint: '#fff7e6',
  zebra: '#f6f9fc',
};

export type ReportPatient = {
  patientCode: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  visitDate: string;
  condition: string;
  diagnosis: string;
  doctor: string;
  painBefore: number;
  painAfter: number | null;
  mobilityBefore: string;
  mobilityAfter: string | null;
  planMonths: number;
  followUpDate: string;
  status: string;
  fee: number;
  paid: number;
  balance: number;
  credit: number;
  paymentStatus: string;
  notes: string;
};

export type ReportVisit = {
  date: string;
  visitType: string;
  painScore: number | null;
  mobility: number | null;
  treatment: string | null;
  exercises: string | null;
  notes: string | null;
};

export type ReportPayment = {
  date: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  amount: number;
};

export type ReportExercise = {
  name: string;
  frequency: string;
  duration: string;
  notes: string;
};

export type ReportXray = {
  kind: string;
  date: string;
  bodyArea: string | null;
  title: string | null;
  notes: string | null;
  mimeType: string;
  data: Buffer | null;
};

export type ReportData = {
  clinicName: string;
  doctorName: string;
  generatedAt: string;
  patient: ReportPatient;
  visits: ReportVisit[];
  payments: ReportPayment[];
  exercises: ReportExercise[];
  xrays: ReportXray[];
};

type Ctx = { clinicName: string; patientCode: string; name: string };

function truncate(value: string, max: number): string {
  const text = value ?? '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatMoney(value: number): string {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

// pdfkit finalises a document very slowly (~20s) if doc.image() throws on undecodable bytes,
// so probe each image in a throwaway document and only embed bytes that decode cleanly.
function canEmbedImage(buffer: Buffer, mimeType: string): boolean {
  if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') return false;
  if (buffer.length < 12) return false;
  const probe = new PDFDocument({ autoFirstPage: false }) as PDFKit.PDFDocument & {
    openImage: (src: Buffer) => unknown;
  };
  try {
    probe.openImage(buffer);
    return true;
  } catch {
    return false;
  }
}

function drawHeader(doc: PDFKit.PDFDocument, ctx: Ctx): void {
  doc.font('bold').fontSize(10).fillColor(C.ink);
  doc.text(truncate(ctx.clinicName, 40), MX, HEADER_Y, { width: CONTENT_W / 2, lineBreak: false });
  doc.font('body').fontSize(8).fillColor(C.muted);
  doc.text(`Patient report · ${ctx.patientCode}`, MX, HEADER_Y + 2, {
    width: CONTENT_W,
    align: 'right',
    lineBreak: false,
  });
  doc.moveTo(MX, HEADER_Y + 16).lineTo(MX + CONTENT_W, HEADER_Y + 16).lineWidth(0.5).strokeColor(C.border).stroke();
  doc.x = MX;
  doc.y = HEADER_Y + 26;
}

function newPage(doc: PDFKit.PDFDocument, ctx: Ctx): void {
  doc.addPage();
  drawHeader(doc, ctx);
}

function ensure(doc: PDFKit.PDFDocument, ctx: Ctx, height: number): void {
  if (doc.y + height > BOTTOM) newPage(doc, ctx);
}

function sectionTitle(doc: PDFKit.PDFDocument, ctx: Ctx, num: string, title: string): void {
  ensure(doc, ctx, 44);
  const y = doc.y;
  doc.font('bold').fontSize(11).fillColor(C.primary).text(num, MX, y, { width: 24, lineBreak: false });
  doc.fillColor(C.ink).text(title, MX + 26, y, { width: CONTENT_W - 26, lineBreak: false });
  doc.moveTo(MX, y + 16).lineTo(MX + CONTENT_W, y + 16).lineWidth(0.8).strokeColor(C.border).stroke();
  doc.x = MX;
  doc.y = y + 26;
}

function paragraph(
  doc: PDFKit.PDFDocument,
  ctx: Ctx,
  text: string,
  options: { color?: string; size?: number; bold?: boolean; indent?: number } = {},
): void {
  const indent = options.indent ?? 0;
  doc.font(options.bold ? 'bold' : 'body').fontSize(options.size ?? 9).fillColor(options.color ?? C.ink);
  const height = doc.heightOfString(text || ' ', { width: CONTENT_W - indent });
  ensure(doc, ctx, height + 4);
  doc.text(text, MX + indent, doc.y, { width: CONTENT_W - indent });
  doc.x = MX;
}

function grid(doc: PDFKit.PDFDocument, ctx: Ctx, rows: [string, string][]): void {
  const cols = 3;
  const colW = CONTENT_W / cols;
  const rowsCount = Math.ceil(rows.length / cols);
  ensure(doc, ctx, rowsCount * 24 + 6);
  const startY = doc.y;
  rows.forEach((row, index) => {
    const col = index % cols;
    const line = Math.floor(index / cols);
    const x = MX + col * colW;
    const y = startY + line * 24;
    doc.font('body').fontSize(7.5).fillColor(C.muted).text(row[0].toUpperCase(), x, y, {
      width: colW - 10,
      lineBreak: false,
    });
    doc.font('bold').fontSize(9.5).fillColor(C.ink).text(truncate(row[1], 34), x, y + 10, {
      width: colW - 10,
      lineBreak: false,
    });
  });
  doc.x = MX;
  doc.y = startY + rowsCount * 24 + 4;
}

function kpiCards(
  doc: PDFKit.PDFDocument,
  ctx: Ctx,
  cards: { label: string; value: string; sub?: string }[],
): void {
  const gap = 10;
  const cardW = (CONTENT_W - gap * (cards.length - 1)) / cards.length;
  const height = 56;
  ensure(doc, ctx, height + 10);
  const y = doc.y;
  cards.forEach((card, index) => {
    const x = MX + index * (cardW + gap);
    doc.roundedRect(x, y, cardW, height, 6).fillAndStroke(C.tint, C.border);
    doc.font('body').fontSize(7.5).fillColor(C.muted).text(card.label.toUpperCase(), x + 10, y + 9, {
      width: cardW - 20,
      lineBreak: false,
    });
    doc.font('bold').fontSize(12).fillColor(C.ink).text(truncate(card.value, 18), x + 10, y + 22, {
      width: cardW - 20,
      lineBreak: false,
    });
    if (card.sub) {
      doc.font('body').fontSize(7.5).fillColor(C.muted).text(truncate(card.sub, 24), x + 10, y + 40, {
        width: cardW - 20,
        lineBreak: false,
      });
    }
  });
  doc.x = MX;
  doc.y = y + height + 8;
}

type Column = { label: string; width: number; align?: 'left' | 'right' | 'center' };

function tableHeader(doc: PDFKit.PDFDocument, ctx: Ctx, columns: Column[]): void {
  const height = 18;
  ensure(doc, ctx, height + 16);
  const y = doc.y;
  doc.rect(MX, y, CONTENT_W, height).fill(C.tint);
  let x = MX;
  columns.forEach((column) => {
    doc.font('bold').fontSize(7.5).fillColor(C.primary).text(column.label.toUpperCase(), x + 6, y + 6, {
      width: column.width - 12,
      align: column.align ?? 'left',
      lineBreak: false,
    });
    x += column.width;
  });
  doc.x = MX;
  doc.y = y + height + 1;
}

function tableRow(
  doc: PDFKit.PDFDocument,
  ctx: Ctx,
  columns: Column[],
  cells: string[],
  zebra: boolean,
): void {
  const height = 16;
  ensure(doc, ctx, height);
  const y = doc.y;
  if (zebra) doc.rect(MX, y, CONTENT_W, height).fill(C.zebra);
  let x = MX;
  columns.forEach((column, index) => {
    doc.font('body').fontSize(8.5).fillColor(C.ink).text(cells[index] ?? '', x + 6, y + 4, {
      width: column.width - 12,
      align: column.align ?? 'left',
      lineBreak: false,
    });
    x += column.width;
  });
  doc.x = MX;
  doc.y = y + height;
}

type Point = { label: string; value: number };

function drawLineChart(
  doc: PDFKit.PDFDocument,
  ctx: Ctx,
  title: string,
  max: number,
  points: Point[],
): void {
  const height = 130;
  ensure(doc, ctx, height + 26);
  const y0 = doc.y;
  doc.font('bold').fontSize(8.5).fillColor(C.muted).text(title.toUpperCase(), MX, y0, { lineBreak: false });
  const chartY = y0 + 12;
  doc.roundedRect(MX, chartY, CONTENT_W, height, 6).fillAndStroke('#ffffff', C.border);
  const pad = 18;
  const plotX = MX + pad;
  const plotY = chartY + pad;
  const plotW = CONTENT_W - pad * 2;
  const plotH = height - pad * 2;

  for (let index = 0; index <= 4; index += 1) {
    const gy = plotY + (plotH * index) / 4;
    doc.moveTo(plotX, gy).lineTo(plotX + plotW, gy).lineWidth(0.4).strokeColor(C.border).stroke();
  }

  if (points.length > 0) {
    const coords = points.map((point, index) => {
      const px =
        points.length === 1 ? plotX + plotW / 2 : plotX + (plotW * index) / (points.length - 1);
      const ratio = Math.max(0, Math.min(1, point.value / max));
      const py = plotY + plotH * (1 - ratio);
      return { x: px, y: py, label: point.label };
    });

    doc.lineWidth(1.5).strokeColor(C.primary);
    coords.forEach((coord, index) => {
      if (index === 0) doc.moveTo(coord.x, coord.y);
      else doc.lineTo(coord.x, coord.y);
    });
    doc.stroke();

    coords.forEach((coord) => {
      doc.circle(coord.x, coord.y, 2.2).fill(C.primary);
    });

    doc.font('body').fontSize(7).fillColor(C.muted);
    doc.text(coords[0].label, plotX, chartY + height - 12, { width: plotW / 2, lineBreak: false });
    doc.text(coords[coords.length - 1].label, plotX + plotW / 2, chartY + height - 12, {
      width: plotW / 2,
      align: 'right',
      lineBreak: false,
    });
  } else {
    doc.font('body').fontSize(8.5).fillColor(C.muted).text('No scored records', MX, chartY + height / 2, {
      width: CONTENT_W,
      align: 'center',
      lineBreak: false,
    });
  }

  doc.x = MX;
  doc.y = chartY + height + 8;
}

function drawImageTile(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  xray: ReportXray,
): void {
  doc.roundedRect(x, y, width, height, 6).fillAndStroke('#ffffff', C.border);
  const embeddable = xray.data ? canEmbedImage(xray.data, xray.mimeType) : false;
  if (embeddable && xray.data) {
    try {
      doc.image(xray.data, x + 6, y + 6, { fit: [width - 12, height - 12], align: 'center', valign: 'center' });
    } catch {
      doc.font('body').fontSize(8).fillColor(C.muted).text('Image not embeddable', x, y + height / 2 - 5, {
        width,
        align: 'center',
        lineBreak: false,
      });
    }
  } else {
    doc.font('body').fontSize(8).fillColor(C.muted).text('Image unavailable', x, y + height / 2 - 5, {
      width,
      align: 'center',
      lineBreak: false,
    });
  }
}

function render(doc: PDFKit.PDFDocument, ctx: Ctx, data: ReportData): void {
  const { patient } = data;
  drawHeader(doc, ctx);

  doc.font('bold').fontSize(18).fillColor(C.ink).text('Outcome report', MX, doc.y, { lineBreak: false });
  doc.font('body').fontSize(9).fillColor(C.muted).text(
    `${patient.name} · ${patient.condition} · generated ${data.generatedAt}`,
    MX,
    doc.y + 2,
    { width: CONTENT_W, lineBreak: false },
  );
  doc.x = MX;
  doc.y += 20;

  sectionTitle(doc, ctx, '01', 'Patient information');
  grid(doc, ctx, [
    ['Code', patient.patientCode],
    ['Name', patient.name],
    ['Age', String(patient.age)],
    ['Gender', patient.gender || '—'],
    ['Phone', patient.phone || '—'],
    ['Visit date', patient.visitDate],
    ['Condition', patient.condition],
    ['Diagnosis', patient.diagnosis || '—'],
    ['Doctor', patient.doctor || data.doctorName || '—'],
    ['Status', patient.status],
    ['Plan', `${patient.planMonths} months`],
    ['Follow-up', patient.followUpDate],
  ]);

  sectionTitle(doc, ctx, '02', 'Clinical overview');
  kpiCards(doc, ctx, [
    {
      label: 'Pain (before → after)',
      value: `${patient.painBefore} → ${display(patient.painAfter)}`,
      sub: 'scale 0–10',
    },
    {
      label: 'Mobility',
      value: `${patient.mobilityBefore} → ${display(patient.mobilityAfter)}`,
      sub: 'recorded values',
    },
    { label: 'Plan duration', value: `${patient.planMonths} months`, sub: `status ${patient.status}` },
  ]);
  if (patient.notes) paragraph(doc, ctx, `Notes: ${patient.notes}`, { color: C.muted, size: 8.5 });
  if (data.patient.diagnosis && data.patient.condition) {
    paragraph(doc, ctx, `Clinical summary: ${patient.condition}. ${patient.diagnosis}`, { size: 8.5 });
  }

  sectionTitle(doc, ctx, '03', 'Visit history');
  if (data.visits.length === 0) {
    paragraph(doc, ctx, 'No visits recorded.', { color: C.muted });
  } else {
    const columns: Column[] = [
      { label: 'Date', width: 92 },
      { label: 'Type', width: 128 },
      { label: 'Pain', width: 52, align: 'right' },
      { label: 'Mobility', width: 62, align: 'right' },
      { label: 'Treatment', width: CONTENT_W - 92 - 128 - 52 - 62 },
    ];
    tableHeader(doc, ctx, columns);
    data.visits.forEach((visit, index) => {
      tableRow(
        doc,
        ctx,
        columns,
        [
          visit.date,
          truncate(visit.visitType, 22),
          visit.painScore === null ? '—' : String(visit.painScore),
          visit.mobility === null ? '—' : String(visit.mobility),
          truncate(visit.treatment ?? '—', 46),
        ],
        index % 2 === 1,
      );
    });
  }

  sectionTitle(doc, ctx, '04', 'Progress');
  const painPoints: Point[] = data.visits
    .filter((visit) => visit.painScore !== null)
    .map((visit) => ({ label: visit.date, value: visit.painScore as number }));
  const mobilityPoints: Point[] = data.visits
    .filter((visit) => visit.mobility !== null)
    .map((visit) => ({ label: visit.date, value: visit.mobility as number }));
  drawLineChart(doc, ctx, 'Pain score trend (0–10)', 10, painPoints);
  drawLineChart(doc, ctx, 'Mobility trend (0–100)', 100, mobilityPoints);
  paragraph(doc, ctx, 'Charts describe recorded scores only and are not a diagnosis.', {
    color: C.muted,
    size: 7.5,
  });

  sectionTitle(doc, ctx, '05', 'Exercise & home plan');
  if (data.exercises.length === 0) {
    paragraph(doc, ctx, 'No exercises prescribed.', { color: C.muted });
  } else {
    const columns: Column[] = [
      { label: 'Exercise', width: 190 },
      { label: 'Frequency', width: 110 },
      { label: 'Duration', width: CONTENT_W - 190 - 110 },
    ];
    tableHeader(doc, ctx, columns);
    data.exercises.forEach((exercise, index) => {
      tableRow(
        doc,
        ctx,
        columns,
        [
          truncate(exercise.name, 34),
          truncate(exercise.frequency || '—', 18),
          truncate(exercise.duration || '—', 24),
        ],
        index % 2 === 1,
      );
    });
  }

  sectionTitle(doc, ctx, '06', 'X-ray records');
  if (data.xrays.length === 0) {
    paragraph(doc, ctx, 'No X-ray images recorded.', { color: C.muted });
  } else {
    const tileW = (CONTENT_W - 12) / 2;
    const tileH = 150;
    const captionH = 32;
    for (let index = 0; index < data.xrays.length; index += 2) {
      const pair = data.xrays.slice(index, index + 2);
      ensure(doc, ctx, tileH + captionH);
      const y = doc.y;
      pair.forEach((xray, pairIndex) => {
        const x = MX + pairIndex * (tileW + 12);
        drawImageTile(doc, x, y, tileW, tileH, xray);
        doc.font('body').fontSize(7.5).fillColor(C.muted);
        doc.text(`${xray.kind} · ${xray.date}`, x, y + tileH + 3, {
          width: tileW,
          align: 'center',
          lineBreak: false,
        });
        doc.text(
          truncate(
            [xray.title, xray.bodyArea, xray.notes].filter(Boolean).join(' · ') || 'No details',
            Math.floor(tileW / 4.2),
          ),
          x,
          y + tileH + 14,
          { width: tileW, align: 'center', lineBreak: false },
        );
      });
      doc.x = MX;
      doc.y = y + tileH + captionH;
    }
  }

  if (data.patient.fee > 0 || data.payments.length > 0) {
    sectionTitle(doc, ctx, '07', 'Payment summary');
    kpiCards(doc, ctx, [
      { label: 'Fee', value: formatMoney(patient.fee) },
      { label: 'Paid', value: formatMoney(patient.paid) },
      {
        label: patient.credit > 0 ? 'Credit' : 'Balance',
        value: formatMoney(patient.credit > 0 ? patient.credit : patient.balance),
        sub: patient.paymentStatus,
      },
    ]);
    if (data.payments.length > 0) {
      const columns: Column[] = [
        { label: 'Date', width: 100 },
        { label: 'Method', width: 140 },
        { label: 'Reference', width: CONTENT_W - 100 - 140 - 90 },
        { label: 'Amount', width: 90, align: 'right' },
      ];
      tableHeader(doc, ctx, columns);
      data.payments.forEach((payment, index) => {
        tableRow(
          doc,
          ctx,
          columns,
          [
            payment.date,
            payment.paymentMethod,
            truncate(payment.reference ?? '—', 30),
            formatMoney(payment.amount),
          ],
          index % 2 === 1,
        );
      });
    }
  }

  ensure(doc, ctx, 60);
  doc.moveDown(0.5);
  const noteY = doc.y;
  const disclaimerHeight = doc.heightOfString(REPORT_DISCLAIMER, { width: CONTENT_W - 20 }) + 24;
  doc.roundedRect(MX, noteY, CONTENT_W, disclaimerHeight, 6).fillAndStroke(C.amberTint, C.border);
  doc.font('body').fontSize(8).fillColor(C.amber).text('DISCLAIMER', MX + 10, noteY + 8, { lineBreak: false });
  doc.fillColor(C.ink).text(REPORT_DISCLAIMER, MX + 10, noteY + 20, { width: CONTENT_W - 20 });
  doc.x = MX;
  doc.y = noteY + disclaimerHeight + 8;
}

function drawFooters(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let index = 0; index < total; index += 1) {
    doc.switchToPage(range.start + index);
    doc.moveTo(MX, FOOTER_Y - 8).lineTo(MX + CONTENT_W, FOOTER_Y - 8).lineWidth(0.5).strokeColor(C.border).stroke();
    doc.font('body').fontSize(7.5).fillColor(C.muted);
    doc.text('YogaCare CRM · Outcome report', MX, FOOTER_Y, { width: CONTENT_W / 2, lineBreak: false });
    doc.text(`Page ${index + 1} of ${total}`, MX + CONTENT_W / 2, FOOTER_Y, {
      width: CONTENT_W / 2,
      align: 'right',
      lineBreak: false,
    });
  }
}

export async function buildPatientReport(data: ReportData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: MX, bottom: 60, left: MX, right: MX }, bufferPages: true, compress: true });
  doc.registerFont('body', FONT_REGULAR);
  doc.registerFont('bold', FONT_BOLD);

  const ctx: Ctx = {
    clinicName: data.clinicName,
    patientCode: data.patient.patientCode,
    name: data.patient.name,
  };

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  render(doc, ctx, data);
  drawFooters(doc);
  doc.end();

  return done;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'patient';
}

export async function collectReportData(
  clinicId: string,
  patientId: string,
): Promise<{ data: ReportData; filename: string }> {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: {
      visits: { orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] },
      payments: { orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] },
      exercises: { orderBy: { sortOrder: 'asc' } },
      xrays: { include: { media: true }, orderBy: [{ createdAt: 'asc' }] },
    },
  });
  if (!patient) {
    throw new HttpError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true, doctorName: true },
  });

  const xrays: ReportXray[] = await Promise.all(
    patient.xrays.map(async (xray) => {
      const embeddable = xray.media.mimeType === 'image/jpeg' || xray.media.mimeType === 'image/png';
      const data = embeddable ? await downloadStorageObject(xray.media.storageKey) : null;
      return {
        kind: xrayKindToApi(xray.kind),
        date: formatDate(xray.date),
        bodyArea: xray.bodyArea,
        title: xray.title,
        notes: xray.notes,
        mimeType: xray.media.mimeType,
        data,
      };
    }),
  );

  const fee = toAmount(patient.fee);
  const paid = toAmount(patient.paid);

  const data: ReportData = {
    clinicName: clinic?.name ?? 'YogaCare Clinic',
    doctorName: clinic?.doctorName ?? '',
    generatedAt: formatDate(new Date()),
    patient: {
      patientCode: patient.patientCode,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      visitDate: formatDate(patient.visitDate),
      condition: patient.condition,
      diagnosis: patient.diagnosis,
      doctor: patient.doctor,
      painBefore: patient.painBefore,
      painAfter: patient.painAfter,
      mobilityBefore: patient.mobilityBefore,
      mobilityAfter: patient.mobilityAfter,
      planMonths: patient.planMonths,
      followUpDate: formatDate(patient.followUpDate),
      status: patientStatusToApi(patient.status),
      fee,
      paid,
      balance: Math.max(0, fee - paid),
      credit: Math.max(0, paid - fee),
      paymentStatus:
        fee <= 0 || paid <= 0 ? 'Pending' : paid >= fee ? 'Done' : 'Partially paid',
      notes: patient.notes,
    },
    visits: patient.visits.map((visit) => ({
      date: formatDate(visit.date),
      visitType: visit.visitType,
      painScore: visit.painScore,
      mobility: visit.mobility,
      treatment: visit.treatment,
      exercises: visit.exercises,
      notes: visit.notes,
    })),
    payments: patient.payments.map((payment) => ({
      date: formatDate(payment.date),
      paymentMethod: payMethodToApi(payment.paymentMethod),
      reference: payment.reference,
      notes: payment.notes,
      amount: toAmount(payment.amount),
    })),
    exercises: patient.exercises.map((exercise) => ({
      name: exercise.name,
      frequency: exercise.frequency,
      duration: exercise.duration,
      notes: exercise.notes,
    })),
    xrays,
  };

  const filename = `${patient.patientCode}-${slug(patient.name)}-report.pdf`;
  return { data, filename };
}
