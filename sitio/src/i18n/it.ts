import type { Dictionary } from "./es";

export const it: Dictionary = {
  meta: {
    title: "Atias · Conta il raccolto prima di raccoglierlo",
    description:
      "Un video per fila, girato con il telefono. Atias conta la frutta matura della serra e prevede i chili di ogni giorno e i raccoglitori necessari. Pilota in corso.",
  },
  nav: {
    home: "Home",
    company: "Chi siamo",
    product: "Prodotto",
    contact: "Contatti",
    vision: "Visione",
    pilot: "Pilota in corso",
    language: "Lingua",
    menu: "Menu",
    close: "Chiudi",
    skip: "Vai al contenuto",
  },
  cta: { demo: "Richiedi una demo", how: "Come funziona" },
  counter: {
    title: "Serra di esempio",
    sample: "Dati inventati per mostrare il metodo",
    position: "Avanza lungo la fila",
    replay: "Ricontare",
    tramo: "Fila",
    of: "di",
    ripe: "frutti maturi",
    kg: "kg previsti",
    range: "Tra {min} e {max} kg",
    workers: "raccoglitori",
    workersNote: "per raccoglierlo dal lunedì al venerdì",
    legendObserved: "Verde: ciò che il video ha contato",
    legendForecast: "Ambra: previsione, non ancora convalidata",
    legendRipe: "Frutto maturo",
    legendUnripe: "Frutto verde, non ancora contato",
    tally: "Ogni casella nera vale 500 frutti maturi contati",
  },
  home: {
    heroTitle: "Conta il raccolto prima di raccoglierlo.",
    heroLead:
      "Un video per fila, girato con il telefono il sabato. Atias conta la frutta matura tratto per tratto e ti dice quanti chili avrai dal lunedì al venerdì, con il loro margine, e quante persone serviranno per raccoglierli.",
    problemTitle: "Ogni settimana si vende e si assume a occhio.",
    problemBody: [
      "La cooperativa si impegna con i clienti su certi chili e chiama le squadre prima di sapere quanto maturerà.",
      "Se resta corta, non rispetta gli ordini. Se esagera, svende o paga giornate inutili. La previsione del tecnico aiuta, ma nessuno può percorrere ogni fila contando i frutti.",
    ],
    howTitle: "Da una fila filmata a una settimana pianificata.",
    steps: [
      {
        day: "Sabato",
        title: "Si filma",
        body: "Il produttore percorre ogni fila con il telefono, un video per lato. Se la connessione cade, il caricamento riprende da dove si era fermato.",
      },
      {
        day: "Domenica",
        title: "Si conta",
        body: "Atias verifica che il video sia utilizzabile e conta la frutta matura di ogni tratto della fila, ogni frutto una sola volta.",
      },
      {
        day: "Lunedì",
        title: "Si decide",
        body: "La cooperativa vede i chili di ogni giorno fino al venerdì, con il loro margine, e quanti raccoglitori le servono.",
      },
    ],
    howLink: "Scopri il prodotto in dettaglio",
    forTitle: "Per chi è.",
    audiences: [
      {
        who: "Cooperative e commercianti",
        what: "Impegnare vendite e squadre su una cifra verificabile, dal totale alla fila e dalla fila al suo video.",
      },
      {
        who: "Produttori",
        what: "Filmare con il telefono, senza nuovi apparecchi né password: un link personale per ogni settimana.",
      },
      {
        who: "Tecnici",
        what: "Mettere la loro previsione accanto a quella di Atias e al raccolto reale, giorno per giorno, per capire cosa non torna e dove.",
      },
      {
        who: "Investitori e partner",
        what: "Un vero progetto pilota in serre del sud della Spagna, con un metodo di convalida definito dal primo giorno.",
      },
    ],
    pilotTitle: "Cosa funziona già e cosa stiamo verificando.",
    pilotLead: "Atias è in fase pilota. Preferiamo mostrarti a che punto siamo piuttosto che prometterti una cifra non ancora misurata.",
    worksTitle: "Funziona",
    works: [
      "Caricamento dei video dal telefono, anche con scarsa copertura.",
      "Controllo automatico di luce, nitidezza e durata di ogni video.",
      "Temperatura reale ora per ora in ogni serra, confrontata con quella normale del periodo.",
      "Previsione giornaliera dal lunedì al venerdì, accanto a quella del tecnico.",
      "Pannello della cooperativa con chili, margini, raccoglitori e avvisi.",
    ],
    testingTitle: "Stiamo verificando",
    testing: [
      "Il rilevatore di frutti su video di serre reali.",
      "Quanto è preciso in chili. L'obiettivo è un errore massimo del 10 %, non ancora misurato.",
      "Il peso medio per frutto di ogni varietà.",
      "Quanta frutta resta nascosta dalle foglie.",
    ],
    closeTitle: "Guardiamo le vostre serre?",
    closeBody: "Ti mostriamo il pilota in una chiamata di venti minuti e vediamo se si adatta al vostro modo di lavorare.",
  },
  company: {
    title: "Chi siamo",
    pending: "Testo provvisorio, in attesa di revisione da parte dell'azienda.",
    lead: "Lavoriamo perché la previsione del raccolto nasca dalla frutta sulla pianta, non dall'intuito.",
    body: [
      "Atias nasce nel sud della Spagna, tra serre di ortaggi per l'esportazione. Lì, ogni settimana, qualcuno deve decidere quanti chili vendere e quante persone chiamare, quasi sempre con una stima fatta a occhio.",
      "Il nostro lavoro è trasformare ciò che si può filmare con un telefono in una cifra utile per quella decisione: i chili di ogni giorno e i raccoglitori necessari, con il loro margine e la possibilità di verificarne l'origine.",
      "Lavoriamo insieme a cooperative, tecnici e produttori, e lo proviamo nelle loro serre prima di considerarlo pronto.",
    ],
    principlesTitle: "Come lavoriamo",
    principles: [
      {
        name: "Ogni cifra con il suo margine",
        body: "Una previsione senza margine mostra più certezza di quella che ha. Le nostre lo hanno sempre.",
      },
      {
        name: "Ciò che è provato, separato da ciò che non lo è",
        body: "Ciò che è ancora in prova viene detto chiaramente. Non presentiamo mai come sicuro qualcosa che non abbiamo misurato.",
      },
      {
        name: "Il lavoro del produttore non va perso",
        body: "Filmare richiede tempo. Una cattiva connessione ritarda il caricamento, ma non obbliga a rifarlo.",
      },
      {
        name: "I dati di ciascuno restano suoi",
        body: "Ogni produttore vede solo i propri, e i video vengono cancellati quando non servono più.",
      },
    ],
  },
  product: {
    title: "Il prodotto",
    lead: "Atias unisce tre cose: ciò che si vede nel video, ciò che fa il clima e ciò che la cooperativa sa già.",
    sections: [
      {
        title: "Filmare",
        body: "Il produttore riceve un link personale per ogni settimana. Filma ogni fila con il telefono, un video per lato, camminando lentamente. Il caricamento riprende da solo se la connessione cade, e ogni video viene controllato all'arrivo: se è buio, mosso o troppo corto, si chiede di rifarlo.",
      },
      {
        title: "Contare",
        body: "Un rilevatore addestrato individua ogni frutto e lo segue tra i fotogrammi per contarlo una sola volta. La fila è divisa in tratti, e ogni frutto è assegnato al suo in base a quanto è avanzata la telecamera. La maturazione si valuta dal colore per pomodoro e peperone, e dal calibro per il cetriolo.",
      },
      {
        title: "Prevedere",
        body: "I frutti diventano chili con il peso medio di ogni varietà. Ciò che maturerà durante la settimana dipende dal caldo: Atias usa la temperatura reale ora per ora di ogni serra e la confronta con quella normale per quelle date. Il risultato si distribuisce dal lunedì al venerdì, sempre con il suo margine.",
      },
      {
        title: "Pianificare",
        body: "Con i chili previsti e ciò che una persona raccoglie in una giornata, Atias calcola i raccoglitori per ogni famiglia di coltura. La cooperativa regola i parametri e vede subito il risultato.",
      },
      {
        title: "Verificare",
        body: "Ogni settimana la previsione di Atias viene confrontata con quella del tecnico e con quanto raccolto davvero. Giorno per giorno si vede chi si avvicina di più e dove correggere.",
      },
    ],
    panelTitle: "Il pannello della cooperativa",
    panelBody:
      "Riepilogo settimanale, previsione giornaliera, dettaglio di ogni serra fino al tratto di fila, video ricevuti, link per i produttori, raccolto reale e raccoglitori.",
    panelCaption: "Pannello della cooperativa con dati di esempio.",
    cropsTitle: "Colture",
    crops: ["Pomodoro ciliegino", "Peperone", "Cetriolo"],
    cropsNote: "Sono le colture del pilota. Ogni nuova coltura richiede un proprio addestramento e una propria convalida.",
    dataTitle: "Sicurezza e dati",
    data: [
      "Ogni link apre solo la sua serra e la sua settimana, scade da solo e si può revocare.",
      "La cooperativa accede con il proprio account. Le password sono salvate cifrate.",
      "I video sostituiti o rimossi vengono cancellati dopo sette giorni.",
    ],
  },
  contact: {
    title: "Contatti",
    lead: "Raccontaci chi sei e cosa coltivi. Ti scriveremo per mostrarti il pilota.",
    name: "Nome",
    organization: "Azienda o cooperativa",
    role: "Sei",
    roles: ["Cooperativa o commerciante", "Produttore", "Tecnico", "Investitore o partner", "Altro"],
    email: "E-mail",
    phone: "Telefono (facoltativo)",
    message: "Cosa ti piacerebbe vedere?",
    consent: "Ho letto l'informativa sulla privacy e accetto che usiate questi dati per rispondermi.",
    privacyLink: "informativa sulla privacy",
    submit: "Invia la richiesta",
    sending: "Invio…",
    sent: "Ricevuto. Ti scriveremo entro qualche giorno.",
    error: "Non è stato possibile inviare. Riprova tra un momento.",
    inactive:
      "Il modulo non è ancora attivo: manca l'indirizzo che riceve le richieste. Nel frattempo non viene inviato alcun dato.",
    required: "Obbligatorio",
    invalidEmail: "Controlla l'e-mail: sembra incompleta.",
    consentRequired: "Ci serve il tuo permesso per risponderti.",
    directTitle: "Puoi anche scriverci",
    directEmail: "Indirizzo di contatto in arrivo",
  },
  legal: {
    noticeTitle: "Note legali",
    privacyTitle: "Informativa sulla privacy",
    pending: "Da completare",
    draft: "Bozza senza valore legale finché l'azienda non completa i dati indicati e un consulente non la rivede.",
    notice: [
      {
        heading: "Titolare",
        body: "Questo sito appartiene a {titular}, codice fiscale {nif}, con sede in {domicilio}. E-mail di contatto: {correo}.",
      },
      {
        heading: "Oggetto",
        body: "Il sito presenta Atias, un sistema di previsione del raccolto in serra in fase pilota, e permette di richiedere una demo.",
      },
      {
        heading: "Proprietà intellettuale",
        body: "I testi, il design e il codice di questo sito appartengono al titolare salvo diversa indicazione. Non possono essere riprodotti senza permesso.",
      },
      {
        heading: "Responsabilità",
        body: "Le informazioni sul prodotto descrivono un pilota in corso e possono cambiare. Nessuna cifra mostrata come esempio proviene da clienti reali.",
      },
    ],
    privacy: [
      {
        heading: "Titolare del trattamento",
        body: "{titular}, codice fiscale {nif}. E-mail per qualsiasi questione di privacy: {correo}.",
      },
      {
        heading: "Quali dati e perché",
        body: "Solo quelli che scrivi nel modulo (nome, azienda, profilo, e-mail, telefono se lo indichi e messaggio), per risponderti e organizzare una demo. Non li usiamo per nient'altro.",
      },
      {
        heading: "Base giuridica",
        body: "Il tuo consenso, che dai inviando il modulo e puoi revocare in qualsiasi momento.",
      },
      {
        heading: "Per quanto tempo",
        body: "Per la durata della nostra conversazione e al massimo un anno dopo l'ultimo contatto, salvo che tu chieda prima di cancellarli.",
      },
      {
        heading: "Con chi si condividono",
        body: "Con nessuno, tranne il fornitore che riceve il modulo per nostro conto: {proveedor}.",
      },
      {
        heading: "I tuoi diritti",
        body: "Puoi chiedere accesso, rettifica, cancellazione, opposizione, limitazione e portabilità scrivendo a {correo}. Puoi anche presentare reclamo all'Agenzia spagnola per la protezione dei dati (aepd.es).",
      },
      {
        heading: "Cookie",
        body: "Questo sito non usa cookie né strumenti di tracciamento. Se cambierà, lo indicheremo qui e ti chiederemo il permesso.",
      },
    ],
  },
  footer: {
    rights: "Atias · Previsione del raccolto da video",
    notice: "Note legali",
    privacy: "Privacy",
    noCookies: "Nessun cookie, nessun tracciamento.",
  },
  root: { choose: "Scegli la lingua" },
};
