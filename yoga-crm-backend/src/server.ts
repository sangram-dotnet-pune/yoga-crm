import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`YogaCare API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down.`);
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
