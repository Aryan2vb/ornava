import { redirect, notFound } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!isAdminEmail(user.email)) {
    notFound();
  }

  return (
    <div className="adm">
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>Ornava</span>
        </div>
        <nav className="adm-nav">
          <a href="/admin" className="adm-nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Overview
          </a>
          <a href="/admin/generations" className="adm-nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Generations
          </a>
        </nav>
        <div className="adm-sidebar-footer">
          <div className="adm-avatar">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="adm-user-info">
            <span className="adm-user-name">{user.name ?? "Admin"}</span>
            <span className="adm-user-email">{user.email}</span>
          </div>
        </div>
      </aside>
      <main className="adm-content">{children}</main>
    </div>
  );
}
