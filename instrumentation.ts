// Instrumentation file for Next.js
// Only initializes Sentry when DSN is configured

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    // Skip Sentry initialization if no DSN is configured
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (...args: unknown[]) => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    // Log to console if Sentry is not configured
    console.error("[Request Error]", args[0]);
    return;
  }

  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...(args as Parameters<typeof Sentry.captureRequestError>));
};
