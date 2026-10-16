import 'dotenv/config';

process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL) {
  throw new Error('Integration tests require DATABASE_URL (load it from .env).');
}
