"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { MotionConfig } from "framer-motion";
import { type ReactNode, useState } from "react";
import { clearOfflineCopy, COPY_MAX_AGE_MS, COPY_VERSION, copyPersister, shouldRetry, shouldSave } from "@/lib/offlineCopy";
import { ApiError } from "@/lib/serverApi";

function createClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        // La sesión ha caducado mientras se usaba la app.
        if (error instanceof ApiError && error.status === 401 && !window.location.pathname.startsWith("/acceder")) {
          const back = encodeURIComponent(window.location.pathname + window.location.search);
          void clearOfflineCopy().finally(() => {
            // Carga completa a propósito: no debe quedar en memoria nada de la sesión caducada.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign(`/acceder?volver=${back}`);
          });
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Debe durar al menos lo mismo que la copia, o se descartaría al restaurarla.
        gcTime: COPY_MAX_AGE_MS,
        networkMode: "offlineFirst",
        retry: (count, error) => shouldRetry(count, error, navigator.onLine),
      },
      // Sin conexión debe fallar y avisar, no quedarse «Guardando…» indefinidamente.
      mutations: { networkMode: "always" },
    },
  });
}

/** `offlineCopy` solo en la cooperativa: la pantalla del agricultor no guarda nada en el dispositivo. */
export function Providers({ children, offlineCopy = false }: { children: ReactNode; offlineCopy?: boolean }) {
  const [client] = useState(createClient);
  const content = <MotionConfig reducedMotion="user">{children}</MotionConfig>;
  if (!offlineCopy) return <QueryClientProvider client={client}>{content}</QueryClientProvider>;
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: copyPersister,
        maxAge: COPY_MAX_AGE_MS,
        buster: COPY_VERSION,
        dehydrateOptions: { shouldDehydrateQuery: shouldSave },
      }}
    >
      {content}
    </PersistQueryClientProvider>
  );
}
