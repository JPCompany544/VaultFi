\"use client\";

import { useEffect } from \"react\";
import { useSearchParams } from \"next/navigation\";

export default function PhantomRedirectPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get(\"redirect\");
    if (redirect && typeof redirect === \"string\") {
      // Redirect to actual vault page inside Phantom webview
      window.location.href = decodeURIComponent(redirect);
    }
  }, [searchParams]);

  return <p className=\"text-center text-sm text-neutral-400 py-10\">Opening VaultFi in Phantom...</p>;
}


