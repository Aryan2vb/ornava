import {
  formatAdminDuration,
  statusToneForGeneration,
} from "@/lib/admin-generations";
import { getPool } from "@/lib/db";
import { env } from "@/lib/env";
import { createObjectReadUrl } from "@/lib/storage";
import type { GenerationBrief, GenerationMode, GenerationStatus, FeedbackRating, FeedbackReason, JsonValue } from "@ornava/shared";

export const dynamic = "force-dynamic";

type GenRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  image_id: string;
  mode: GenerationMode;
  status: GenerationStatus;
  model_route: string;
  generation_brief: GenerationBrief;
  provider: string | null;
  provider_model_id: string | null;
  provider_job_id: string | null;
  attempt_count: number;
  failure_code: string | null;
  failure_message_safe: string | null;
  generation_duration_ms: number | null;
  feedback_rating: FeedbackRating | null;
  feedback_reason: FeedbackReason | null;
  original_object_key: string;
  output_object_key: string | null;
  created_at: string;
};

export default async function AdminGenerationsPage() {
  const pool = getPool();

  const result = await pool.query<GenRow>(`
    select
      g.id,
      g.user_id,
      u.email as user_email,
      g.image_id,
      g.mode,
      g.status,
      g.model_route,
      g.generation_brief,
      g.provider,
      g.provider_model_id,
      g.provider_job_id,
      g.attempt_count,
      g.failure_code,
      g.failure_message_safe,
      g.generation_duration_ms,
      gf.rating as feedback_rating,
      gf.reason as feedback_reason,
      i.original_object_key,
      g.output_object_key,
      g.created_at::text
    from generations g
    join app_users u on u.id = g.user_id
    join images i on i.id = g.image_id
    left join lateral (
      select rating, reason
      from generation_feedback
      where generation_id = g.id
      order by created_at desc
      limit 1
    ) gf on true
    order by g.created_at desc
    limit 25
  `);

  const generations = await Promise.all(
    result.rows.map(async (row) => {
      let originalUrl: string | null = null;
      let generatedUrl: string | null = null;

      try {
        const orig = await createObjectReadUrl({
          bucket: env.R2_ORIGINALS_BUCKET,
          objectKey: row.original_object_key,
        });
        originalUrl = orig.url;
      } catch {}

      if (row.output_object_key) {
        try {
          const gen = await createObjectReadUrl({
            bucket: env.R2_GENERATED_BUCKET,
            objectKey: row.output_object_key,
          });
          generatedUrl = gen.url;
        } catch {}
      }

      return { ...row, originalUrl, generatedUrl };
    }),
  );

  return (
    <div className="adm-page">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Generations</h1>
          <p className="adm-page-subtitle">Recent jobs with image previews</p>
        </div>
      </header>

      {generations.length === 0 ? (
        <div className="adm-card">
          <p className="adm-muted">No generations yet. Run a flow to populate this view.</p>
        </div>
      ) : (
        <div className="adm-gen-grid">
          {generations.map((gen) => {
            const tone = statusToneForGeneration(gen.status);
            return (
              <div key={gen.id} className="adm-gen-card">
                <div className="adm-gen-images">
                  <div className="adm-gen-img-wrap">
                    {gen.originalUrl ? (
                      <img src={gen.originalUrl} alt="Original" className="adm-gen-img" />
                    ) : (
                      <div className="adm-gen-img-placeholder">No image</div>
                    )}
                    <span className="adm-gen-img-label">Original</span>
                  </div>
                  <div className="adm-gen-img-wrap">
                    {gen.generatedUrl ? (
                      <img src={gen.generatedUrl} alt="Generated" className="adm-gen-img" />
                    ) : (
                      <div className="adm-gen-img-placeholder">
                        {gen.status === "completed" ? "Missing" : gen.status}
                      </div>
                    )}
                    <span className="adm-gen-img-label">Generated</span>
                  </div>
                </div>
                <div className="adm-gen-meta">
                  <div className="adm-gen-meta-row">
                    <span className={`adm-pill ${tone === "success" ? "adm-pill--green" : tone === "danger" ? "adm-pill--red" : ""}`}>
                      {gen.status}
                    </span>
                    <span className="adm-pill">{gen.mode.replace("_", " ")}</span>
                  </div>
                  <div className="adm-gen-meta-detail">
                    <span>{gen.user_email ?? gen.user_id.slice(0, 8)}</span>
                    <span>{formatAdminDuration(gen.generation_duration_ms)}</span>
                  </div>
                  <div className="adm-gen-meta-detail">
                    <span className="adm-muted">{gen.model_route}</span>
                    {gen.feedback_rating && (
                      <span className={`adm-pill ${gen.feedback_rating === "usable" ? "adm-pill--green" : "adm-pill--red"}`}>
                        {gen.feedback_rating}
                      </span>
                    )}
                  </div>
                  {gen.failure_code && (
                    <p className="adm-gen-error">{gen.failure_code}: {gen.failure_message_safe}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
