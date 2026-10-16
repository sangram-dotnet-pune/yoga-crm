import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';
import { signAccessToken } from '../utils/jwt';
import { verifyPassword } from '../utils/password';
import { generateOpaqueToken, hashToken } from '../utils/tokens';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  clinicId: string;
  email: string;
  name: string;
  role: string;
};

type UserRecord = {
  id: string;
  clinicId: string;
  email: string;
  name: string;
  role: string;
};

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    clinicId: user.clinicId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function issueAccessToken(user: UserRecord): string {
  return signAccessToken({
    sub: user.id,
    clinicId: user.clinicId,
    role: user.role,
    email: user.email,
    name: user.name,
  });
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * MS_PER_DAY);
}

export type AuthSession = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export async function login(email: string, password: string): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const refreshToken = generateOpaqueToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiry(),
    },
  });

  return { user: toPublicUser(user), accessToken: issueAccessToken(user), refreshToken };
}

export async function rotateRefreshToken(rawToken: string): Promise<AuthSession> {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!existing) {
    throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new HttpError(401, 'Refresh token reuse detected', 'REFRESH_REUSE');
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(401, 'Refresh token expired', 'REFRESH_EXPIRED');
  }

  const nextToken = generateOpaqueToken();
  const created = await prisma.refreshToken.create({
    data: {
      userId: existing.userId,
      tokenHash: hashToken(nextToken),
      expiresAt: refreshExpiry(),
    },
  });

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedById: created.id },
  });

  return {
    user: toPublicUser(existing.user),
    accessToken: issueAccessToken(existing.user),
    refreshToken: nextToken,
  };
}

export async function revokeRefreshToken(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
