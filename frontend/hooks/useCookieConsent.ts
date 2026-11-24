"use client";

import { useSyncExternalStore } from "react";
import { ConsentState, readConsent, subscribeConsent } from "../lib/consent";

const getServerSnapshot = (): ConsentState => null;

export function useCookieConsent(): ConsentState {
  return useSyncExternalStore(subscribeConsent, readConsent, getServerSnapshot);
}
