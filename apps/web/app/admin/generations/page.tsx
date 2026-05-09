import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { PhoneShell } from "@/components/PhoneShell";
import { authOptions, isAdminEmail } from "@/lib/auth";

export default async function AdminGenerationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/admin/generations");
  }

  if (!isAdminEmail(session.user.email)) {
    notFound();
  }

  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Admin</div>
        <h1 className="title">Generation debug</h1>
      </div>
      <div className="panel">
        <strong>Minimal beta support view</strong>
        <p className="copy">
          This route will show generation status, model route, provider model,
          duration, failure code, feedback reason, and retry actions.
        </p>
      </div>
    </PhoneShell>
  );
}
