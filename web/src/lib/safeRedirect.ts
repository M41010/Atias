/** Solo permite volver a rutas de la propia app: evita redirigir a otra web tras iniciar sesión. */
export function safeRedirect(target: string | null): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return "/";
  return target;
}
