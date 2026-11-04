"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { type ReactNode, useState } from "react";
import { ApiError } from "@/lib/serverApi";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            // La sesión ha caducado mientras se usaba la app.
            if (error instanceof ApiError && error.status === 401 && !window.location.pathname.startsWith("/acceder")) {
              const back = encodeURIComponent(window.location.pathname + window.location.search);
              // Carga completa a propósito: no debe quedar en memoria nada de la sesión caducada.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign(`/acceder?volver=${back}`);
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            networkMode: "offlineFirst",
            retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
