import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env, getRequiredAuthSecret } from "./env";
import { upsertUserFromOAuthProfile } from "./db";
import { normalizeEmail } from "./identity";

const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const devCredentialsConfigured = Boolean(
  process.env.NODE_ENV !== "production" &&
    env.DEV_AUTH_EMAIL &&
    env.DEV_AUTH_CODE,
);
const adminEmails = new Set(
  (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const authOptions: NextAuthOptions = {
  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(devCredentialsConfigured
      ? [
          CredentialsProvider({
            id: "credentials",
            name: "Development Code",
            credentials: {
              email: { label: "Email", type: "email" },
              code: { label: "Code", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials) {
                return null;
              }

              const email = normalizeEmail(credentials.email);

              if (
                email &&
                email === normalizeEmail(env.DEV_AUTH_EMAIL) &&
                credentials?.code === env.DEV_AUTH_CODE
              ) {
                const dbUser = await upsertUserFromOAuthProfile({
                  email,
                  name: email.split("@")[0],
                });

                return {
                  id: dbUser.id,
                  email: dbUser.email ?? email,
                  name: dbUser.name ?? email,
                };
              }

              return null;
            },
          }),
        ]
      : []),
  ],
  secret: getRequiredAuthSecret(process.env),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      return Boolean(normalizeEmail(user.email));
    },
    async jwt({ token, user }) {
      const email = normalizeEmail(user?.email);

      if (email) {
        const dbUser = await upsertUserFromOAuthProfile({
          email,
          name: user.name,
          image: user.image,
        });

        token.userId = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.picture = dbUser.avatar_url;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string | undefined;
        session.user.email = token.email as string | null | undefined;
        session.user.name = token.name as string | null | undefined;
        session.user.image = token.picture as string | null | undefined;
      }

      return session;
    },
  },
};

export function isGoogleAuthConfigured() {
  return googleConfigured;
}

export function isDevCredentialsConfigured() {
  return devCredentialsConfigured;
}

export function isAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails.has(email.toLowerCase()));
}
