"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { betaNavItems } from "@/lib/beta-ui";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bnav" aria-label="Primary navigation">
      {betaNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bnav-item ${pathname === item.href ? "bnav-active" : ""}`}
          aria-label={item.label}
        >
          <Icon name={item.icon} size={20} />
          <span className="bnav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
