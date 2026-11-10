import type { Dictionary } from "./es";

export const fr: Dictionary = {
  meta: {
    title: "Atias · Comptez la récolte avant de la cueillir",
    description:
      "Une vidéo par rangée, filmée au téléphone. Atias compte les fruits mûrs de la serre et prévoit les kilos de chaque jour et la main-d'œuvre nécessaire. Pilote en cours.",
  },
  nav: {
    home: "Accueil",
    company: "Qui sommes-nous",
    product: "Produit",
    contact: "Contact",
    vision: "Vision",
    pilot: "Pilote en cours",
    language: "Langue",
    menu: "Menu",
    close: "Fermer",
    skip: "Aller au contenu",
  },
  cta: { demo: "Demander une démonstration", how: "Comment ça marche" },
  counter: {
    title: "Serre d'exemple",
    sample: "Données inventées pour montrer la méthode",
    position: "Avancer le long de la rangée",
    replay: "Recompter",
    tramo: "Rangée",
    of: "sur",
    ripe: "fruits mûrs",
    kg: "kg prévus",
    range: "Entre {min} et {max} kg",
    workers: "saisonniers",
    workersNote: "pour la cueillir du lundi au vendredi",
    legendObserved: "Vert : ce que la vidéo a compté",
    legendForecast: "Ambre : prévision, pas encore validée",
    legendRipe: "Fruit mûr",
    legendUnripe: "Fruit vert, pas encore compté",
    tally: "Chaque case noire vaut 500 fruits mûrs comptés",
  },
  home: {
    heroTitle: "Comptez la récolte avant de la cueillir.",
    heroLead:
      "Une vidéo par rangée, filmée au téléphone le samedi. Atias compte les fruits mûrs tronçon par tronçon et vous dit combien de kilos vous aurez du lundi au vendredi, avec leur marge, et combien de personnes il faudra pour les cueillir.",
    problemTitle: "Chaque semaine, on vend et on embauche à l'œil.",
    problemBody: [
      "La coopérative s'engage sur des kilos auprès de ses clients et appelle ses équipes avant de savoir combien va mûrir.",
      "Trop peu, et les commandes ne sont pas honorées. Trop, et l'on vend à perte ou l'on paie des journées inutiles. La prévision du technicien aide, mais personne ne peut parcourir chaque rangée en comptant les fruits.",
    ],
    howTitle: "D'une rangée filmée à une semaine planifiée.",
    steps: [
      {
        day: "Samedi",
        title: "On filme",
        body: "Le producteur parcourt chaque rangée avec son téléphone, une vidéo par côté. Si la connexion coupe, l'envoi reprend là où il s'était arrêté.",
      },
      {
        day: "Dimanche",
        title: "On compte",
        body: "Atias vérifie que la vidéo est exploitable et compte les fruits mûrs de chaque tronçon, chaque fruit une seule fois.",
      },
      {
        day: "Lundi",
        title: "On décide",
        body: "La coopérative voit les kilos de chaque jour jusqu'au vendredi, avec leur marge, et le nombre de saisonniers nécessaires.",
      },
    ],
    howLink: "Voir le produit en détail",
    forTitle: "Pour qui.",
    audiences: [
      {
        who: "Coopératives et metteurs en marché",
        what: "S'engager sur les ventes et les équipes avec un chiffre vérifiable, du total à la rangée et de la rangée à sa vidéo.",
      },
      {
        who: "Producteurs",
        what: "Filmer au téléphone, sans nouvel appareil ni mot de passe : un lien personnel pour chaque semaine.",
      },
      {
        who: "Techniciens",
        what: "Placer leur prévision à côté de celle d'Atias et de la récolte réelle, jour après jour, pour voir ce qui manque et où.",
      },
      {
        who: "Investisseurs et partenaires",
        what: "Un vrai pilote dans des serres du sud de l'Espagne, avec une méthode de validation définie dès le premier jour.",
      },
    ],
    pilotTitle: "Ce qui fonctionne déjà et ce que nous vérifions.",
    pilotLead: "Atias est en phase pilote. Nous préférons vous montrer où nous en sommes plutôt que de promettre un chiffre pas encore mesuré.",
    worksTitle: "Fonctionne",
    works: [
      "Envoi des vidéos depuis le téléphone, même avec une mauvaise couverture.",
      "Contrôle automatique de la lumière, de la netteté et de la durée de chaque vidéo.",
      "Température réelle heure par heure dans chaque serre, comparée à la normale de la saison.",
      "Prévision quotidienne du lundi au vendredi, à côté de celle du technicien.",
      "Tableau de bord de la coopérative avec kilos, marges, saisonniers et alertes.",
    ],
    testingTitle: "En cours de vérification",
    testing: [
      "Le détecteur de fruits sur des vidéos de serres réelles.",
      "Sa précision en kilos. L'objectif est une erreur de 10 % au maximum, pas encore mesurée.",
      "Le poids moyen par fruit de chaque variété.",
      "La part des fruits cachée par les feuilles.",
    ],
    closeTitle: "On regarde vos serres ?",
    closeBody: "Nous vous présentons le pilote lors d'un appel de vingt minutes et voyons s'il convient à votre façon de travailler.",
  },
  company: {
    title: "Qui sommes-nous",
    pending: "Texte provisoire, en attente de relecture par l'entreprise.",
    lead: "Nous travaillons pour que la prévision de récolte vienne des fruits sur la plante, et non de l'intuition.",
    body: [
      "Atias est né dans le sud de l'Espagne, au milieu des serres de légumes destinés à l'export. Là-bas, chaque semaine, quelqu'un doit décider combien de kilos vendre et combien de personnes appeler, presque toujours à partir d'une estimation à l'œil.",
      "Notre métier est de transformer ce qu'on peut filmer avec un téléphone en un chiffre utile pour cette décision : les kilos de chaque jour et la main-d'œuvre nécessaire, avec leur marge et la possibilité de vérifier d'où ils viennent.",
      "Nous travaillons avec des coopératives, des techniciens et des producteurs, et nous testons dans leurs serres avant de valider.",
    ],
    principlesTitle: "Notre façon de travailler",
    principles: [
      {
        name: "Chaque chiffre avec sa marge",
        body: "Une prévision sans marge affiche plus de certitude qu'elle n'en a. Les nôtres en ont toujours une.",
      },
      {
        name: "Le prouvé, séparé du reste",
        body: "Ce qui est encore en test est annoncé comme tel. Nous ne présentons jamais comme sûr ce que nous n'avons pas mesuré.",
      },
      {
        name: "Le travail du producteur n'est jamais perdu",
        body: "Filmer prend du temps. Une mauvaise connexion retarde l'envoi, mais n'oblige pas à refilmer.",
      },
      {
        name: "Les données de chacun restent les siennes",
        body: "Chaque producteur ne voit que les siennes, et les vidéos sont effacées dès qu'elles ne servent plus.",
      },
    ],
  },
  product: {
    title: "Le produit",
    lead: "Atias réunit trois choses : ce que montre la vidéo, ce que fait la météo et ce que la coopérative sait déjà.",
    sections: [
      {
        title: "Filmer",
        body: "Le producteur reçoit un lien personnel pour chaque semaine. Il filme chaque rangée au téléphone, une vidéo par côté, en marchant lentement. L'envoi reprend seul si la connexion coupe, et chaque vidéo est contrôlée à l'arrivée : trop sombre, floue ou trop courte, on lui demande de la refaire.",
      },
      {
        title: "Compter",
        body: "Un détecteur entraîné repère chaque fruit et le suit d'une image à l'autre pour ne le compter qu'une fois. La rangée est divisée en tronçons, et chaque fruit est attribué au sien selon l'avancée de la caméra. La maturité se juge à la couleur pour la tomate et le poivron, et au calibre pour le concombre.",
      },
      {
        title: "Prévoir",
        body: "Les fruits deviennent des kilos grâce au poids moyen de chaque variété. Ce qui mûrira dans la semaine dépend de la chaleur : Atias utilise la température réelle heure par heure de chaque serre et la compare à la normale pour ces dates. Le résultat est réparti du lundi au vendredi, toujours avec sa marge.",
      },
      {
        title: "Planifier",
        body: "À partir des kilos prévus et de ce qu'une personne cueille en une journée, Atias calcule les saisonniers de chaque famille de culture. La coopérative ajuste les paramètres et voit le résultat aussitôt.",
      },
      {
        title: "Vérifier",
        body: "Chaque semaine, la prévision d'Atias est comparée à celle du technicien et à la récolte réelle. Jour après jour, on voit qui s'en approche le plus et où corriger.",
      },
    ],
    panelTitle: "Le tableau de bord de la coopérative",
    panelBody:
      "Synthèse hebdomadaire, prévision quotidienne, détail de chaque serre jusqu'au tronçon de rangée, vidéos reçues, liens pour les producteurs, récolte réelle et saisonniers.",
    panelCaption: "Tableau de bord de la coopérative avec des données d'exemple.",
    cropsTitle: "Cultures",
    crops: ["Tomate cerise", "Poivron", "Concombre"],
    cropsNote: "Ce sont les cultures du pilote. Chaque nouvelle culture demande son propre entraînement et sa propre validation.",
    dataTitle: "Sécurité et données",
    data: [
      "Chaque lien n'ouvre que sa serre et sa semaine, expire seul et peut être révoqué.",
      "La coopérative se connecte avec son compte. Les mots de passe sont stockés chiffrés.",
      "Les vidéos remplacées ou retirées sont effacées au bout de sept jours.",
    ],
  },
  contact: {
    title: "Contact",
    lead: "Dites-nous qui vous êtes et ce que vous cultivez. Nous vous écrirons pour vous montrer le pilote.",
    name: "Nom",
    organization: "Entreprise ou coopérative",
    role: "Vous êtes",
    roles: ["Coopérative ou metteur en marché", "Producteur", "Technicien", "Investisseur ou partenaire", "Autre"],
    email: "E-mail",
    phone: "Téléphone (facultatif)",
    message: "Que souhaitez-vous voir ?",
    consent: "J'ai lu la politique de confidentialité et j'accepte que ces données servent à me répondre.",
    privacyLink: "politique de confidentialité",
    submit: "Envoyer la demande",
    sending: "Envoi…",
    sent: "Bien reçu. Nous vous écrirons d'ici quelques jours.",
    error: "L'envoi a échoué. Réessayez dans un instant.",
    inactive:
      "Le formulaire n'est pas encore actif : l'adresse qui reçoit les demandes reste à définir. D'ici là, aucune donnée n'est envoyée.",
    required: "Obligatoire",
    invalidEmail: "Vérifiez l'e-mail : il semble incomplet.",
    consentRequired: "Nous avons besoin de votre accord pour vous répondre.",
    directTitle: "Vous pouvez aussi nous écrire",
    directEmail: "Adresse de contact à définir",
  },
  legal: {
    noticeTitle: "Mentions légales",
    privacyTitle: "Politique de confidentialité",
    pending: "À compléter",
    draft: "Brouillon sans valeur juridique tant que l'entreprise n'a pas complété les données indiquées et qu'un conseiller ne l'a pas relu.",
    notice: [
      {
        heading: "Éditeur",
        body: "Ce site appartient à {titular}, numéro fiscal {nif}, domicilié à {domicilio}. E-mail de contact : {correo}.",
      },
      {
        heading: "Objet",
        body: "Le site présente Atias, un système de prévision de récolte en serre en phase pilote, et permet de demander une démonstration.",
      },
      {
        heading: "Propriété intellectuelle",
        body: "Les textes, le design et le code de ce site appartiennent à son éditeur sauf mention contraire. Ils ne peuvent être reproduits sans autorisation.",
      },
      {
        heading: "Responsabilité",
        body: "Les informations sur le produit décrivent un pilote en cours et peuvent évoluer. Aucun chiffre présenté en exemple ne provient de clients réels.",
      },
    ],
    privacy: [
      {
        heading: "Responsable",
        body: "{titular}, numéro fiscal {nif}. E-mail pour toute question de confidentialité : {correo}.",
      },
      {
        heading: "Quelles données et pourquoi",
        body: "Uniquement celles que vous saisissez dans le formulaire (nom, entreprise, profil, e-mail, téléphone si vous le donnez et message), pour vous répondre et organiser une démonstration. Nous ne les utilisons pour rien d'autre.",
      },
      {
        heading: "Base légale",
        body: "Votre consentement, donné en envoyant le formulaire et révocable à tout moment.",
      },
      {
        heading: "Durée",
        body: "Le temps de notre échange et au plus un an après le dernier contact, sauf si vous demandez leur suppression avant.",
      },
      {
        heading: "Destinataires",
        body: "Personne, sauf le prestataire qui reçoit le formulaire pour notre compte : {proveedor}.",
      },
      {
        heading: "Vos droits",
        body: "Vous pouvez demander l'accès, la rectification, l'effacement, l'opposition, la limitation et la portabilité en écrivant à {correo}. Vous pouvez aussi saisir l'Agence espagnole de protection des données (aepd.es).",
      },
      {
        heading: "Cookies",
        body: "Ce site n'utilise ni cookies ni outils de suivi. Si cela change, nous l'indiquerons ici et vous demanderons votre accord.",
      },
    ],
  },
  footer: {
    rights: "Atias · Prévision de récolte à partir de vidéo",
    notice: "Mentions légales",
    privacy: "Confidentialité",
    noCookies: "Sans cookies ni suivi.",
  },
  root: { choose: "Choisissez votre langue" },
};
