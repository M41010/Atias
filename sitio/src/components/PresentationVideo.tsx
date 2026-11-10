/**
 * Vídeo de presentación (60 s). De momento solo existe en español, así que solo lo muestra la web
 * en español; los otros idiomas lo tendrán cuando se generen sus versiones (ver video/README.md).
 * Se descarga al pulsar reproducir: el cartel es una imagen ligera. Hay dos vídeos (vertical en
 * móvil, horizontal en pantallas anchas) y solo se ve uno; ninguno se descarga hasta pulsarlo.
 */
export function PresentationVideo() {
  return (
    <section className="plate border-b-[3px] border-ink" aria-labelledby="video-presentacion">
      <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,1.1fr)] lg:items-end lg:gap-14">
          <h2 id="video-presentacion" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            Atias en un minuto
          </h2>
          <p className="prose-measure text-[1.0625rem] text-ink-soft">
            Una recreación animada de cómo Atias recorre la hilera, cuenta los frutos maduros y lleva los
            datos a la cooperativa. Las pantallas de la aplicación usan datos de ejemplo.
          </p>
        </div>
        {/* En móvil, la versión vertical 9:16 con rótulos grandes; en pantallas anchas, la horizontal. */}
        <div className="mx-auto mt-10 max-w-[420px] border-[3px] border-ink bg-ink md:hidden">
          <video
            className="block aspect-[9/16] w-full"
            controls
            playsInline
            preload="none"
            poster="/video/atias-es-vertical-poster.jpg"
            aria-label="Vídeo de presentación de Atias en vertical, sin sonido, con rótulos en pantalla"
          >
            <source src="/video/atias-es-vertical.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="mt-10 hidden border-[3px] border-ink bg-ink md:block">
          <video
            className="block aspect-video w-full"
            controls
            playsInline
            preload="none"
            poster="/video/atias-es-poster.jpg"
            aria-label="Vídeo de presentación de Atias, sin sonido, con rótulos en pantalla"
          >
            <source src="/video/atias-es.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
