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
