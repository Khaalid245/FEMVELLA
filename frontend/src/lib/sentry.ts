import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || import.meta.env.DEV) return;

  const environment = import.meta.env.VITE_ENVIRONMENT;
  if (!environment) {
    // Refuse to initialise Sentry without an explicit environment tag.
    // This prevents staging/preview deployments from polluting the
    // production dashboard with mistagged events.
    console.warn("[Femvelle] Sentry not initialised: VITE_ENVIRONMENT is not set.");
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: import.meta.env.VITE_RELEASE_VERSION,
    integrations: [
      Sentry.browserTracingIntegration(),
      // maskAllText: true  — masks all text content in replays, protecting customer PII
      //   (names, addresses, email inputs, checkout fields).
      // blockAllMedia: false — product images are not PII; keeping them unblocked
      //   preserves visual context needed to diagnose UI bugs.
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      return event;
    },
  });
}
