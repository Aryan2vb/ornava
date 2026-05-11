import type React from "react";

type IconName =
  | "arrow-left"
  | "arrow-right"
  | "bag"
  | "calendar"
  | "camera"
  | "check"
  | "clock"
  | "diamond"
  | "download"
  | "home"
  | "image"
  | "info"
  | "lock"
  | "phone"
  | "plus"
  | "refresh"
  | "search"
  | "spark"
  | "upload"
  | "user"
  | "x";

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function Icon({ name, size = 18, className, style }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.1"
      style={style}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

const paths: Record<IconName, React.ReactNode> = {
  "arrow-left": <path d="m15 18-6-6 6-6" />,
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  bag: (
    <>
      <path d="M4 7h16" />
      <path d="M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </>
  ),
  calendar: (
    <>
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4h-5L7.8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.8z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  diamond: (
    <>
      <path d="M6 3h12l3 6-9 12L3 9z" />
      <path d="M3 9h18" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  home: (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  image: (
    <>
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 15-4-4-6 6-3-3-5 5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
    </>
  ),
  lock: (
    <>
      <rect height="10" rx="2" width="18" x="3" y="11" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6M8 11h6" />
    </>
  ),
  spark: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />,
  upload: (
    <>
      <path d="M12 21V9" />
      <path d="m7 14 5-5 5 5" />
      <path d="M5 3h14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" />,
};
