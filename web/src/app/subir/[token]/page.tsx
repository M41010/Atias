"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useDocumentTitle } from "@/lib/hooks";
import { ApiError, fetchLink } from "@/lib/serverApi";

// Solo en cliente: la biblioteca de subida necesita las API del navegador.
const UploadScreen = dynamic(() => import("@/components/UploadScreen").then((m) => m.UploadScreen), {
  ssr: false,
  loading: () => <Skeleton />,
});

export default function SubirPage() {
  useDocumentTitle("Subir vídeos");
  const { token } = useParams<{ token: string }>();
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["enlace", token],
    queryFn: () => fetchLink(token),
    // El estado de esta pantalla vive en la sesión: no se recarga al volver a la pestaña.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (count, e) => !(e instanceof ApiError && e.status === 404) && count < 2,
  });

  if (isPending) return <Skeleton />;
  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState title="Este enlace no es válido">
        Puede estar incompleto o haber caducado. Pide a la cooperativa que te envíe uno nuevo.
      </EmptyState>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  return <UploadScreen token={token} link={data} />;
}
