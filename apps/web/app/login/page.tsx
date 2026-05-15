import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { LoginCard } from "@/components/LoginCard";
import {
  authOptions,
  isDevCredentialsConfigured,
  isGoogleAuthConfigured,
} from "@/lib/auth";
import { env } from "@/lib/env";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl || "/dashboard";

  return (
    <main className="login-screen">
      <LoginCard
        callbackUrl={callbackUrl}
        googleConfigured={isGoogleAuthConfigured() && Boolean(env.NEXTAUTH_URL)}
        devCredentialsConfigured={isDevCredentialsConfigured()}
      />
    </main>
  );
}
