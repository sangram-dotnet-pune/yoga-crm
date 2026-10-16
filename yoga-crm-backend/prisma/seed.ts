import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_PASSWORD;

  if (!email || !password) {
    console.log('SEED_EMAIL and SEED_PASSWORD are required to create the clinician account.');
    return;
  }
  if (password.length < 8) {
    console.log('SEED_PASSWORD must be at least 8 characters.');
    process.exitCode = 1;
    return;
  }

  const existingUser = await prisma.user.findFirst();
  if (existingUser) {
    console.log('A user already exists; skipping seed.');
    return;
  }

  const clinicName = process.env.SEED_CLINIC_NAME ?? 'YogaCare Clinic';
  const doctorName = process.env.SEED_DOCTOR_NAME ?? 'Clinician';

  const clinic = await prisma.clinic.create({
    data: { name: clinicName, doctorName },
  });

  const user = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email,
      name: doctorName,
      passwordHash: await hashPassword(password),
      role: 'CLINICIAN',
    },
  });

  console.log(`Created clinic "${clinic.name}" and clinician ${user.email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
