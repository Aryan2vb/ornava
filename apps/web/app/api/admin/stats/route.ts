import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool();

  const [overview, users, generationHealth, feedbackBreakdown] =
    await Promise.all([
      pool.query<{
        total_users: string;
        users_today: string;
        total_generations: string;
        completed_generations: string;
        failed_generations: string;
        credits_burned_today: string;
      }>(`
        select
          (select count(*) from app_users) as total_users,
          (select count(*) from app_users where created_at >= current_date) as users_today,
          (select count(*) from generations) as total_generations,
          (select count(*) from generations where status = 'completed') as completed_generations,
          (select count(*) from generations where status = 'failed') as failed_generations,
          (select count(*) from generations where status = 'completed' and created_at >= current_date) as credits_burned_today
      `),
      pool.query<{
        id: string;
        email: string | null;
        name: string | null;
        credits: number;
        generation_count: string;
        last_seen_at: string | null;
        created_at: string;
      }>(`
        select
          u.id,
          u.email,
          u.name,
          u.credits,
          coalesce(g.cnt, 0)::text as generation_count,
          u.last_seen_at::text,
          u.created_at::text
        from app_users u
        left join lateral (
          select count(*) as cnt from generations where user_id = u.id
        ) g on true
        order by u.created_at desc
        limit 100
      `),
      pool.query<{
        p50_ms: string | null;
        p95_ms: string | null;
        avg_ms: string | null;
        success_rate: string | null;
        total_today: string;
        failed_today: string;
      }>(`
        select
          percentile_cont(0.5) within group (order by generation_duration_ms)::int::text as p50_ms,
          percentile_cont(0.95) within group (order by generation_duration_ms)::int::text as p95_ms,
          avg(generation_duration_ms)::int::text as avg_ms,
          case when count(*) > 0
            then round(count(*) filter (where status = 'completed') * 100.0 / count(*), 1)::text
            else null
          end as success_rate,
          (count(*) filter (where created_at >= current_date))::text as total_today,
          (count(*) filter (where status = 'failed' and created_at >= current_date))::text as failed_today
        from generations
        where status in ('completed', 'failed')
      `),
      pool.query<{ rating: string; reason: string | null; count: string }>(`
        select
          rating::text,
          reason::text,
          count(*)::text
        from generation_feedback
        group by rating, reason
        order by count(*) desc
      `),
    ]);

  return NextResponse.json({
    overview: overview.rows[0],
    users: users.rows,
    generationHealth: generationHealth.rows[0],
    feedbackBreakdown: feedbackBreakdown.rows,
  });
}
