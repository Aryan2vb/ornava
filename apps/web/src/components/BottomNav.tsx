"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { betaNavItems } from "@/lib/beta-ui";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Primary">
      {betaNavItems.map((item) => (
        <Link
          className={pathname === item.href ? "active" : undefined}
          key={item.href}
          href={item.href}
        >
          <Icon name={item.icon} size={19} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
