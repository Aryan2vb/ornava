import type { Metadata, Viewport } from "next";
import { PWARegister } from "@/components/PWARegister";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Ornava",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ornava",
  },
  title: "Ornava",
  description: "AI-powered jewelry catalog image generator",
  icons: {
    icon: "/icons/ornava.svg",
    apple: "/icons/ornava.svg",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A1A1A",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
