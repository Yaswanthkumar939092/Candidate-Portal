"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useStartConsentSession } from "./useJobOffer";
import {
  navigateToExternalConsent,
  resolveConsentOnwardUrl,
} from "@/lib/utils/dpdp-consent";

/**
 * Sends a candidate out to the external DPDP consent portal.
 *
 * Two places need this - the offer page right after acceptance, and the consent
 * page when it is opened directly in external mode - and they must behave
 * identically, so the whole decision lives here:
 *
 * 1. Use the link we were already given, if there is a usable one.
 * 2. Otherwise re-issue one via `start_consent_session`. A `reused: true` reply
 *    is the in-flight link and is used as-is rather than retried away.
 * 3. If that session says the candidate has already consented, skip the portal
 *    entirely and send them onward.
 * 4. Only when all of that fails does `failed` flip, so the caller can offer a
 *    retry instead of leaving the candidate on a dead end.
 */
export function useExternalConsentHandoff(appl: string, token?: string) {
  const router = useRouter();
  const { mutateAsync: startConsentSession } = useStartConsentSession();
  const [failed, setFailed] = useState(false);

  const handoff = useCallback(
    async (preIssuedUrl?: string | null): Promise<boolean> => {
      setFailed(false);

      if (navigateToExternalConsent(preIssuedUrl)) return true;

      try {
        const session = await startConsentSession({ appl, token });

        if (session?.already_consented) {
          const { url, isExternal } = resolveConsentOnwardUrl(
            session.redirect_url,
            appl,
            token,
          );
          if (isExternal) {
            window.location.assign(url);
          } else {
            router.push(url);
          }
          return true;
        }

        if (navigateToExternalConsent(session?.consent_url)) return true;
      } catch {
        // Fall through to the failed state below - the caller shows a retry.
      }

      setFailed(true);
      return false;
    },
    [appl, token, router, startConsentSession],
  );

  return { handoff, failed };
}
