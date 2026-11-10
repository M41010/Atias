import { llmsText } from "@/seo/llms";

// La web es estática: el fichero se genera al compilar, con el dominio si lo hay.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
