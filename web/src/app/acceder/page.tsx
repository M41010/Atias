"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { useDocumentTitle } from "@/lib/hooks";
import { safeRedirect } from "@/lib/safeRedirect";
import { ApiError, fetchCurrentUser, signIn } from "@/lib/serverApi";

function AccessForm() {
  useDocumentTitle("Acceder");
  const router = useRouter();
  const target = safeRedirect(useSearchParams().get("volver"));
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Quien ya tiene sesión no necesita este formulario.
  const current = useQuery({ queryKey: ["usuario"], queryFn: fetchCurrentUser, retry: false, staleTime: 0 });
  useEffect(() => {
    if (current.data) router.replace(target);
  }, [current.data, router, target]);

  const submit = useMutation({
    mutationFn: () => signIn(correo, contrasena),
    // Carga completa: así ninguna pantalla parte de datos de una sesión anterior.
    onSuccess: () => window.location.assign(target),
  });

  const message = submit.error
    ? submit.error instanceof ApiError
      ? submit.error.message
      : "No se ha podido conectar. Comprueba la conexión y vuelve a intentarlo."
    : null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!submit.isPending) submit.mutate();
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <p className="text-lg font-semibold tracking-tight text-brand-ink">Atias</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Acceso de la cooperativa</h1>
        <p className="mt-1 text-sm text-muted">Si eres agricultor, usa el enlace personal que te ha enviado la cooperativa.</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-lg border border-line bg-surface p-5">
          <div>
            <label htmlFor="correo" className="mb-1 block text-sm font-medium">Correo</label>
            <input
              id="correo"
              type="email"
              name="email"
              autoComplete="username"
              required
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              className="input min-h-11 w-full"
            />
          </div>
          <div>
            <label htmlFor="contrasena" className="mb-1 block text-sm font-medium">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              className="input min-h-11 w-full"
            />
          </div>
          {message && <p role="alert" className="text-sm text-bad-ink">{message}</p>}
          <button type="submit" disabled={submit.isPending} className="btn-primary min-h-11 justify-center disabled:cursor-not-allowed disabled:opacity-55">
            {submit.isPending ? "Entrando…" : "Entrar"}
          </button>
          <p className="text-xs text-muted">¿Has olvidado la contraseña? Pide a quien administra Atias que la cambie.</p>
        </form>
      </div>
    </main>
  );
}

export default function AccederPage() {
  return (
    <Suspense fallback={null}>
      <AccessForm />
    </Suspense>
  );
}
