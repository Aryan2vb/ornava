import { redirect } from "next/navigation";
import { LoginCard } from "@/components/LoginCard";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

function safeCallbackUrl(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const callbackUrl = safeCallbackUrl(resolvedSearchParams?.callbackUrl);

  return (
    <main className="login-screen">
      <LoginCard
        callbackUrl={callbackUrl}
        googleConfigured={await isGoogleAuthEnabled()}
        oauthFailed={resolvedSearchParams?.error === "oauth"}
      />
    </main>
  );
}
