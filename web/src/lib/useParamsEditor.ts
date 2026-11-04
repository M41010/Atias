"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getParams, type Params, saveParams } from "./api";
import { queryKeys } from "./hooks";

/** Lee y guarda parámetros. El cambio se ve al instante y se deshace si falla el guardado. */
export function useParamsEditor() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.params, queryFn: getParams });
  const [undoTo, setUndoTo] = useState<Params | null>(null);

  const save = useMutation({
    mutationFn: saveParams,
    onMutate: async (next: Params) => {
      await client.cancelQueries({ queryKey: queryKeys.params });
      const previous = client.getQueryData<Params>(queryKeys.params);
      client.setQueryData(queryKeys.params, next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) client.setQueryData(queryKeys.params, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ["informe"] }),
  });

  return {
    ...query,
    save,
    undoTo,
    /** Restablece solo lo que pertenece a la pantalla actual y permite deshacerlo. */
    restore: (current: Params, restored: Params) => {
      setUndoTo(current);
      save.mutate(restored);
    },
    undo: () => {
      if (undoTo) save.mutate(undoTo);
      setUndoTo(null);
    },
    clearUndo: () => setUndoTo(null),
  };
}
