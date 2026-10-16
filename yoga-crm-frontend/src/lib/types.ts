export type PatientStatus = "Active" | "Completed" | "Follow-up";
export type PaymentStatus = "Pending" | "Partially paid" | "Done";
export type PayMethod = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Other";

export const PATIENT_STATUSES: PatientStatus[] = ["Active", "Completed", "Follow-up"];
export const PAY_METHODS: PayMethod[] = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];

export type Patient = {
  id: string;
  patientCode: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  visitDate: string;
  condition: string;
  painBefore: number;
  painAfter: number | null;
  mobilityBefore: string;
  mobilityAfter: string | null;
  notes: string;
  diagnosis: string;
  doctor: string;
  planMonths: number;
  followUpDate: string;
  status: PatientStatus;
  fee: number;
  paid: number;
  balance: number;
  credit: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

export type Visit = {
  id: string;
  patientId: string;
  date: string;
  visitType: string;
  painScore: number | null;
  mobility: number | null;
  treatment: string | null;
  exercises: string | null;
  notes: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  patientId: string;
  amount: number;
  date: string;
  paymentMethod: PayMethod;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

export type Exercise = {
  id: string;
  name: string;
  frequency: string;
  duration: string;
  notes: string;
  sortOrder: number;
};

export type PlanLog = {
  id: string;
  date: string;
  months: number;
};

export type XrayKind = "Before" | "After" | "Record";
export const XRAY_KINDS: XrayKind[] = ["Before", "After", "Record"];

export type Xray = {
  id: string;
  patientId: string;
  kind: XrayKind;
  date: string;
  bodyArea: string | null;
  title: string | null;
  notes: string | null;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

export type XrayInput = {
  date: string;
  kind: XrayKind;
  bodyArea?: string;
  title?: string;
  notes?: string;
};

export type XrayMetadataInput = {
  date?: string;
  bodyArea?: string | null;
  title?: string | null;
  notes?: string | null;
};

export type PatientDetail = Patient & {
  visits: Visit[];
  payments: Payment[];
  exercises: Exercise[];
  planLog: PlanLog[];
};

export type PatientList = {
  items: Patient[];
  total: number;
  page: number;
  pageSize: number;
};

export type PatientInput = {
  name: string;
  condition: string;
  age?: number;
  gender?: string;
  phone?: string;
  visitDate?: string;
  painBefore?: number;
  painAfter?: number | null;
  mobilityBefore?: string;
  mobilityAfter?: string | null;
  notes?: string;
  diagnosis?: string;
  doctor?: string;
  planMonths?: number;
  followUpDate?: string;
  status?: PatientStatus;
  fee?: number;
  paid?: number;
};

export type VisitInput = {
  date: string;
  visitType: string;
  painScore?: number | null;
  mobility?: number | null;
  treatment?: string | null;
  exercises?: string | null;
  notes?: string | null;
};

export type PaymentInput = {
  amount: number;
  date: string;
  paymentMethod: PayMethod;
  reference?: string | null;
  notes?: string | null;
};

export type ExerciseInput = {
  name: string;
  frequency?: string;
  duration?: string;
  notes?: string;
};

export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled" | "No Show";
export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "Scheduled",
  "Completed",
  "Cancelled",
  "No Show",
];

export const APPOINTMENT_TYPES: string[] = [
  "Initial assessment",
  "Follow-up",
  "Rehabilitation",
  "Therapy session",
  "Consultation",
];

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentInput = {
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status?: AppointmentStatus;
  notes?: string | null;
};

export type ExpenseCategory =
  | "Equipment"
  | "Supplies"
  | "Rent"
  | "Utilities"
  | "Marketing"
  | "Staff"
  | "Maintenance"
  | "Other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Equipment",
  "Supplies",
  "Rent",
  "Utilities",
  "Marketing",
  "Staff",
  "Maintenance",
  "Other",
];

export type Expense = {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PayMethod;
  patientId: string | null;
  patientName: string | null;
  notes: string | null;
  createdAt: string;
};

export type ExpenseInput = {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PayMethod;
  patientId?: string | null;
  notes?: string | null;
};

export type OutcomeRange = "day" | "week" | "month" | "quarter" | "year";

export const OUTCOME_RANGES: OutcomeRange[] = ["day", "week", "month", "quarter", "year"];

export type Outcomes = {
  range: OutcomeRange;
  from: string;
  to: string;
  kpis: {
    collected: number;
    newPatients: number;
    followUps: number;
    avgPainReduction: number;
  };
  revenue: { label: string; value: number }[];
  demand: { label: string; newPatients: number; followUps: number }[];
  progress: {
    painImproved: number;
    mobilityImproved: number;
    activePlans: number;
    totalPatients: number;
  };
};
