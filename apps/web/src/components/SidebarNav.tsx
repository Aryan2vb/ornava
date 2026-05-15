"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { betaNavItems } from "@/lib/beta-ui";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav" aria-label="Sidebar navigation">
      <div className="sidebar-brand">Ornava</div>
      <div className="sidebar-links">
        {betaNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "sidebar-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
