/** Rótulos del vídeo en los seis idiomas de la web. Pendientes de revisión por nativos, como la web. */

export const LOCALES = ["es", "en", "fr", "nl", "it", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export type Texts = {
  intro: string;
  tomato: string;
  cucumber: string;
  pepper: string;
  phone: string;
  rail: string;
  toApp: string;
  app: { resumen: string; prevision: string; invernadero: string; temporeros: string; precision: string };
  ripe: string;
  crop: { tomato: string; cucumber: string; pepper: string };
  byColor: string;
  bySize: string;
  rec: string;
  soon: string;
  recreation: string;
  sample: string;
  chips: [string, string, string, string];
  tagline: string;
};

export const TEXTS: Record<Locale, Texts> = {
  es: {
    intro: "Cada semana, alguien tiene que adivinar cuánta fruta hay.",
    tomato: "Atias recorre la hilera y cuenta cada fruto maduro.",
    cucumber: "Pepino: por calibre.",
    pepper: "Pimiento: por color.",
    phone: "Hoy: un vídeo por hilera, grabado con el móvil.",
    rail: "Próximamente: captura automática sobre raíl.",
    toApp: "Y todo llega a la cooperativa.",
    app: {
      resumen: "Kilos y temporeros de la semana, con su margen.",
      prevision: "Kilos de cada día, junto a la previsión del técnico.",
      invernadero: "Detalle por hilera y tramo, sin marcadores.",
      temporeros: "Temporeros necesarios por familia.",
      precision: "Cuánto acierta, medido con la cosecha real.",
    },
    ripe: "frutos maduros",
    crop: { tomato: "Tomate cherry", cucumber: "Pepino", pepper: "Pimiento" },
    byColor: "Madurez por color",
    bySize: "Madurez por calibre",
    rec: "Grabando",
    soon: "Próximamente",
    recreation: "Recreación animada",
    sample: "Datos de ejemplo",
    chips: ["frutos maduros", "kg previstos", "por tramo", "temporeros"],
    tagline: "Previsión de cosecha en invernadero",
  },
  en: {
    intro: "Every week, someone has to guess how much fruit there is.",
    tomato: "Atias walks the row and counts every ripe fruit.",
    cucumber: "Cucumber: by size.",
    pepper: "Pepper: by colour.",
    phone: "Today: one video per row, recorded on a phone.",
    rail: "Coming soon: automatic capture on a rail.",
    toApp: "And it all reaches the cooperative.",
    app: {
      resumen: "The week's kilos and pickers, with their margin.",
      prevision: "Kilos for each day, next to the agronomist's forecast.",
      invernadero: "Detail by row and stretch, without markers.",
      temporeros: "Pickers needed for each crop family.",
      precision: "How accurate it is, measured against the real harvest.",
    },
    ripe: "ripe fruit",
    crop: { tomato: "Cherry tomato", cucumber: "Cucumber", pepper: "Pepper" },
    byColor: "Ripeness by colour",
    bySize: "Ripeness by size",
    rec: "Recording",
    soon: "Coming soon",
    recreation: "Animated recreation",
    sample: "Sample data",
    chips: ["ripe fruit", "kg forecast", "per stretch", "pickers"],
    tagline: "Greenhouse harvest forecasting",
  },
  fr: {
    intro: "Chaque semaine, quelqu'un doit deviner combien de fruits il y a.",
    tomato: "Atias parcourt le rang et compte chaque fruit mûr.",
    cucumber: "Concombre : au calibre.",
    pepper: "Poivron : à la couleur.",
    phone: "Aujourd'hui : une vidéo par rang, filmée au téléphone.",
    rail: "Bientôt : capture automatique sur rail.",
    toApp: "Et tout arrive à la coopérative.",
    app: {
      resumen: "Les kilos et les saisonniers de la semaine, avec leur marge.",
      prevision: "Les kilos de chaque jour, à côté de la prévision du technicien.",
      invernadero: "Le détail par rang et par tronçon, sans repères.",
      temporeros: "Les saisonniers nécessaires par famille.",
      precision: "Sa précision, mesurée avec la récolte réelle.",
    },
    ripe: "fruits mûrs",
    crop: { tomato: "Tomate cerise", cucumber: "Concombre", pepper: "Poivron" },
    byColor: "Maturité à la couleur",
    bySize: "Maturité au calibre",
    rec: "Enregistrement",
    soon: "Bientôt",
    recreation: "Reconstitution animée",
    sample: "Données d'exemple",
    chips: ["fruits mûrs", "kg prévus", "par tronçon", "saisonniers"],
    tagline: "Prévision de récolte sous serre",
  },
  nl: {
    intro: "Elke week moet iemand raden hoeveel fruit er hangt.",
    tomato: "Atias loopt de rij af en telt elke rijpe vrucht.",
    cucumber: "Komkommer: op maat.",
    pepper: "Paprika: op kleur.",
    phone: "Nu: één video per rij, gefilmd met de telefoon.",
    rail: "Binnenkort: automatisch filmen op een rail.",
    toApp: "En alles komt bij de coöperatie terecht.",
    app: {
      resumen: "Kilo's en plukkers van de week, met hun marge.",
      prevision: "Kilo's per dag, naast de prognose van de teeltadviseur.",
      invernadero: "Detail per rij en per stuk, zonder markeringen.",
      temporeros: "Benodigde plukkers per gewasgroep.",
      precision: "Hoe nauwkeurig het is, gemeten aan de echte oogst.",
    },
    ripe: "rijpe vruchten",
    crop: { tomato: "Cherrytomaat", cucumber: "Komkommer", pepper: "Paprika" },
    byColor: "Rijpheid op kleur",
    bySize: "Rijpheid op maat",
    rec: "Opname",
    soon: "Binnenkort",
    recreation: "Geanimeerde weergave",
    sample: "Voorbeeldgegevens",
    chips: ["rijpe vruchten", "kg verwacht", "per stuk", "plukkers"],
    tagline: "Oogstprognose voor de kas",
  },
  it: {
    intro: "Ogni settimana qualcuno deve indovinare quanta frutta c'è.",
    tomato: "Atias percorre la fila e conta ogni frutto maturo.",
    cucumber: "Cetriolo: dal calibro.",
    pepper: "Peperone: dal colore.",
    phone: "Oggi: un video per fila, girato con il telefono.",
    rail: "Presto: ripresa automatica su binario.",
    toApp: "E tutto arriva alla cooperativa.",
    app: {
      resumen: "Chili e stagionali della settimana, con il loro margine.",
      prevision: "I chili di ogni giorno, accanto alla previsione del tecnico.",
      invernadero: "Dettaglio per fila e per tratto, senza marcatori.",
      temporeros: "Stagionali necessari per famiglia.",
      precision: "Quanto è preciso, misurato con il raccolto reale.",
    },
    ripe: "frutti maturi",
    crop: { tomato: "Pomodoro ciliegino", cucumber: "Cetriolo", pepper: "Peperone" },
    byColor: "Maturazione dal colore",
    bySize: "Maturazione dal calibro",
    rec: "Registrazione",
    soon: "Presto",
    recreation: "Ricostruzione animata",
    sample: "Dati di esempio",
    chips: ["frutti maturi", "kg previsti", "per tratto", "stagionali"],
    tagline: "Previsione del raccolto in serra",
  },
  pt: {
    intro: "Todas as semanas, alguém tem de adivinhar quanta fruta há.",
    tomato: "A Atias percorre a linha e conta cada fruto maduro.",
    cucumber: "Pepino: pelo calibre.",
    pepper: "Pimento: pela cor.",
    phone: "Hoje: um vídeo por linha, gravado no telemóvel.",
    rail: "Em breve: captura automática sobre carril.",
    toApp: "E tudo chega à cooperativa.",
    app: {
      resumen: "Quilos e sazonais da semana, com a sua margem.",
      prevision: "Os quilos de cada dia, ao lado da previsão do técnico.",
      invernadero: "Detalhe por linha e troço, sem marcadores.",
      temporeros: "Sazonais necessários por família.",
      precision: "Quanto acerta, medido com a colheita real.",
    },
    ripe: "frutos maduros",
    crop: { tomato: "Tomate cereja", cucumber: "Pepino", pepper: "Pimento" },
    byColor: "Maturação pela cor",
    bySize: "Maturação pelo calibre",
    rec: "A gravar",
    soon: "Em breve",
    recreation: "Recriação animada",
    sample: "Dados de exemplo",
    chips: ["frutos maduros", "kg previstos", "por troço", "sazonais"],
    tagline: "Previsão de colheita em estufa",
  },
};
