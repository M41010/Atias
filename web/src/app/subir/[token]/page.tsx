"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { EmptyState, Skeleton } from "@/components/ui";
import { useDocumentTitle } from "@/lib/hooks";
import { GREENHOUSES, HARVESTS, UPLOAD_LINKS } from "@/lib/simulated";

// Solo en cliente: el estado de la subida se lee del almacenamiento del móvil al iniciarse.
const UploadScreen = dynamic(() => import("@/components/UploadScreen").then((m) => m.UploadScreen), {
  ssr: false,
  loading: () => <Skeleton />,
});

export default function SubirPage() {
  useDocumentTitle("Subir vídeos");
  const { token } = useParams<{ token: string }>();
  const link = UPLOAD_LINKS[token];
  const greenhouse = GREENHOUSES.find((g) => g.id === link?.greenhouseId);
  const harvest = HARVESTS.find((h) => h.id === link?.harvestId);

  if (!greenhouse || !harvest) {
    return (
      <EmptyState title="Este enlace no es válido">
        Puede estar incompleto o haber caducado. Pide a la cooperativa que te envíe uno nuevo.
      </EmptyState>
    );
  }
  return <UploadScreen token={token} greenhouse={greenhouse} harvestLabel={harvest.label} />;
}
