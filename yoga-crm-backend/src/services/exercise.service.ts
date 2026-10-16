import { prisma } from '../config/prisma';
import { serializeExercise, type ExerciseDTO } from '../utils/serializers';
import type { ReplaceExercisesInput } from '../validation/exercise.schema';
import { findPatientOrThrow } from './patient.service';

export async function listExercises(
  clinicId: string,
  patientId: string,
): Promise<ExerciseDTO[]> {
  await findPatientOrThrow(clinicId, patientId);
  const exercises = await prisma.exercise.findMany({
    where: { patientId },
    orderBy: { sortOrder: 'asc' },
  });
  return exercises.map(serializeExercise);
}

export async function replaceExercises(
  clinicId: string,
  patientId: string,
  input: ReplaceExercisesInput,
): Promise<ExerciseDTO[]> {
  await findPatientOrThrow(clinicId, patientId);

  await prisma.$transaction([
    prisma.exercise.deleteMany({ where: { patientId } }),
    prisma.exercise.createMany({
      data: input.exercises.map((exercise, index) => ({
        patientId,
        name: exercise.name,
        frequency: exercise.frequency ?? '',
        duration: exercise.duration ?? '',
        notes: exercise.notes ?? '',
        sortOrder: index,
      })),
    }),
  ]);

  const exercises = await prisma.exercise.findMany({
    where: { patientId },
    orderBy: { sortOrder: 'asc' },
  });
  return exercises.map(serializeExercise);
}
