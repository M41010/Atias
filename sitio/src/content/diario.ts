/**
 * Diario del piloto: novedades fechadas, de la más reciente a la más antigua, como un registro de
 * cambios. Para añadir una entrada, ponla ARRIBA de la lista con su fecha y sus textos en los seis
 * idiomas. Solo hechos reales: sin cifras de precisión no medidas y sin nombrar la empresa del piloto
 * ni a personas.
 *
 * `date`: «AAAA-MM» si solo se sabe el mes, «AAAA-MM-DD» si se sabe el día. Una entrada con fecha
 * posterior al día en que se compila la web se muestra como «Próximo».
 */
import type { Locale } from "@/i18n/config";

export type JournalEntry = {
  date: string;
  text: Record<Locale, { title: string; body: string }>;
};

export const DIARIO: JournalEntry[] = [
  {
    date: "2026-11-14",
    text: {
      es: { title: "Primera grabación en un invernadero real", body: "Grabamos las hileras de un invernadero del sur de España y contamos a mano tramos de control para comprobar el conteo de la cámara. Después se comparará con lo que se recoja esa semana." },
      en: { title: "First recording in a real greenhouse", body: "We film the rows of a greenhouse in southern Spain and count control sections by hand to check the camera’s count. It will then be compared with what is harvested that week." },
      fr: { title: "Premier tournage dans une vraie serre", body: "Nous filmons les rangs d’une serre du sud de l’Espagne et comptons à la main des tronçons de contrôle pour vérifier le comptage de la caméra. Il sera ensuite comparé à ce qui sera récolté cette semaine-là." },
      nl: { title: "Eerste opname in een echte kas", body: "We filmen de rijen van een kas in Zuid-Spanje en tellen controledelen met de hand om de telling van de camera te controleren. Daarna wordt het vergeleken met wat die week wordt geoogst." },
      it: { title: "Prima ripresa in una serra vera", body: "Riprendiamo le file di una serra del sud della Spagna e contiamo a mano dei tratti di controllo per verificare il conteggio della telecamera. Poi sarà confrontato con ciò che si raccoglierà quella settimana." },
      pt: { title: "Primeira gravação numa estufa real", body: "Gravamos as linhas de uma estufa do sul de Espanha e contamos à mão troços de controlo para verificar a contagem da câmara. Depois será comparado com o que se colher nessa semana." },
    },
  },
  {
    date: "2026-11",
    text: {
      es: { title: "Web pública en seis idiomas y vídeo de presentación", body: "Atias se presenta en español, inglés, francés, neerlandés, italiano y portugués, con un vídeo de un minuto que recorre un invernadero recreado." },
      en: { title: "Public website in six languages and presentation video", body: "Atias presents itself in Spanish, English, French, Dutch, Italian and Portuguese, with a one-minute video that walks through a recreated greenhouse." },
      fr: { title: "Site public en six langues et vidéo de présentation", body: "Atias se présente en espagnol, anglais, français, néerlandais, italien et portugais, avec une vidéo d’une minute qui parcourt une serre recréée." },
      nl: { title: "Openbare website in zes talen en presentatievideo", body: "Atias stelt zich voor in het Spaans, Engels, Frans, Nederlands, Italiaans en Portugees, met een video van één minuut door een nagebouwde kas." },
      it: { title: "Sito pubblico in sei lingue e video di presentazione", body: "Atias si presenta in spagnolo, inglese, francese, olandese, italiano e portoghese, con un video di un minuto che percorre una serra ricreata." },
      pt: { title: "Site público em seis línguas e vídeo de apresentação", body: "A Atias apresenta-se em espanhol, inglês, francês, neerlandês, italiano e português, com um vídeo de um minuto que percorre uma estufa recriada." },
    },
  },
  {
    date: "2026-11",
    text: {
      es: { title: "Primer prototipo de la aplicación", body: "La aplicación funciona de principio a fin: el agricultor sube el vídeo desde el móvil, se cuenta la fruta madura por tramo de hilera y la cooperativa ve los kilos de cada día y los temporeros necesarios." },
      en: { title: "First prototype of the app", body: "The app works end to end: the grower uploads the video from a phone, ripe fruit is counted per row section and the cooperative sees each day’s kilos and the pickers needed." },
      fr: { title: "Premier prototype de l’application", body: "L’application fonctionne de bout en bout : le producteur envoie la vidéo depuis son téléphone, les fruits mûrs sont comptés par tronçon de rang et la coopérative voit les kilos de chaque jour et les saisonniers nécessaires." },
      nl: { title: "Eerste prototype van de app", body: "De app werkt van begin tot eind: de teler uploadt de video vanaf de telefoon, het rijpe fruit wordt per rijdeel geteld en de coöperatie ziet de kilo’s van elke dag en de benodigde plukkers." },
      it: { title: "Primo prototipo dell’app", body: "L’app funziona dall’inizio alla fine: l’agricoltore carica il video dal telefono, la frutta matura viene contata per tratto di fila e la cooperativa vede i chili di ogni giorno e i braccianti necessari." },
      pt: { title: "Primeiro protótipo da aplicação", body: "A aplicação funciona do princípio ao fim: o agricultor envia o vídeo a partir do telemóvel, a fruta madura é contada por troço de linha e a cooperativa vê os quilos de cada dia e os trabalhadores necessários." },
    },
  },
  {
    date: "2026-10",
    text: {
      es: { title: "La idea", body: "Conversaciones con gente que trabaja en invernaderos sobre cómo se prevé la cosecha cada semana. De ahí sale la pregunta: ¿y si la fruta se pudiera contar en lugar de estimar?" },
      en: { title: "The idea", body: "Conversations with people who work in greenhouses about how the harvest is forecast each week. Out of them comes the question: what if the fruit could be counted instead of estimated?" },
      fr: { title: "L’idée", body: "Des conversations avec des personnes qui travaillent en serre sur la façon dont la récolte est prévue chaque semaine. D’où la question : et si l’on pouvait compter les fruits au lieu de les estimer ?" },
      nl: { title: "Het idee", body: "Gesprekken met mensen die in kassen werken over hoe de oogst elke week wordt voorspeld. Daaruit komt de vraag: wat als je het fruit kon tellen in plaats van schatten?" },
      it: { title: "L’idea", body: "Conversazioni con persone che lavorano in serra su come si prevede il raccolto ogni settimana. Da lì nasce la domanda: e se la frutta si potesse contare invece di stimarla?" },
      pt: { title: "A ideia", body: "Conversas com pessoas que trabalham em estufas sobre como se prevê a colheita todas as semanas. Daí surge a pergunta: e se a fruta pudesse ser contada em vez de estimada?" },
    },
  },
];

/** Textos de la sección y de la página del diario. */
export const DIARIO_UI: Record<Locale, { eyebrow: string; title: string; lead: string; upcoming: string; latest: string; all: string }> = {
  es: { eyebrow: "Diario del piloto", title: "Cómo avanza Atias", lead: "Lo que hemos hecho y lo próximo, con su fecha. Solo hechos: las cifras de precisión llegarán cuando estén medidas.", upcoming: "Próximo", latest: "Últimas novedades", all: "Ver el diario completo" },
  en: { eyebrow: "Pilot journal", title: "How Atias is progressing", lead: "What we have done and what comes next, with dates. Facts only: accuracy figures will come once they are measured.", upcoming: "Coming up", latest: "Latest news", all: "See the full journal" },
  fr: { eyebrow: "Journal du pilote", title: "Comment avance Atias", lead: "Ce que nous avons fait et ce qui vient, avec leur date. Uniquement des faits : les chiffres de précision viendront une fois mesurés.", upcoming: "Prochainement", latest: "Dernières nouvelles", all: "Voir tout le journal" },
  nl: { eyebrow: "Pilotlogboek", title: "Hoe Atias vordert", lead: "Wat we hebben gedaan en wat er komt, met datum. Alleen feiten: nauwkeurigheidscijfers volgen zodra ze gemeten zijn.", upcoming: "Binnenkort", latest: "Laatste nieuws", all: "Bekijk het volledige logboek" },
  it: { eyebrow: "Diario del pilota", title: "Come procede Atias", lead: "Ciò che abbiamo fatto e ciò che viene, con la data. Solo fatti: le cifre di precisione arriveranno quando saranno misurate.", upcoming: "Prossimamente", latest: "Ultime novità", all: "Vedi il diario completo" },
  pt: { eyebrow: "Diário do piloto", title: "Como avança a Atias", lead: "O que fizemos e o que vem a seguir, com data. Só factos: os números de precisão chegarão quando estiverem medidos.", upcoming: "Em breve", latest: "Últimas novidades", all: "Ver o diário completo" },
};

const INTL: Record<Locale, string> = { es: "es-ES", en: "en-GB", fr: "fr-FR", nl: "nl-NL", it: "it-IT", pt: "pt-PT" };

/** Fecha legible: «noviembre de 2026» si solo hay mes, «14 de noviembre de 2026» si hay día. */
export function formatJournalDate(date: string, locale: Locale): string {
  const [y, m, d] = date.split("-").map(Number);
  const value = new Date(Date.UTC(y, m - 1, d ?? 1));
  return new Intl.DateTimeFormat(INTL[locale], d ? { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } : { month: "long", year: "numeric", timeZone: "UTC" }).format(value);
}

/**
 * Una entrada es «próxima» si su día aún no ha llegado; si solo tiene mes, si ese mes aún no ha
 * empezado. `today` en formato AAAA-MM-DD.
 */
export function isUpcoming(date: string, today: string): boolean {
  return (date.length === 7 ? `${date}-01` : date) > today;
}
