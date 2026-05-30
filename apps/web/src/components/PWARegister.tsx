"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation should never block the app shell.
      });
    });
  }, []);

  return null;
}
