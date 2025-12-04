"use client";

import { useEffect } from "react";

export default function PhantomRedirectPage() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect && typeof redirect === "string") {
        // Redirect to actual vault page inside Phantom webview
        window.location.href = decodeURIComponent(redirect);
      }
    } catch {
      // swallow errors – this page is only a lightweight redirect
    }
  }, []);

  return (
    <p className="text-center text-sm text-neutral-400 py-10">
      Opening VaultFi in Phantom...
    </p>
  );
}

