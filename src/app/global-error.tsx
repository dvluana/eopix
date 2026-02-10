"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only capture exception if Sentry DSN is configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    } else {
      console.error("[Global Error]", error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
            fontFamily: "system-ui, sans-serif",
            background: "#1a1a1a",
            color: "#ffffff",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>
            Algo deu errado
          </h2>
          <p style={{ color: "#9ca3af" }}>
            Ocorreu um erro inesperado. Tente novamente.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#FACC15",
              color: "#1a1a1a",
              fontWeight: "bold",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
