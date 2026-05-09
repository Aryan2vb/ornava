import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "./env";
import { upsertUserFromOAuthProfile } from "./db";

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

              if (
                credentials?.email === env.DEV_AUTH_EMAIL &&
                credentials?.code === env.DEV_AUTH_CODE
              ) {
                const dbUser = await upsertUserFromOAuthProfile({
                  email: credentials.email,
                  name: credentials.email.split("@")[0],
                });

                return {
                  id: dbUser.id,
                  email: dbUser.email ?? credentials.email,
                  name: dbUser.name ?? credentials.email,
                };
              }

              return null;
            },
          }),
        ]
      : []),
  ],
  secret: env.NEXTAUTH_SECRET ?? env.AUTH_SECRET ?? "ornava-dev-secret",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await upsertUserFromOAuthProfile({
          email: user.email,
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
