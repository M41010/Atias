import type { Content } from "./es";

/** Italiano. Da far rivedere a un madrelingua prima della pubblicazione. */
export const contentIt: Content = {
  seo: {
    home: {
      title: "Previsione del raccolto in serra con video | Atias",
      description:
        "Atias conta i frutti maturi da un video per fila girato con il telefono e prevede i chili di ogni giorno e gli stagionali necessari. Pilota in corso.",
    },
    company: {
      title: "Chi siamo · Previsione del raccolto in serra | Atias",
      description:
        "Atias nasce nel sud della Spagna perché la previsione del raccolto orticolo parta dai frutti sulla pianta, con il suo margine e verificabile.",
    },
    product: {
      title: "Stima del raccolto con visione artificiale | Atias",
      description:
        "Riprendere con il telefono, contare ogni frutto con la visione artificiale, prevedere i chili dal lunedì al venerdì e pianificare gli stagionali: ecco Atias.",
    },
    contact: {
      title: "Richiedi una demo di Atias | Previsione del raccolto",
      description:
        "Raccontaci cosa coltivi e ti mostriamo il pilota di Atias in una chiamata di venti minuti: stima del raccolto e stagionali a partire dal video.",
    },
    guide: {
      title: "Stima del raccolto in serra: metodi ed errori | Atias",
      description:
        "Che cos'è la stima del raccolto, come si fa oggi in serra (a occhio, a campione, con lo storico), perché sbaglia e come aiuta contare i frutti in video.",
    },
    faq: {
      title: "Domande frequenti sulla previsione del raccolto | Atias",
      description:
        "Colture, riprese con il telefono, precisione, stagionali, dati e pilota: risposte chiare su come funziona la previsione del raccolto di Atias.",
    },
    crops: {
      title: "Previsione del raccolto per coltura in serra | Atias",
      description:
        "Stima del raccolto di pomodoro ciliegino, peperone e cetriolo in serra con visione artificiale: cosa conta Atias e cosa è ancora in prova.",
    },
    vision: {
      "title": "Visione: dal contare i frutti al curare la serra | Atias",
      "description": "Dove va Atias: dalla previsione del raccolto alla difesa delle piante e allo stato della coltura, versione dopo versione. Atias consiglia, il tecnico decide."
    },
    measure: {
      title: "Come misuriamo la precisione delle previsioni | Atias",
      description: "Confrontiamo ogni previsione con i chili pesati sulla bilancia, insieme a quella dell’agricoltore e del tecnico. Metodo, criterio del 10 % e cosa è ancora in prova.",
    },
    notice: { title: "Note legali | Atias", description: "Note legali del sito di Atias." },
    privacy: { title: "Informativa sulla privacy | Atias", description: "Informativa sulla privacy del sito di Atias." },
  },
  links: {
    heroEyebrow: "Previsione del raccolto in serra",
    guide: "Guida alla stima del raccolto",
    faq: "Domande frequenti",
    crops: "Colture",
    guideTeaser: "Come si stima oggi il raccolto e perché sbaglia",
    faqTeaser: "Le risposte alle domande più comuni",
    cropTeaser: "Vedi la pagina della coltura",
    vision: "Visione",
    measure: "Come misuriamo",
    breadcrumb: "Percorso di navigazione",
  },
  guide: {
    eyebrow: "Guida",
    title: "Stima del raccolto in serra: come si fa e perché sbaglia",
    lead: "La stima decide quanti chili si vendono e quante persone si assumono ogni settimana. Passiamo in rassegna i metodi abituali, i loro limiti e cosa cambia contando i frutti in video.",
    updated: "Aggiornato a novembre 2026",
    date: "2026-11-09",
    sections: [
      {
        heading: "Che cos'è la stima del raccolto",
        paragraphs: [
          "La stima del raccolto è la previsione, prima della raccolta, di quanti chili produrrà un'azienda o una serra in un periodo. Gli ortaggi in serra si raccolgono più volte a settimana, quindi anche la stima è settimanale: quanti chili ci saranno ogni giorno dal lunedì al venerdì.",
          "Da quel numero dipendono tre decisioni: quanto si promette ai clienti, quanti stagionali si chiamano e quanti imballaggi, camion e turni di magazzino si preparano.",
        ],
      },
      {
        heading: "Come si fa oggi",
        paragraphs: [
          "A occhio: il tecnico o l'agricoltore percorre la serra e stima la produzione in base all'esperienza. È rapido e sfrutta molta conoscenza, ma dipende da chi lo fa e da quanto riesce a percorrere.",
          "A campione: si contano i frutti di alcune piante e si moltiplica per il totale. È più oggettivo, ma poche piante raramente rappresentano tutta la serra, e contare a mano richiede tempo.",
          "Con lo storico: si parte da quanto raccolto nelle campagne precedenti nelle stesse date. È un riferimento utile, ma non vede cosa succede quest'anno sulla pianta.",
          "Con il clima: il caldo accelera la maturazione, e alcuni modelli correggono la previsione con la temperatura accumulata. Affinano il ritmo, ma devono sapere quanti frutti ci sono in partenza.",
        ],
      },
      {
        heading: "Perché la stima sbaglia",
        paragraphs: [
          "La produzione non è uguale in tutta la serra: cambia da una fila all'altra e all'interno della stessa fila. Una stima che guarda solo una parte porta quell'errore sul totale.",
          "Parte dei frutti è nascosta dalle foglie, e quelli che stanno per cambiare colore sfuggono facilmente. Inoltre, una settimana più calda del normale anticipa la maturazione e manda all'aria una previsione fatta con giornate miti.",
          "E quasi mai si misura quanto si è indovinato: senza confrontare la previsione con quanto raccolto ogni giorno, non si sa dove sbaglia né come correggerla.",
        ],
      },
      {
        heading: "Cosa cambia contando in video",
        paragraphs: [
          "Con un video per fila, girato con il telefono camminando piano, si possono contare tutti i frutti visibili e non solo un campione. Un rilevatore di visione artificiale individua ogni frutto e lo segue da un fotogramma all'altro per contarlo una sola volta, assegnandolo al tratto di fila che la telecamera stava attraversando.",
          "I frutti si convertono in chili con il peso medio di ogni varietà, e la temperatura reale di ogni serra, ora per ora, indica quanto maturerà durante la settimana. Il risultato è una previsione giornaliera con il suo margine, che si può seguire dal totale alla fila e dalla fila al suo video.",
          "Non è magia: alcuni frutti la telecamera non li vede e il peso medio varia. Per questo qualsiasi sistema di questo tipo va confrontato ogni settimana con il raccolto reale prima di fidarsene.",
        ],
      },
      {
        heading: "Come capire se una previsione funziona",
        paragraphs: [
          "Chiedi che ogni numero abbia il suo margine e confrontalo, giorno per giorno, con quanto si raccoglie davvero. Guarda l'errore in chili al giorno e alla settimana, e confrontalo con la previsione che usi già, per esempio quella del tecnico.",
          "Una buona previsione non è quella che indovina una settimana, ma quella che resta vicina in modo stabile e spiega da dove viene ogni numero.",
        ],
      },
      {
        heading: "Dalla stima agli stagionali",
        paragraphs: [
          "Con i chili previsti per ogni giorno e quanto raccoglie una persona in una giornata per ogni coltura, si calcola quanti stagionali servono. Se la stima è affidabile, la squadra si adatta ai frutti presenti: niente giornate pagate in più, niente frutti lasciati sulla pianta.",
        ],
      },
    ],
    ctaTitle: "Vuoi vedere come lo fa Atias?",
    ctaBody: "Ti mostriamo il pilota con dati di esempio e ti raccontiamo cosa stiamo verificando con il raccolto reale.",
  },
  faq: {
    title: "Domande frequenti",
    lead: "Quello che cooperative, agricoltori e tecnici ci chiedono più spesso sulla previsione del raccolto da video.",
    items: [
      {
        q: "Che cos'è Atias?",
        a: "Un sistema di previsione del raccolto per la serra. Da un video per fila girato con il telefono, conta i frutti maturi, prevede i chili di ogni giorno dal lunedì al venerdì con il loro margine e calcola quanti stagionali serviranno.",
      },
      {
        q: "Bisogna comprare telecamere o sensori?",
        a: "No. L'agricoltore riprende con il proprio telefono tramite un link personale che riceve ogni settimana. Non si installa nulla in serra e non servono password.",
      },
      {
        q: "Come si riprende ogni fila?",
        a: "Camminando piano lungo il corridoio, un video per ogni lato della fila. Al caricamento, Atias controlla luce, nitidezza e durata, e avvisa se bisogna ripetere.",
      },
      {
        q: "Per quali colture funziona?",
        a: "Il pilota riguarda pomodoro ciliegino, peperone e cetriolo. Ogni nuova coltura richiede il proprio addestramento e la propria validazione prima di essere offerta.",
      },
      {
        q: "Quanto è preciso?",
        a: "Non l'abbiamo ancora misurato con un raccolto reale, e non daremo un numero prima di farlo. L'obiettivo è un errore massimo del 10 % in chili. Ogni previsione ha il suo margine e viene confrontata ogni settimana con il raccolto.",
      },
      {
        q: "Come calcola gli stagionali?",
        a: "Divide i chili previsti per ogni giorno per quanto raccoglie una persona in una giornata per ogni famiglia di colture. La cooperativa può regolare questa resa e vede subito il risultato.",
      },
      {
        q: "Sostituisce il tecnico?",
        a: "No. La sua previsione viene affiancata a quella di Atias e al raccolto reale, giorno per giorno, per vedere chi si avvicina di più e dove correggere. La conoscenza del tecnico resta fondamentale.",
      },
      {
        q: "E se in serra la copertura è scarsa?",
        a: "Il caricamento riprende da solo da dove si era fermato. Una connessione scarsa ritarda l'invio, ma non obbliga mai a riprendere di nuovo.",
      },
      {
        q: "Cosa succede ai video e ai dati?",
        a: "Ogni agricoltore vede solo i propri, e ogni link scade e si può revocare. I video sostituiti o rimossi vengono cancellati dopo sette giorni. Questo sito non usa cookie né tracciamento.",
      },
      {
        q: "Come posso provarlo?",
        a: "Richiedi una demo dalla pagina dei contatti. Ti mostriamo il pilota in una chiamata di venti minuti e vediamo se si adatta al vostro modo di lavorare.",
      },
    ],
  },
  cropsHub: {
    title: "Previsione del raccolto per coltura",
    lead: "Ogni coltura matura, si nasconde tra le foglie e si raccoglie a modo suo. Queste sono le colture del pilota di Atias.",
    note: "Ogni nuova coltura richiede il proprio addestramento e la propria validazione prima di essere offerta.",
  },
  crops: {
    "tomate-cherry": {
      name: "Pomodoro ciliegino",
      title: "Stima del raccolto di pomodoro ciliegino in serra",
      seoTitle: "Stima del raccolto di pomodoro ciliegino con video | Atias",
      seoDescription:
        "Previsione del raccolto di pomodoro ciliegino: Atias conta i frutti maturi di ogni grappolo e tratto di fila con la visione artificiale e prevede i chili.",
      lead: "Tanti frutti piccoli, a grappoli e ad altezze diverse: il pomodoro ciliegino è tra le colture più difficili da stimare a occhio.",
      sections: [
        {
          heading: "Cosa complica la stima",
          body: "Un grappolo riunisce frutti verdi, invaiati e maturi insieme, e molti restano nascosti dalle foglie o da altri frutti. Contare a mano poche piante richiede tempo e raramente rappresenta tutta la fila.",
        },
        {
          heading: "Cosa conta Atias",
          body: "Il rilevatore individua ogni frutto nel video e ne decide la maturazione dal colore. Ogni frutto si conta una sola volta e si assegna al suo tratto di fila, così si vede dove si concentra la produzione.",
        },
        {
          heading: "Dai frutti ai chili",
          body: "I frutti maturi si convertono in chili con il peso medio della varietà, e la temperatura reale della serra indica quanti matureranno durante la settimana.",
        },
      ],
      testing: "Nel pilota stiamo verificando il peso medio per frutto di ogni varietà e quanta frutta resta nascosta dalle foglie.",
    },
    pimiento: {
      name: "Peperone",
      title: "Stima del raccolto di peperone in serra",
      seoTitle: "Stima del raccolto di peperone con video | Atias",
      seoDescription:
        "Previsione del raccolto di peperone: Atias conta i frutti di ogni tratto di fila con la visione artificiale, ne decide la maturazione dal colore e prevede i chili.",
      lead: "Frutti grandi e pesanti nascosti in un fogliame fitto: nel peperone, ogni frutto che sfugge alla stima pesa molto sui chili.",
      sections: [
        {
          heading: "Cosa complica la stima",
          body: "Il frutto cresce vicino al fusto e sotto le foglie, e il cambio di colore avanza a ritmi diversi secondo la pianta e il caldo. Pochi frutti per pianta cambiano molto il totale.",
        },
        {
          heading: "Cosa conta Atias",
          body: "Il rilevatore individua ogni peperone nel video di ciascun lato della fila, ne decide la maturazione dal colore e lo conta una sola volta anche se compare in più fotogrammi.",
        },
        {
          heading: "Dai frutti ai chili",
          body: "I frutti si convertono in chili con il peso medio della varietà. La temperatura reale della serra, ora per ora, indica quanto avanzerà il colore durante la settimana.",
        },
      ],
      testing: "Nel pilota stiamo verificando il peso medio per frutto e quanti frutti restano nascosti dietro le foglie.",
    },
    pepino: {
      name: "Cetriolo",
      title: "Stima del raccolto di cetriolo in serra",
      seoTitle: "Stima del raccolto di cetriolo con video | Atias",
      seoDescription:
        "Previsione del raccolto di cetriolo: Atias conta i cetrioli di ogni tratto di fila con la visione artificiale, riconosce quelli di calibro giusto e prevede i chili.",
      lead: "Il cetriolo cresce in fretta e si raccoglie quasi ogni giorno. E ha lo stesso verde delle foglie che lo circondano.",
      sections: [
        {
          heading: "Cosa complica la stima",
          body: "Un cetriolo passa da piccolo a pronto in pochi giorni, e il suo colore si confonde con il fogliame. La maturazione si vede dal calibro, non dal colore.",
        },
        {
          heading: "Cosa conta Atias",
          body: "Il rilevatore distingue il cetriolo dalle foglie e decide se è pronto in base al calibro. Ogni frutto si conta una sola volta e si assegna al suo tratto di fila.",
        },
        {
          heading: "Dai frutti ai chili",
          body: "I cetrioli di calibro giusto si convertono in chili con il peso medio della varietà, e il ritmo di crescita si corregge con la temperatura reale della serra.",
        },
      ],
      testing: "Nel pilota stiamo verificando il rilevatore con video di serre reali e il peso medio per frutto.",
    },
  },
  tour: {
    "eyebrow": "Il percorso",
    "title": "Scorri e percorri la fila con Atias",
    "hint": "Scorri per avanzare nella serra",
    "tag": "Ricostruzione animata",
    "counted": "frutti maturi contati",
    "steps": [
      {
        "label": "Pomodoro ciliegino",
        "title": "Frutto per frutto, grappolo per grappolo",
        "body": "La telecamera percorre la fila e segna ogni pomodoro maturo dal colore. Quelli verdi non contano ancora."
      },
      {
        "label": "Cetriolo",
        "title": "Nascosto tra foglie grandi",
        "body": "Distingue il cetriolo dalla pianta e decide dal calibro se è pronto."
      },
      {
        "label": "Peperone",
        "title": "Nel cespuglio basso e fitto",
        "body": "Conta ogni peperone maturo, rosso o giallo, tratto per tratto della fila."
      },
      {
        "label": "La cooperativa",
        "title": "Dalla fila ai chili",
        "body": "Quanto contato in ogni tratto diventa chili dal lunedì al venerdì, con il suo margine, e i raccoglitori necessari."
      },
      {
        "label": "Tutta la serra",
        "title": "E poi, curare la pianta",
        "body": "La stessa telecamera potrà vedere parassiti, malattie e lo stato di ogni pianta. Atias consiglia; il tecnico decide."
      }
    ]
  },
  results: {
    "eyebrow": "Risultati del pilota",
    "title": "Quello che abbiamo misurato sulla bilancia",
    "lead": "Misurato su {greenhouses} e {weeks}, confrontando ogni previsione con i chili raccolti.",
    "greenhouse": {
      "one": "1 serra",
      "other": "{n} serre"
    },
    "week": {
      "one": "1 settimana",
      "other": "{n} settimane"
    },
    "asOf": "Dati al {date}",
    "source": "Previsione",
    "error": "Errore sui chili della settimana",
    "bias": "Distorsione",
    "sources": {
      "atias": "Atias",
      "agricultor": "Agricoltore",
      "tecnico": "Tecnico"
    },
    "control": "Conteggio della telecamera rispetto al conteggio manuale nei tratti di controllo: {value} di differenza.",
    "method": "Errore: differenza tra previsione e raccolto, in percentuale dei chili raccolti. Distorsione positiva: sovrastima.",
    "caution": "Con meno di 8 settimane misurate, il risultato orienta ma non dimostra."
  },
  vision: {
    "eyebrow": "Visione",
    "title": "Dal contare i frutti al curare tutta la serra",
    "lead": "La stessa telecamera che conta i frutti maturi può vedere parassiti, malattie e lo stato di ogni pianta. Partiamo dal raccolto perché si verifica sulla bilancia; il resto arriva versione dopo versione.",
    "roadmapTitle": "Tabella di marcia",
    "roadmapLead": "Ogni versione si basa sulla precedente e inizia solo quando quella ha dimostrato di funzionare.",
    "versions": [
      {
        "version": "0.9",
        "name": "Pilota",
        "when": "Ora",
        "line": "Misurare la previsione del raccolto in serre reali rispetto a quanto raccolto.",
        "items": [
          "Un video per fila girato con il telefono",
          "Conteggio dei frutti maturi per tratto di fila",
          "Confronto con la previsione dell'agricoltore e del tecnico"
        ]
      },
      {
        "version": "1.0",
        "name": "Prima stagione",
        "when": "Dopo",
        "line": "La cooperativa usa Atias ogni settimana per decidere cosa vendere e chi assumere.",
        "items": [
          "Funzionamento nel cloud",
          "Collegamento al gestionale della cooperativa",
          "Precisione misurata settimana dopo settimana"
        ]
      },
      {
        "version": "1.x",
        "name": "Miglioramento continuo",
        "when": "Durante la stagione",
        "line": "Affinare la previsione con ciò che si impara ogni settimana.",
        "items": [
          "Sensori dentro la serra",
          "Avvisi quando manca una fila o un video non va bene",
          "Report settimanali"
        ]
      },
      {
        "version": "2.0",
        "name": "Senza riprese manuali",
        "when": "Più avanti",
        "line": "Nessuno deve più filmare e il raccolto del giorno si conosce prima della pesata.",
        "items": [
          "Una telecamera che percorre la fila su una rotaia",
          "I chili di ogni cassetta dei raccoglitori"
        ]
      },
      {
        "version": "3.0",
        "name": "Difesa delle piante",
        "when": "Più avanti",
        "line": "Trovare parassiti e malattie prima che si diffondano.",
        "items": [
          "Rilevamento sulla pianta e sulle trappole cromotropiche",
          "Mappa dei focolai per fila",
          "Avviso di rischio in base al clima e cosa fare in ogni zona"
        ]
      },
      {
        "version": "4.0",
        "name": "Stato della pianta",
        "when": "Più avanti",
        "line": "Sapere come sta ogni zona della coltura e come gestirla.",
        "items": [
          "Stress idrico e irrigazione",
          "Nutrizione",
          "Crescita, fioritura e allegagione",
          "Clima della serra"
        ]
      }
    ],
    "principleEyebrow": "Il nostro principio",
    "principleTitle": "Atias consiglia, il tecnico decide",
    "principleBody": "Atias non sostituisce nessuno: dà occhi su ogni fila a chi conosce la coltura. Le decisioni di vendita, trattamento e gestione restano alle persone.",
    "closeTitle": "Vuoi vedere il pilota?"
  },
  measure: {
    eyebrow: "Come misuriamo",
    title: "La precisione si misura sulla bilancia, non si promette",
    lead: "Quasi nessuno nel settore pubblica di quanto sbaglia la propria previsione. Noi pubblichiamo il metodo prima del risultato, perché chiunque possa verificarlo.",
    compareTitle: "Cosa confrontiamo",
    compare: [
      {
        name: "Atias prevede",
        body: "I chili che si raccoglieranno ogni giorno dal lunedì al venerdì, a partire dal video del sabato.",
      },
      {
        name: "Anche l’agricoltore e il tecnico",
        body: "Annotiamo la loro previsione prima della raccolta, giorno per giorno e separatamente.",
      },
      {
        name: "Decide la bilancia",
        body: "Ogni giorno si pesano i chili raccolti davvero.",
      },
      {
        name: "Confrontiamo le tre",
        body: "Ogni settimana si vede chi si è avvicinato di più al raccolto, e di quanto.",
      },
    ],
    metricsTitle: "Come calcoliamo l’errore",
    formula: "errore = |chili previsti − chili raccolti| ÷ chili raccolti",
    metrics: [
      {
        name: "Errore della settimana",
        body: "Si somma lo scarto di ogni serra e si divide per tutto il raccolto: così un raccolto piccolo non gonfia la percentuale.",
      },
      {
        name: "Distorsione",
        body: "Se la previsione tende a restare sotto o a superare. Una distorsione stabile si può correggere.",
      },
      {
        name: "Margine di confidenza",
        body: "Con poche settimane, l’errore reale può essere maggiore di quello misurato. Ne calcoliamo l’intervallo con il 90 % di confidenza.",
      },
      {
        name: "Settimane nell’obiettivo",
        body: "Quante settimane l’errore è rimasto al 10 % o meno.",
      },
    ],
    criteriaTitle: "Quando diciamo che il 10 % è raggiunto",
    criteriaLead: "Solo se si verificano tutte e quattro le condizioni:",
    criteria: [
      "Tutti i dati sono reali: niente di simulato nei video, nei parametri o nel raccolto.",
      "Le settimane valutate non sono servite a calibrare il sistema.",
      "Sono state misurate almeno 8 settimane e serre.",
      "Anche l’estremo alto del margine di confidenza resta al 10 % o meno.",
    ],
    criteriaNote: "Anche così, il risultato vale per quella serra, quella coltura e quel modo di riprendere. Prima di affermarlo altrove, si misura di nuovo.",
    linksTitle: "Dove si perde la precisione",
    linksLead: "L’errore totale non dice cosa non funziona. Misuriamo ogni anello separatamente:",
    links: [
      {
        name: "Il conteggio della telecamera",
        body: "In tratti di controllo segnati con nastro, la frutta si conta a mano e si confronta con ciò che ha contato Atias nello stesso tratto di fila.",
      },
      {
        name: "La frutta nascosta",
        body: "In quei tratti si conta anche quella che si vede solo spostando le foglie: quella che nessuna telecamera vede dal corridoio.",
      },
      {
        name: "Il peso per frutto",
        body: "Si pesa un campione di frutti per passare dai frutti contati ai chili.",
      },
      {
        name: "La maturazione",
        body: "Ciò che matura dopo le riprese si distribuisce secondo il caldo di ogni giorno e si confronta con il raccolto.",
      },
    ],
    statusTitle: "Cosa è provato e cosa no",
    proven: {
      name: "Provato",
      body: "Il sistema funziona dall’inizio alla fine: caricamento del video, conteggio per tratto, chili al giorno e confronto automatico con la bilancia.",
    },
    testing: {
      name: "In prova",
      body: "La precisione reale. A novembre 2026 abbiamo iniziato a misurarla in una serra vera. Pubblicheremo il risultato con questo metodo, buono o cattivo che sia.",
    },
    closeTitle: "La misuriamo nelle tue serre?",
  },
  pilotOffer: {
    badge: "Pilota gratuito di 4 settimane",
    eyebrow: "Pilota gratuito",
    title: "Provalo 4 settimane nelle tue serre, senza costi",
    lead: "Ogni settimana confronta la nostra previsione con ciò che segna la tua bilancia. Se non ti serve, non hai perso nulla.",
    steps: [
      {
        name: "Riprendi una volta a settimana",
        body: "Un video per fila e per lato con il telefono, prima della settimana di raccolta.",
      },
      {
        name: "Annota i chili raccolti",
        body: "I chili di ogni giorno, come già li pesate. Anche la tua previsione, se vuoi confrontarla.",
      },
      {
        name: "Confronta con la tua bilancia",
        body: "Ogni settimana vedi la nostra previsione rispetto al raccolto, con il suo errore misurato.",
      },
    ],
    note: "Aperto a cooperative e agricoltori di qualsiasi paese.",
    cta: "Voglio un pilota",
    interestLabel: "Cosa ti interessa?",
    interests: {
      piloto: "Pilota gratuito di 4 settimane",
      demo: "Una dimostrazione",
      otro: "Altro",
    },
  },
};
