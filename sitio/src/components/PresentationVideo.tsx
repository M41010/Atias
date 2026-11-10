/**
 * Vídeo de presentación (60 s). De momento solo existe en español, así que solo lo muestra la web
 * en español; los otros idiomas lo tendrán cuando se generen sus versiones (ver video/README.md).
 * Se descarga al pulsar reproducir: el cartel es una imagen ligera.
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
        <div className="mt-10 border-[3px] border-ink bg-ink">
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
