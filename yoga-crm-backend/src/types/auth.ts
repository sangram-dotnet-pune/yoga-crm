export type AuthUser = {
  id: string;
  clinicId: string;
  role: string;
  email: string;
  name: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
