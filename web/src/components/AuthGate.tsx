"use client";

import { useQuery } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { ErrorState, Skeleton } from "@/components/ui";
import { ApiError, fetchCurrentUser } from "@/lib/serverApi";

/**
 * Muestra la cooperativa solo con sesión iniciada. La protección real está en la API, que exige
 * sesión en todos sus datos; esto evita enseñar pantallas a quien no ha entrado. La redirección
 * al acceso la hace el QueryClient al recibir un 401.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { data, error, refetch } = useQuery({ queryKey: ["usuario"], queryFn: fetchCurrentUser, staleTime: 60_000 });
  if (data) return <>{children}</>;
  if (error && !(error instanceof ApiError && error.status === 401)) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }
  return <Skeleton />;
}
