import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/result", label: "Results" },
  { href: "/admin/generations", label: "Admin" },
] as const;

export function BottomNav() {
  return (
    <nav className="nav" aria-label="Primary">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
