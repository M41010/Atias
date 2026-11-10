import type { Dictionary } from "./es";

export const en: Dictionary = {
  meta: {
    title: "Atias · Count the harvest before you pick it",
    description:
      "One video per row, filmed on a phone. Atias counts the ripe fruit in the greenhouse and forecasts each day's kilos and the pickers you will need. Pilot in progress.",
  },
  nav: {
    home: "Home",
    company: "About us",
    product: "Product",
    contact: "Contact",
    vision: "Vision",
    pilot: "Pilot in progress",
    language: "Language",
    menu: "Menu",
    close: "Close",
    skip: "Skip to content",
  },
  cta: { demo: "Request a demo", how: "How it works" },
  counter: {
    title: "Sample greenhouse",
    sample: "Made-up data to show the method",
    position: "Move along the row",
    replay: "Count again",
    tramo: "Row",
    of: "of",
    ripe: "ripe fruits",
    kg: "kg forecast",
    range: "Between {min} and {max} kg",
    workers: "pickers",
    workersNote: "to pick it from Monday to Friday",
    legendObserved: "Green: what the video counted",
    legendForecast: "Amber: forecast, not yet validated",
    legendRipe: "Ripe fruit",
    legendUnripe: "Green fruit, not counted yet",
    tally: "Each black cell is 500 ripe fruits counted",
  },
  home: {
    heroTitle: "Count the harvest before you pick it.",
    heroLead:
      "One video per row, filmed on a phone on Saturday. Atias counts the ripe fruit section by section and tells you how many kilos you will have from Monday to Friday, with their margin, and how many people you will need to pick them.",
    problemTitle: "Every week, sales and crews are planned by eye.",
    problemBody: [
      "The cooperative commits kilos to its buyers and calls in its crews before knowing how much will ripen.",
      "Fall short and you miss orders. Overshoot and you sell cheap or pay for days nobody needed. The agronomist's forecast helps, but no one can walk every row counting fruit.",
    ],
    howTitle: "From a filmed row to a planned week.",
    steps: [
      {
        day: "Saturday",
        title: "Film",
        body: "The grower walks each row with a phone, one video per side. If the connection drops, the upload carries on where it stopped.",
      },
      {
        day: "Sunday",
        title: "Count",
        body: "Atias checks that the video is usable and counts the ripe fruit in each section of the row, every fruit only once.",
      },
      {
        day: "Monday",
        title: "Decide",
        body: "The cooperative sees each day's kilos up to Friday, with their margin, and how many pickers it needs.",
      },
    ],
    howLink: "See the product in detail",
    forTitle: "Who it is for.",
    audiences: [
      {
        who: "Cooperatives and marketers",
        what: "Commit sales and crews to a figure you can check, from the total down to the row and from the row to its video.",
      },
      {
        who: "Growers",
        what: "Film with a phone, with no new devices or passwords: a personal link for each week.",
      },
      {
        who: "Agronomists",
        what: "Set their forecast next to Atias's and the real harvest, day by day, to learn what misses and where.",
      },
      {
        who: "Investors and partners",
        what: "A real pilot in greenhouses in southern Spain, with a validation method defined from day one.",
      },
    ],
    pilotTitle: "What already works and what we are testing.",
    pilotLead: "Atias is in pilot. We would rather show you where we are than promise a figure we have not measured yet.",
    worksTitle: "Works",
    works: [
      "Video uploads from the phone, even with poor coverage.",
      "Automatic check of light, sharpness and length for every video.",
      "Real hour-by-hour temperature at each greenhouse, compared with what is normal for the season.",
      "Daily forecast from Monday to Friday, next to the agronomist's.",
      "Cooperative dashboard with kilos, margins, pickers and warnings.",
    ],
    testingTitle: "Testing",
    testing: [
      "The fruit detector on videos from real greenhouses.",
      "How accurate it is in kilos. The goal is an error of up to 10 %, not yet measured.",
      "The average weight per fruit of each variety.",
      "How much fruit is hidden by the leaves.",
    ],
    closeTitle: "Shall we look at your greenhouses?",
    closeBody: "We will show you the pilot in a twenty-minute call and see whether it fits the way you work.",
  },
  company: {
    title: "About us",
    pending: "Provisional text, pending review by the company.",
    lead: "We work so that harvest forecasts come from the fruit on the plant, not from a hunch.",
    body: [
      "Atias was born in southern Spain, among greenhouses growing vegetables for export. There, every week, someone has to decide how many kilos to sell and how many people to call in, almost always with an estimate made by eye.",
      "What we do is turn what can be filmed on a phone into a figure that is useful for that decision: each day's kilos and the pickers needed, with their margin and with a way to check where they come from.",
      "We work alongside cooperatives, agronomists and growers, and we test it in their greenhouses before calling it ready.",
    ],
    principlesTitle: "How we work",
    principles: [
      {
        name: "Every figure with its margin",
        body: "A forecast without a margin claims more certainty than it has. Ours always carry one.",
      },
      {
        name: "What is proven, kept apart from what is not",
        body: "What is still being tested is said out loud. We never present as certain something we have not measured.",
      },
      {
        name: "The grower's work is never lost",
        body: "Filming takes time. A bad connection delays the upload but never forces a re-shoot.",
      },
      {
        name: "Everyone's data stays theirs",
        body: "Each grower only sees their own, and videos are deleted once they are no longer needed.",
      },
    ],
  },
  product: {
    title: "The product",
    lead: "Atias brings together three things: what the video shows, what the weather does and what the cooperative already knows.",
    sections: [
      {
        title: "Film",
        body: "The grower gets a personal link for each week. They film every row with a phone, one video per side, walking slowly. The upload resumes on its own if the connection drops, and each video is checked on arrival: if it is dark, shaky or too short, they are asked to redo it.",
      },
      {
        title: "Count",
        body: "A trained detector finds each fruit and follows it across frames to count it only once. The row is split into sections, and each fruit is assigned to its own according to how far the camera has moved. Ripeness is judged by colour in tomato and pepper, and by size in cucumber.",
      },
      {
        title: "Forecast",
        body: "Fruits become kilos using the average weight of each variety. What will ripen during the week depends on heat: Atias uses the real hour-by-hour temperature at each greenhouse and compares it with what is normal for those dates. The result is spread from Monday to Friday, always with its margin.",
      },
      {
        title: "Plan",
        body: "With the forecast kilos and what one person picks in a working day, Atias works out the pickers for each crop family. The cooperative adjusts the parameters and sees the result instantly.",
      },
      {
        title: "Check",
        body: "Every week, Atias's forecast is compared with the agronomist's and with what was actually picked. Day by day, you can see who comes closest and where to correct.",
      },
    ],
    panelTitle: "The cooperative dashboard",
    panelBody:
      "Weekly summary, daily forecast, greenhouse detail down to each row section, received videos, links for growers, real harvest and pickers.",
    panelCaption: "Cooperative dashboard with sample data.",
    cropsTitle: "Crops",
    crops: ["Cherry tomato", "Pepper", "Cucumber"],
    cropsNote: "These are the pilot crops. Each new crop needs its own training and validation.",
    dataTitle: "Security and data",
    data: [
      "Each link only opens its own greenhouse and week, expires on its own and can be revoked.",
      "The cooperative signs in with its account. Passwords are stored encrypted.",
      "Replaced or removed videos are deleted after seven days.",
    ],
  },
  contact: {
    title: "Contact",
    lead: "Tell us who you are and what you grow. We will write back to show you the pilot.",
    name: "Name",
    organization: "Company or cooperative",
    role: "You are",
    roles: ["Cooperative or marketer", "Grower", "Agronomist", "Investor or partner", "Other"],
    email: "Email",
    phone: "Phone (optional)",
    message: "What would you like to see?",
    consent: "I have read the privacy policy and agree that you use this data to reply to me.",
    privacyLink: "privacy policy",
    submit: "Send request",
    sending: "Sending…",
    sent: "Received. We will write to you within a few days.",
    error: "It could not be sent. Please try again in a moment.",
    inactive:
      "The form is not active yet: the address that receives requests is still to be set. Until then, no data is sent.",
    required: "Required",
    invalidEmail: "Check the email: it looks incomplete.",
    consentRequired: "We need your permission to reply.",
    directTitle: "You can also write to us",
    directEmail: "Contact email pending",
  },
  legal: {
    noticeTitle: "Legal notice",
    privacyTitle: "Privacy policy",
    pending: "Pending",
    draft: "Draft with no legal force until the company fills in the marked details and an adviser reviews it.",
    notice: [
      {
        heading: "Owner",
        body: "This website belongs to {titular}, tax ID {nif}, registered at {domicilio}. Contact email: {correo}.",
      },
      {
        heading: "Purpose",
        body: "The website presents Atias, a greenhouse harvest forecasting system in its pilot phase, and lets visitors request a demo.",
      },
      {
        heading: "Intellectual property",
        body: "The texts, design and code of this website belong to its owner unless stated otherwise. They may not be reproduced without permission.",
      },
      {
        heading: "Liability",
        body: "The product information describes an ongoing pilot and may change. No figure shown as an example comes from real customers.",
      },
    ],
    privacy: [
      {
        heading: "Controller",
        body: "{titular}, tax ID {nif}. Email for any privacy matter: {correo}.",
      },
      {
        heading: "What data and why",
        body: "Only what you write in the contact form (name, company, profile, email, phone if you give it, and message), to reply to you and arrange a demo. We do not use it for anything else.",
      },
      {
        heading: "Legal basis",
        body: "Your consent, which you give when sending the form and may withdraw at any time.",
      },
      {
        heading: "How long",
        body: "While our conversation lasts and at most one year after the last contact, unless you ask us to delete it sooner.",
      },
      {
        heading: "Who it is shared with",
        body: "No one, except the provider that receives the form on our behalf: {proveedor}.",
      },
      {
        heading: "Your rights",
        body: "You may request access, rectification, erasure, objection, restriction and portability by writing to {correo}. You may also complain to the Spanish Data Protection Agency (aepd.es).",
      },
      {
        heading: "Cookies",
        body: "This website uses no cookies or tracking tools. If that changes, we will say so here and ask for your permission.",
      },
    ],
  },
  footer: {
    rights: "Atias · Harvest forecasting from video",
    notice: "Legal notice",
    privacy: "Privacy",
    noCookies: "No cookies, no tracking.",
  },
  root: { choose: "Choose your language" },
};
