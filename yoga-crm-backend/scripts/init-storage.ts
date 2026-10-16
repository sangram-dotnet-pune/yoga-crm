import 'dotenv/config';
import { ensureStorageBucket, isStorageConfigured, storageBucket } from '../src/config/storage';

async function main() {
  if (!isStorageConfigured()) {
    console.error('Supabase storage is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY).');
    process.exit(1);
  }
  await ensureStorageBucket();
  console.log(`Storage bucket "${storageBucket}" is ready.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
