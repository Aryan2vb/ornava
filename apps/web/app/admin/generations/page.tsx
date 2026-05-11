import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { PhoneShell } from "@/components/PhoneShell";
import { authOptions, isAdminEmail } from "@/lib/auth";
import {
  formatAdminDuration,
  statusToneForGeneration,
} from "@/lib/admin-generations";
import { listAdminGenerationDebugRows } from "@/lib/db";

export default async function AdminGenerationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/admin/generations");
  }

  if (!isAdminEmail(session.user.email)) {
    notFound();
  }

  const generations = await listAdminGenerationDebugRows();

  return (
    <PhoneShell>
      <div className="screen-header">
        <div className="eyebrow">Admin</div>
        <h1 className="title">Generation debug</h1>
        <p className="copy">
          Recent beta jobs, provider details, timing, failure, feedback, and
          event trail health.
        </p>
      </div>
      {generations.length === 0 ? (
        <div className="panel">
          <strong>No generations yet</strong>
          <p className="copy">Run a phone flow to populate this debug view.</p>
        </div>
      ) : null}
      {generations.map((generation) => {
        const tone = statusToneForGeneration(generation.status);

        return (
          <div className="panel" key={generation.id}>
            <div className="screen-header-row">
              <div className="screen-header">
                <strong style={{ fontSize: 15, lineHeight: "20px" }}>
                  {generation.mode.replace("_", " ")}
                </strong>
                <span className="copy">{generation.user_email ?? generation.user_id}</span>
              </div>
              <span className={`status-pill ${tone}`}>{generation.status}</span>
            </div>
            <div className="debug-grid">
              <span>Generation</span>
              <code>{generation.id}</code>
              <span>Image</span>
              <code>{generation.image_id}</code>
              <span>Model route</span>
              <strong>{generation.model_route}</strong>
              <span>Brief</span>
              <strong>
                {[
                  generation.generation_brief.jewelryType,
                  generation.generation_brief.posePresetId,
                  generation.generation_brief.backgroundPresetId,
                  generation.generation_brief.aspectRatio,
                  generation.generation_brief.promptTemplateVersion,
                ].join(" / ")}
              </strong>
              <span>Provider</span>
              <strong>
                {[generation.provider, generation.provider_model_id]
                  .filter(Boolean)
                  .join(" / ") || "n/a"}
              </strong>
              <span>Provider job</span>
              <code>{generation.provider_job_id ?? "n/a"}</code>
              <span>Runtime</span>
              <strong>{formatAdminDuration(generation.generation_duration_ms)}</strong>
              <span>Attempts</span>
              <strong>{generation.attempt_count}</strong>
              <span>Feedback</span>
              <strong>
                {[generation.feedback_rating, generation.feedback_reason]
                  .filter(Boolean)
                  .join(" / ") || "none"}
              </strong>
              <span>Events</span>
              <strong>
                {generation.event_count} · {generation.latest_event_name ?? "none"}
              </strong>
            </div>
            {generation.failure_code ? (
              <p className="status-text error">
                {generation.failure_code}: {generation.failure_message_safe}
              </p>
            ) : null}
          </div>
        );
      })}
    </PhoneShell>
  );
}
