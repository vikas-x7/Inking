import { prisma } from '../../database/prisma.js';
import type { AuthSession, AuthUser, OAuthProfile, OAuthTokens } from './auth.types.js';

export const authRepository = {
  findAccount(provider: string, providerAccountId: string) {
    return prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });
  },

  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  upsertOAuthUser(profile: OAuthProfile, tokens: OAuthTokens): Promise<AuthUser> {
    return prisma.$transaction(async (tx) => {
      const existingAccount = await tx.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
        include: {
          user: true,
        },
      });

      if (existingAccount) {
        await tx.account.update({
          where: { id: existingAccount.id },
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
          },
        });

        return existingAccount.user;
      }

      const existingUser = await tx.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        await tx.account.create({
          data: {
            userId: existingUser.id,
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
          },
        });

        return existingUser;
      }

      return tx.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          image: profile.image,
          accounts: {
            create: {
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt,
            },
          },
        },
      });
    });
  },

  createSession(userId: string, token: string, expiresAt: Date): Promise<AuthSession> {
    return prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  },

  findSessionByToken(token: string) {
    return prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });
  },

  deleteSessionByToken(token: string) {
    return prisma.session.deleteMany({
      where: { token },
    });
  },
};
