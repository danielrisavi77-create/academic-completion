export type ClientAnalyticsEvent =
  | "scan_started"
  | "deadline_set"
  | "scan_completed"
  | "blocker_presented"
  | "first_action_clicked";

export type ClientAnalyticsPayload = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackClientEvent(
  event: ClientAnalyticsEvent,
  payload: ClientAnalyticsPayload = {},
): void {
  if (typeof window === "undefined") return;

  const detail = { event, ...payload };
  window.dispatchEvent(new CustomEvent("academic-completion:analytics", { detail }));

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(detail);
  }
}
