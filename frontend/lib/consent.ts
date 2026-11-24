export type ConsentState = "accepted" | "rejected" | null;

const CONSENT_STORAGE_KEY = "cookie_consent";
const CONSENT_EVENT = "cookie-consent-change";

export function readConsent(): ConsentState {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === "accepted" || value === "true") {
      return "accepted";
    }
    if (value === "rejected") {
      return "rejected";
    }
  } catch {
    return null;
  }

  return null;
}

export function hasAnalyticsConsent(): boolean {
  return readConsent() === "accepted";
}

export function writeConsent(state: Exclude<ConsentState, null>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  } catch {
    return;
  }

  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function subscribeConsent(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CONSENT_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CONSENT_EVENT, listener);
  };
}
