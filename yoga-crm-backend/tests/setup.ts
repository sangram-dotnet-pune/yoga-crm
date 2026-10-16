process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://user:pass@localhost:5432/yogacare_test?schema=public';
process.env.DIRECT_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-0123456789abcdef0123456789';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-0123456789abcdef0123456789';
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? 'false';
