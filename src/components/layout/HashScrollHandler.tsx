"use client";

import { useEffect } from "react";

export function HashScrollHandler() {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) {
        return;
      }

      const id = decodeURIComponent(hash.replace(/^#/, ""));
      const element = document.getElementById(id);
      if (!element) {
        return;
      }

      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 80);
      });
    };

    const timeoutId = window.setTimeout(scrollToHash, 120);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return null;
}
