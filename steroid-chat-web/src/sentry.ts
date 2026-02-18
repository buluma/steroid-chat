import * as Sentry from "@sentry/react";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const isSentryEnabled = Boolean(sentryDsn);

if (isSentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    enableLogs: true,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    ],
    tracesSampleRate: 1.0,
  });
} else {
  console.warn("Sentry disabled: set VITE_SENTRY_DSN to enable telemetry.");
}

const { logger } = Sentry;

export { Sentry, logger, isSentryEnabled };
