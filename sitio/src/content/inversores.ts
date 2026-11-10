/**
 * Textos de la página para inversores y socios, en los seis idiomas (pendientes de revisión nativa).
 * Reglas: sin tamaño de mercado ni cifras sin fuente, sin cantidades de inversión, sin resultados de
 * precisión hasta que estén medidos, sin nombrar la empresa del piloto ni a su fundador.
 * «Por qué ahora», los datos clave y la hoja de ruta se reutilizan de Quiénes somos y Visión.
 */
import type { Locale } from "@/i18n/config";

type Item = { name: string; body: string };

export type InvestorsText = {
  eyebrow: string;
  title: string;
  lead: string;
  problemTitle: string;
  problem: string[];
  solutionTitle: string;
  solution: Item[];
  solutionLink: string;
  visionTitle: string;
  visionLead: string;
  visionLink: string;
  statusTitle: string;
  statusLead: string;
  honestyTitle: string;
  honestyBody: string;
  seekTitle: string;
  seekLead: string;
  seek: Item[];
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
};

export const INVERSORES: Record<Locale, InvestorsText> = {
  es: {
    eyebrow: "Inversores y socios",
    title: "Contar la cosecha es solo el principio.",
    lead: "Atias empieza por la pregunta que se repite cada semana en el invernadero, cuántos kilos habrá, y quiere acabar respondiendo a todas: plagas, riego, nutrición y clima.",
    problemTitle: "El problema",
    problem: [
      "Cada semana, la cooperativa compromete kilos con sus clientes y llama a sus cuadrillas antes de saber cuánto va a madurar. La cifra sale de una estimación a ojo.",
      "Si se queda corta, incumple. Si se pasa, malvende o paga jornales de más. Nadie puede recorrer cada hilera contando fruta.",
    ],
    solutionTitle: "La solución",
    solution: [
      { name: "Se graba", body: "El agricultor graba un vídeo por hilera con el móvil, sin marcadores ni equipos especiales." },
      { name: "Se cuenta", body: "La visión artificial cuenta cada fruto maduro, tramo a tramo." },
      { name: "Se decide", body: "La cooperativa ve los kilos de cada día, con su margen, y los temporeros necesarios." },
    ],
    solutionLink: "Cómo funciona el producto",
    visionTitle: "A dónde vamos",
    visionLead: "La misma cámara que cuenta la fruta puede ver plagas, enfermedades y el estado de cada planta. Cada versión se gana con la anterior, y en todas Atias recomienda y el técnico decide.",
    visionLink: "Ver la hoja de ruta completa",
    statusTitle: "En qué punto estamos",
    statusLead: "La aplicación funciona de principio a fin y la estamos probando en un invernadero real del sur de España.",
    honestyTitle: "Lo que todavía no contamos",
    honestyBody: "No publicamos cifras de precisión hasta medirlas frente a la báscula durante al menos 8 semanas. Cuando las tengamos, las verás aquí con su método, salgan como salgan.",
    seekTitle: "Qué buscamos",
    seekLead: "Gente que quiera llevar Atias a su primera temporada.",
    seek: [
      { name: "Inversión", body: "Para pasar del piloto a una temporada completa en varios invernaderos." },
      { name: "Socios del sector", body: "Cooperativas, comercializadoras y técnicos con los que probar y mejorar Atias." },
      { name: "Socios tecnológicos", body: "Visión artificial, sensores, cámaras sobre raíl y nube." },
    ],
    ctaTitle: "¿Hablamos?",
    ctaBody: "Cuéntanos qué te interesa y te enseñamos el piloto en una llamada.",
    ctaButton: "Escríbenos",
  },
  en: {
    eyebrow: "Investors and partners",
    title: "Counting the harvest is only the beginning.",
    lead: "Atias starts with the question asked every week in the greenhouse, how many kilos there will be, and aims to end up answering all of them: pests, irrigation, nutrition and climate.",
    problemTitle: "The problem",
    problem: [
      "Every week, the cooperative commits kilos to its customers and calls in its crews before knowing how much will ripen. The figure comes from an estimate made by eye.",
      "If it falls short, the cooperative fails to deliver. If it overshoots, it sells cheap or pays for too many workdays. Nobody can walk every row counting fruit.",
    ],
    solutionTitle: "The solution",
    solution: [
      { name: "Film", body: "The grower films one video per row on a phone, with no markers or special equipment." },
      { name: "Count", body: "Computer vision counts every ripe fruit, section by section." },
      { name: "Decide", body: "The cooperative sees each day’s kilos, with their margin, and the pickers needed." },
    ],
    solutionLink: "How the product works",
    visionTitle: "Where we are going",
    visionLead: "The same camera that counts fruit can spot pests, diseases and the condition of every plant. Each version is earned by the one before, and in all of them Atias recommends and the agronomist decides.",
    visionLink: "See the full roadmap",
    statusTitle: "Where we are",
    statusLead: "The app works end to end and we are testing it in a real greenhouse in southern Spain.",
    honestyTitle: "What we are not telling you yet",
    honestyBody: "We do not publish accuracy figures until we have measured them against the scales for at least 8 weeks. When we have them, you will see them here with their method, whatever they turn out to be.",
    seekTitle: "What we are looking for",
    seekLead: "People who want to take Atias to its first season.",
    seek: [
      { name: "Investment", body: "To move from the pilot to a full season in several greenhouses." },
      { name: "Industry partners", body: "Cooperatives, marketers and agronomists to test and improve Atias with." },
      { name: "Technology partners", body: "Computer vision, sensors, rail-mounted cameras and cloud." },
    ],
    ctaTitle: "Shall we talk?",
    ctaBody: "Tell us what interests you and we will show you the pilot on a call.",
    ctaButton: "Write to us",
  },
  fr: {
    eyebrow: "Investisseurs et partenaires",
    title: "Compter la récolte n’est que le début.",
    lead: "Atias commence par la question posée chaque semaine en serre, combien de kilos il y aura, et veut finir par répondre à toutes : ravageurs, irrigation, nutrition et climat.",
    problemTitle: "Le problème",
    problem: [
      "Chaque semaine, la coopérative engage des kilos auprès de ses clients et appelle ses équipes avant de savoir combien va mûrir. Le chiffre vient d’une estimation à l’œil.",
      "S’il est trop bas, elle ne tient pas ses engagements. S’il est trop haut, elle brade ou paie des journées en trop. Personne ne peut parcourir chaque rang en comptant les fruits.",
    ],
    solutionTitle: "La solution",
    solution: [
      { name: "On filme", body: "Le producteur filme une vidéo par rang au téléphone, sans marqueurs ni équipement spécial." },
      { name: "On compte", body: "La vision par ordinateur compte chaque fruit mûr, tronçon par tronçon." },
      { name: "On décide", body: "La coopérative voit les kilos de chaque jour, avec leur marge, et les saisonniers nécessaires." },
    ],
    solutionLink: "Comment fonctionne le produit",
    visionTitle: "Où nous allons",
    visionLead: "La même caméra qui compte les fruits peut voir les ravageurs, les maladies et l’état de chaque plante. Chaque version se mérite par la précédente, et dans toutes Atias recommande et le technicien décide.",
    visionLink: "Voir la feuille de route complète",
    statusTitle: "Où nous en sommes",
    statusLead: "L’application fonctionne de bout en bout et nous la testons dans une vraie serre du sud de l’Espagne.",
    honestyTitle: "Ce que nous ne disons pas encore",
    honestyBody: "Nous ne publions pas de chiffres de précision avant de les avoir mesurés face à la balance pendant au moins 8 semaines. Quand nous les aurons, vous les verrez ici avec leur méthode, quels qu’ils soient.",
    seekTitle: "Ce que nous cherchons",
    seekLead: "Des personnes qui veulent mener Atias à sa première saison.",
    seek: [
      { name: "Investissement", body: "Pour passer du pilote à une saison complète dans plusieurs serres." },
      { name: "Partenaires du secteur", body: "Coopératives, expéditeurs et techniciens avec qui tester et améliorer Atias." },
      { name: "Partenaires technologiques", body: "Vision par ordinateur, capteurs, caméras sur rail et cloud." },
    ],
    ctaTitle: "On en parle ?",
    ctaBody: "Dites-nous ce qui vous intéresse et nous vous montrons le pilote lors d’un appel.",
    ctaButton: "Écrivez-nous",
  },
  nl: {
    eyebrow: "Investeerders en partners",
    title: "De oogst tellen is pas het begin.",
    lead: "Atias begint bij de vraag die elke week in de kas terugkomt, hoeveel kilo er zal zijn, en wil uiteindelijk ze allemaal beantwoorden: plagen, irrigatie, voeding en klimaat.",
    problemTitle: "Het probleem",
    problem: [
      "Elke week belooft de coöperatie kilo’s aan haar klanten en roept ze ploegen op voordat ze weet hoeveel er rijp wordt. Het cijfer komt uit een schatting op het oog.",
      "Valt het te laag uit, dan kan ze niet leveren. Valt het te hoog uit, dan verkoopt ze te goedkoop of betaalt ze te veel werkdagen. Niemand kan elke rij aflopen en fruit tellen.",
    ],
    solutionTitle: "De oplossing",
    solution: [
      { name: "Filmen", body: "De teler filmt één video per rij met de telefoon, zonder markeringen of speciale apparatuur." },
      { name: "Tellen", body: "Computervisie telt elke rijpe vrucht, deel voor deel." },
      { name: "Beslissen", body: "De coöperatie ziet de kilo’s van elke dag, met hun marge, en de benodigde plukkers." },
    ],
    solutionLink: "Hoe het product werkt",
    visionTitle: "Waar we naartoe gaan",
    visionLead: "Dezelfde camera die het fruit telt, kan plagen, ziekten en de toestand van elke plant zien. Elke versie wordt verdiend met de vorige, en in alle versies adviseert Atias en beslist de teeltadviseur.",
    visionLink: "Bekijk de volledige roadmap",
    statusTitle: "Waar we staan",
    statusLead: "De app werkt van begin tot eind en we testen hem in een echte kas in Zuid-Spanje.",
    honestyTitle: "Wat we nog niet vertellen",
    honestyBody: "We publiceren geen nauwkeurigheidscijfers voordat we ze minstens 8 weken tegen de weegschaal hebben gemeten. Zodra we ze hebben, ziet u ze hier met hun methode, hoe ze ook uitvallen.",
    seekTitle: "Wat we zoeken",
    seekLead: "Mensen die Atias naar zijn eerste seizoen willen brengen.",
    seek: [
      { name: "Investering", body: "Om van de pilot naar een volledig seizoen in meerdere kassen te gaan." },
      { name: "Partners uit de sector", body: "Coöperaties, handelaren en teeltadviseurs om Atias mee te testen en te verbeteren." },
      { name: "Technologiepartners", body: "Computervisie, sensoren, camera’s op een rail en cloud." },
    ],
    ctaTitle: "Zullen we praten?",
    ctaBody: "Vertel ons wat u interesseert en we laten u de pilot zien in een gesprek.",
    ctaButton: "Schrijf ons",
  },
  it: {
    eyebrow: "Investitori e partner",
    title: "Contare il raccolto è solo l’inizio.",
    lead: "Atias parte dalla domanda che si ripete ogni settimana in serra, quanti chili ci saranno, e vuole arrivare a rispondere a tutte: parassiti, irrigazione, nutrizione e clima.",
    problemTitle: "Il problema",
    problem: [
      "Ogni settimana la cooperativa impegna chili con i clienti e chiama le squadre prima di sapere quanto maturerà. La cifra viene da una stima a occhio.",
      "Se è troppo bassa, non rispetta gli impegni. Se è troppo alta, svende o paga giornate in più. Nessuno può percorrere ogni fila contando la frutta.",
    ],
    solutionTitle: "La soluzione",
    solution: [
      { name: "Si riprende", body: "L’agricoltore gira un video per fila con il telefono, senza marcatori né attrezzature speciali." },
      { name: "Si conta", body: "La visione artificiale conta ogni frutto maturo, tratto per tratto." },
      { name: "Si decide", body: "La cooperativa vede i chili di ogni giorno, con il loro margine, e i braccianti necessari." },
    ],
    solutionLink: "Come funziona il prodotto",
    visionTitle: "Dove andiamo",
    visionLead: "La stessa telecamera che conta la frutta può vedere parassiti, malattie e lo stato di ogni pianta. Ogni versione si conquista con la precedente, e in tutte Atias consiglia e il tecnico decide.",
    visionLink: "Vedi la roadmap completa",
    statusTitle: "A che punto siamo",
    statusLead: "L’app funziona dall’inizio alla fine e la stiamo provando in una serra vera del sud della Spagna.",
    honestyTitle: "Quello che non diciamo ancora",
    honestyBody: "Non pubblichiamo cifre di precisione prima di averle misurate rispetto alla bilancia per almeno 8 settimane. Quando le avremo, le vedrai qui con il loro metodo, comunque vadano.",
    seekTitle: "Cosa cerchiamo",
    seekLead: "Persone che vogliano portare Atias alla sua prima stagione.",
    seek: [
      { name: "Investimento", body: "Per passare dal pilota a una stagione completa in diverse serre." },
      { name: "Partner del settore", body: "Cooperative, commercianti e tecnici con cui provare e migliorare Atias." },
      { name: "Partner tecnologici", body: "Visione artificiale, sensori, telecamere su binario e cloud." },
    ],
    ctaTitle: "Ne parliamo?",
    ctaBody: "Raccontaci cosa ti interessa e ti mostriamo il pilota in una chiamata.",
    ctaButton: "Scrivici",
  },
  pt: {
    eyebrow: "Investidores e parceiros",
    title: "Contar a colheita é só o começo.",
    lead: "A Atias começa pela pergunta que se repete todas as semanas na estufa, quantos quilos vai haver, e quer acabar por responder a todas: pragas, rega, nutrição e clima.",
    problemTitle: "O problema",
    problem: [
      "Todas as semanas, a cooperativa compromete quilos com os clientes e chama as equipas antes de saber quanto vai amadurecer. O número sai de uma estimativa a olho.",
      "Se fica curto, falha os compromissos. Se passa, vende barato ou paga jornas a mais. Ninguém consegue percorrer cada linha a contar fruta.",
    ],
    solutionTitle: "A solução",
    solution: [
      { name: "Grava-se", body: "O agricultor grava um vídeo por linha com o telemóvel, sem marcadores nem equipamento especial." },
      { name: "Conta-se", body: "A visão artificial conta cada fruto maduro, troço a troço." },
      { name: "Decide-se", body: "A cooperativa vê os quilos de cada dia, com a sua margem, e os trabalhadores necessários." },
    ],
    solutionLink: "Como funciona o produto",
    visionTitle: "Para onde vamos",
    visionLead: "A mesma câmara que conta a fruta pode ver pragas, doenças e o estado de cada planta. Cada versão conquista-se com a anterior, e em todas a Atias recomenda e o técnico decide.",
    visionLink: "Ver o roteiro completo",
    statusTitle: "Em que ponto estamos",
    statusLead: "A aplicação funciona do princípio ao fim e estamos a testá-la numa estufa real do sul de Espanha.",
    honestyTitle: "O que ainda não contamos",
    honestyBody: "Não publicamos números de precisão antes de os medir face à balança durante pelo menos 8 semanas. Quando os tivermos, vê-los-á aqui com o seu método, sejam eles quais forem.",
    seekTitle: "O que procuramos",
    seekLead: "Pessoas que queiram levar a Atias à sua primeira campanha.",
    seek: [
      { name: "Investimento", body: "Para passar do piloto a uma campanha completa em várias estufas." },
      { name: "Parceiros do setor", body: "Cooperativas, comercializadoras e técnicos com quem testar e melhorar a Atias." },
      { name: "Parceiros tecnológicos", body: "Visão artificial, sensores, câmaras sobre carril e nuvem." },
    ],
    ctaTitle: "Falamos?",
    ctaBody: "Conte-nos o que lhe interessa e mostramos-lhe o piloto numa chamada.",
    ctaButton: "Escreva-nos",
  },
};
