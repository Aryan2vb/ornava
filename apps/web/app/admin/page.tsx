import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const pool = getPool();

  const [overviewResult, usersResult, healthResult, feedbackResult] =
    await Promise.all([
      pool.query<{
        total_users: string;
        users_today: string;
        total_generations: string;
        completed_generations: string;
        failed_generations: string;
        credits_burned_today: string;
        total_credits_remaining: string;
      }>(`
        select
          (select count(*) from app_users) as total_users,
          (select count(*) from app_users where created_at >= current_date) as users_today,
          (select count(*) from generations) as total_generations,
          (select count(*) from generations where status = 'completed') as completed_generations,
          (select count(*) from generations where status = 'failed') as failed_generations,
          (select count(*) from generations where status = 'completed' and created_at >= current_date) as credits_burned_today,
          (select coalesce(sum(credits), 0) from app_users) as total_credits_remaining
      `),
      pool.query<{
        id: string;
        email: string | null;
        name: string | null;
        credits: number;
        generation_count: string;
        usable_count: string;
        last_seen_at: string | null;
        created_at: string;
      }>(`
        select
          u.id,
          u.email,
          u.name,
          u.credits,
          coalesce(g.cnt, 0)::text as generation_count,
          coalesce(g.usable, 0)::text as usable_count,
          u.last_seen_at::text,
          u.created_at::text
        from app_users u
        left join lateral (
          select
            count(*) as cnt,
            count(*) filter (where id in (
              select generation_id from generation_feedback where rating = 'usable'
            )) as usable
          from generations where user_id = u.id
        ) g on true
        order by u.created_at desc
        limit 100
      `),
      pool.query<{
        p50_ms: string | null;
        p95_ms: string | null;
        success_rate: string | null;
        total_completed: string;
        total_failed: string;
      }>(`
        select
          percentile_cont(0.5) within group (order by generation_duration_ms)::int::text as p50_ms,
          percentile_cont(0.95) within group (order by generation_duration_ms)::int::text as p95_ms,
          case when count(*) > 0
            then round(count(*) filter (where status = 'completed') * 100.0 / count(*), 1)::text
            else null
          end as success_rate,
          (count(*) filter (where status = 'completed'))::text as total_completed,
          (count(*) filter (where status = 'failed'))::text as total_failed
        from generations
        where status in ('completed', 'failed')
      `),
      pool.query<{ rating: string; reason: string | null; count: string }>(`
        select rating::text, reason::text, count(*)::text
        from generation_feedback
        group by rating, reason
        order by count(*) desc
      `),
    ]);

  const overview = overviewResult.rows[0];
  const users = usersResult.rows;
  const health = healthResult.rows[0];
  const feedback = feedbackResult.rows;

  const totalFeedback = feedback.reduce((s, r) => s + Number(r.count), 0);
  const usableFeedback = feedback
    .filter((r) => r.rating === "usable")
    .reduce((s, r) => s + Number(r.count), 0);
  const usableRate =
    totalFeedback > 0 ? ((usableFeedback / totalFeedback) * 100).toFixed(1) : "—";
  const successRate = health.success_rate ?? "—";

  return (
    <div className="adm-page">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-subtitle">Beta health at a glance</p>
        </div>
        <time className="adm-timestamp">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </header>

      {/* KPI Cards */}
      <div className="adm-kpi-row">
        <KpiCard label="Beta Users" value={overview.total_users} sub={`+${overview.users_today} today`} />
        <KpiCard label="Generations" value={overview.total_generations} sub={`${overview.completed_generations} completed`} />
        <KpiCard label="Success Rate" value={`${successRate}%`} sub={`${overview.failed_generations} failed`} tone={Number(successRate) >= 90 ? "good" : Number(successRate) >= 70 ? "warn" : "bad"} />
        <KpiCard label="Usable Rate" value={`${usableRate}%`} sub={`${totalFeedback} rated`} tone={Number(usableRate) >= 70 ? "good" : Number(usableRate) >= 50 ? "warn" : "bad"} />
        <KpiCard label="Credits Burned Today" value={overview.credits_burned_today} sub={`${overview.total_credits_remaining} remaining`} />
      </div>

      {/* Two-column: Generation Health + Feedback */}
      <div className="adm-grid-2">
        <section className="adm-card">
          <h2 className="adm-card-title">Generation Performance</h2>
          <div className="adm-metric-list">
            <MetricRow label="p50 Latency" value={health.p50_ms ? `${(Number(health.p50_ms) / 1000).toFixed(1)}s` : "—"} />
            <MetricRow label="p95 Latency" value={health.p95_ms ? `${(Number(health.p95_ms) / 1000).toFixed(1)}s` : "—"} />
            <MetricRow label="Total Completed" value={health.total_completed} />
            <MetricRow label="Total Failed" value={health.total_failed} />
          </div>
        </section>

        <section className="adm-card">
          <h2 className="adm-card-title">Feedback Breakdown</h2>
          {feedback.length === 0 ? (
            <p className="adm-muted">No feedback submitted yet.</p>
          ) : (
            <div className="adm-feedback-list">
              {feedback.map((row, i) => (
                <div key={i} className="adm-feedback-row">
                  <span className={`adm-pill ${row.rating === "usable" ? "adm-pill--green" : "adm-pill--red"}`}>
                    {row.rating}
                  </span>
                  <span className="adm-feedback-reason">
                    {row.reason?.replace(/_/g, " ") ?? "—"}
                  </span>
                  <span className="adm-feedback-count">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Users Table */}
      <section className="adm-card adm-card--full">
        <div className="adm-card-header">
          <h2 className="adm-card-title">Beta Users</h2>
          <span className="adm-card-badge">{users.length} users</span>
        </div>
        {users.length === 0 ? (
          <p className="adm-muted">No users yet.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Credits</th>
                  <th>Generations</th>
                  <th>Usable</th>
                  <th>Last Active</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className="adm-user-cell-avatar">
                          {(user.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="adm-user-cell-name">{user.name ?? "—"}</div>
                          <div className="adm-user-cell-email">{user.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`adm-pill adm-pill--outline ${user.credits === 0 ? "adm-pill--red" : ""}`}>
                        {user.credits}
                      </span>
                    </td>
                    <td>{user.generation_count}</td>
                    <td>{user.usable_count}</td>
                    <td className="adm-muted">{formatRelative(user.last_seen_at)}</td>
                    <td className="adm-muted">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="adm-kpi">
      <span className="adm-kpi-label">{label}</span>
      <span className={`adm-kpi-value ${tone ? `adm-kpi-value--${tone}` : ""}`}>{value}</span>
      {sub && <span className="adm-kpi-sub">{sub}</span>}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="adm-metric-row">
      <span className="adm-metric-label">{label}</span>
      <span className="adm-metric-value">{value}</span>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
