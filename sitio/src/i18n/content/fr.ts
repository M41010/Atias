import type { Content } from "./es";

/** Français. À relire par un locuteur natif avant publication. */
export const contentFr: Content = {
  seo: {
    home: {
      title: "Prévision de récolte en serre à partir de vidéo | Atias",
      description:
        "Atias compte les fruits mûrs grâce à une vidéo par rang filmée au téléphone et prévoit les kilos par jour et les saisonniers nécessaires. Pilote en cours.",
    },
    company: {
      title: "À propos · Prévision de récolte en serre | Atias",
      description:
        "Atias est né dans le sud de l'Espagne pour que la prévision de récolte maraîchère parte des fruits présents sur la plante, avec sa marge et vérifiable.",
    },
    product: {
      title: "Estimation de récolte par vision artificielle | Atias",
      description:
        "Filmer au téléphone, compter chaque fruit par vision artificielle, prévoir les kilos du lundi au vendredi et planifier les saisonniers : voici Atias.",
    },
    contact: {
      title: "Demandez une démonstration d'Atias | Prévision de récolte",
      description:
        "Dites-nous ce que vous cultivez et nous vous montrons le pilote d'Atias en vingt minutes : estimation de récolte et saisonniers à partir de vidéo.",
    },
    guide: {
      title: "Estimation de récolte en serre : méthodes et erreurs | Atias",
      description:
        "L'estimation de récolte en serre : méthodes actuelles (à l'œil, par échantillon, par historique), pourquoi elles échouent et ce qu'apporte la vidéo.",
    },
    faq: {
      title: "Questions fréquentes sur la prévision de récolte | Atias",
      description:
        "Cultures, tournage au téléphone, précision, saisonniers, données et pilote : des réponses claires sur la prévision de récolte d'Atias.",
    },
    crops: {
      title: "Prévision de récolte par culture sous serre | Atias",
      description:
        "Estimation de récolte de tomate cerise, poivron et concombre sous serre par vision artificielle : ce qu'Atias compte et ce qui est encore en test.",
    },
    vision: {
      "title": "Vision : de compter les fruits à soigner la serre | Atias",
      "description": "Où va Atias : de la prévision de récolte à la santé des plantes et à l'état des cultures, version après version. Atias recommande, le technicien décide."
    },
    journal: {
      title: "Journal du pilote : comment avance Atias | Atias",
      description: "Les nouvelles datées du pilote d’Atias : du premier prototype au premier tournage dans une vraie serre. Uniquement des faits, sans chiffres non mesurés.",
    },
    notice: { title: "Mentions légales | Atias", description: "Mentions légales du site d'Atias." },
    privacy: { title: "Politique de confidentialité | Atias", description: "Politique de confidentialité du site d'Atias." },
  },
  links: {
    heroEyebrow: "Prévision de récolte sous serre",
    guide: "Guide de l'estimation de récolte",
    faq: "Questions fréquentes",
    crops: "Cultures",
    guideTeaser: "Comment on estime la récolte aujourd'hui et pourquoi ça échoue",
    faqTeaser: "Réponses aux questions les plus courantes",
    cropTeaser: "Voir la page de la culture",
    vision: "Vision",
    journal: "Journal du pilote",
    breadcrumb: "Fil d'Ariane",
  },
  guide: {
    eyebrow: "Guide",
    title: "Estimation de récolte en serre : comment on la fait et pourquoi elle échoue",
    lead: "L'estimation décide combien de kilos on vend et combien de personnes on embauche chaque semaine. Nous passons en revue les méthodes habituelles, leurs limites et ce que change le comptage des fruits en vidéo.",
    updated: "Mis à jour en novembre 2026",
    date: "2026-11-09",
    sections: [
      {
        heading: "Qu'est-ce que l'estimation de récolte",
        paragraphs: [
          "L'estimation de récolte est la prévision, avant la cueillette, du nombre de kilos qu'une exploitation ou une serre va produire sur une période. En maraîchage sous serre, on récolte plusieurs fois par semaine : l'estimation est donc hebdomadaire, avec les kilos de chaque jour du lundi au vendredi.",
          "Trois décisions en dépendent : combien on s'engage à livrer aux clients, combien de saisonniers on appelle et combien d'emballages, de camions et d'équipes de station on prévoit.",
        ],
      },
      {
        heading: "Comment on la fait aujourd'hui",
        paragraphs: [
          "À l'œil : le technicien ou le producteur parcourt la serre et estime la production par expérience. C'est rapide et riche en savoir-faire, mais cela dépend de la personne et de ce qu'elle peut parcourir.",
          "Par échantillon : on compte les fruits de quelques plantes et on multiplie par le total. C'est plus objectif, mais quelques plantes représentent rarement toute la serre, et compter à la main prend du temps.",
          "Par historique : on part de ce qui a été récolté les campagnes précédentes aux mêmes dates. C'est une référence utile, mais elle ne voit pas ce qui se passe cette année sur la plante.",
          "Avec le climat : la chaleur accélère la maturation, et certains modèles ajustent la prévision avec la température cumulée. Ils affinent le rythme, mais ils ont besoin de savoir combien de fruits il y a au départ.",
        ],
      },
      {
        heading: "Pourquoi l'estimation échoue",
        paragraphs: [
          "La production n'est pas la même dans toute la serre : elle change d'un rang à l'autre et à l'intérieur d'un même rang. Une estimation qui ne regarde qu'une partie reporte cette erreur sur le total.",
          "Une partie des fruits est cachée par les feuilles, et ceux qui sont sur le point de changer de couleur passent facilement inaperçus. Une semaine plus chaude que d'habitude avance aussi la maturation et fausse une prévision faite par temps doux.",
          "Et on mesure rarement la justesse : sans comparer la prévision à ce qui est récolté chaque jour, on ne sait ni où elle se trompe ni comment la corriger.",
        ],
      },
      {
        heading: "Ce que change le comptage en vidéo",
        paragraphs: [
          "Avec une vidéo par rang, filmée au téléphone en marchant lentement, on peut compter tous les fruits visibles et pas seulement un échantillon. Un détecteur de vision artificielle repère chaque fruit et le suit d'une image à l'autre pour ne le compter qu'une fois, puis l'attribue au tronçon de rang que la caméra traversait.",
          "Les fruits sont convertis en kilos avec le poids moyen de chaque variété, et la température réelle de chaque serre, heure par heure, indique combien mûriront dans la semaine. Le résultat est une prévision quotidienne avec sa marge, que l'on peut suivre du total au rang et du rang à sa vidéo.",
          "Ce n'est pas magique : certains fruits échappent à la caméra et le poids moyen varie. C'est pourquoi tout système de ce type doit être comparé chaque semaine à la récolte réelle avant d'être considéré comme fiable.",
        ],
      },
      {
        heading: "Comment savoir si une prévision fonctionne",
        paragraphs: [
          "Exigez que chaque chiffre soit accompagné de sa marge et comparez-le, jour après jour, avec ce qui est réellement récolté. Regardez l'erreur en kilos par jour et par semaine, et comparez-la à la prévision que vous utilisez déjà, par exemple celle du technicien.",
          "Une bonne prévision n'est pas celle qui tombe juste une semaine, mais celle qui reste proche de façon stable et explique d'où vient chaque chiffre.",
        ],
      },
      {
        heading: "De l'estimation aux saisonniers",
        paragraphs: [
          "Avec les kilos prévus pour chaque jour et ce qu'une personne récolte en une journée pour chaque culture, on calcule le nombre de saisonniers nécessaires. Si l'estimation est fiable, l'équipe correspond aux fruits présents : ni journées payées en trop, ni fruits laissés sur la plante.",
        ],
      },
    ],
    ctaTitle: "Vous voulez voir comment fait Atias ?",
    ctaBody: "Nous vous montrons le pilote avec des données d'exemple et vous expliquons ce que nous vérifions avec la récolte réelle.",
  },
  faq: {
    title: "Questions fréquentes",
    lead: "Ce que les coopératives, producteurs et techniciens nous demandent le plus sur la prévision de récolte à partir de vidéo.",
    items: [
      {
        q: "Qu'est-ce qu'Atias ?",
        a: "Un système de prévision de récolte pour la serre. À partir d'une vidéo par rang filmée au téléphone, il compte les fruits mûrs, prévoit les kilos de chaque jour du lundi au vendredi avec leur marge et calcule le nombre de saisonniers nécessaires.",
      },
      {
        q: "Faut-il acheter des caméras ou des capteurs ?",
        a: "Non. Le producteur filme avec son propre téléphone grâce à un lien personnel reçu chaque semaine. Rien à installer dans la serre, aucun mot de passe.",
      },
      {
        q: "Comment filme-t-on chaque rang ?",
        a: "En marchant lentement dans l'allée, une vidéo pour chaque côté du rang. À l'envoi, Atias vérifie la lumière, la netteté et la durée, et prévient s'il faut recommencer.",
      },
      {
        q: "Pour quelles cultures ?",
        a: "Le pilote couvre la tomate cerise, le poivron et le concombre. Chaque nouvelle culture demande son propre entraînement et sa validation avant d'être proposée.",
      },
      {
        q: "Quelle est sa précision ?",
        a: "Nous ne l'avons pas encore mesurée sur une récolte réelle, et nous ne donnerons pas de chiffre avant de l'avoir fait. L'objectif est une erreur de 10 % maximum en kilos. Chaque prévision a sa marge et est comparée chaque semaine à la récolte.",
      },
      {
        q: "Comment calcule-t-il les saisonniers ?",
        a: "Il divise les kilos prévus pour chaque jour par ce qu'une personne récolte en une journée pour chaque famille de cultures. La coopérative peut ajuster ce rendement et voit le résultat immédiatement.",
      },
      {
        q: "Remplace-t-il le technicien ?",
        a: "Non. Sa prévision est placée à côté de celle d'Atias et de la récolte réelle, jour après jour, pour voir qui s'en approche le plus et où corriger. Le savoir du technicien reste essentiel.",
      },
      {
        q: "Et si la couverture réseau est mauvaise dans la serre ?",
        a: "L'envoi reprend tout seul là où il s'est arrêté. Une mauvaise connexion retarde l'envoi, mais n'oblige jamais à refilmer.",
      },
      {
        q: "Que deviennent les vidéos et les données ?",
        a: "Chaque producteur ne voit que les siennes, et chaque lien expire et peut être révoqué. Les vidéos remplacées ou retirées sont supprimées au bout de sept jours. Ce site n'utilise ni cookies ni suivi.",
      },
      {
        q: "Comment l'essayer ?",
        a: "Demandez une démonstration depuis la page de contact. Nous vous montrons le pilote en vingt minutes et voyons s'il correspond à votre façon de travailler.",
      },
    ],
  },
  cropsHub: {
    title: "Prévision de récolte par culture",
    lead: "Chaque culture mûrit, se cache dans les feuilles et se récolte à sa manière. Voici les cultures du pilote d'Atias.",
    note: "Chaque nouvelle culture demande son propre entraînement et sa validation avant d'être proposée.",
  },
  crops: {
    "tomate-cherry": {
      name: "Tomate cerise",
      title: "Estimation de récolte de tomate cerise sous serre",
      seoTitle: "Estimation de récolte de tomate cerise en vidéo | Atias",
      seoDescription:
        "Prévision de récolte de tomate cerise : Atias compte les fruits mûrs de chaque grappe et tronçon de rang par vision artificielle et prévoit les kilos de la semaine.",
      lead: "Beaucoup de petits fruits, en grappes et à différentes hauteurs : la tomate cerise est l'une des cultures les plus difficiles à estimer à l'œil.",
      sections: [
        {
          heading: "Ce qui complique l'estimation",
          body: "Une grappe réunit des fruits verts, tournants et mûrs à la fois, et beaucoup sont cachés par les feuilles ou d'autres fruits. Compter quelques plantes à la main prend du temps et représente rarement tout le rang.",
        },
        {
          heading: "Ce que compte Atias",
          body: "Le détecteur repère chaque fruit dans la vidéo et décide de sa maturité par la couleur. Chaque fruit est compté une fois et attribué à son tronçon de rang : on voit où se concentre la production.",
        },
        {
          heading: "Des fruits aux kilos",
          body: "Les fruits mûrs sont convertis en kilos avec le poids moyen de la variété, et la température réelle de la serre indique combien mûriront dans la semaine.",
        },
      ],
      testing: "Dans le pilote, nous vérifions le poids moyen par fruit de chaque variété et la part de fruits cachée par les feuilles.",
    },
    pimiento: {
      name: "Poivron",
      title: "Estimation de récolte de poivron sous serre",
      seoTitle: "Estimation de récolte de poivron en vidéo | Atias",
      seoDescription:
        "Prévision de récolte de poivron : Atias compte les fruits de chaque tronçon de rang par vision artificielle, juge la maturité à la couleur et prévoit les kilos.",
      lead: "De gros fruits lourds cachés dans un feuillage dense : en poivron, chaque fruit oublié pèse lourd dans les kilos.",
      sections: [
        {
          heading: "Ce qui complique l'estimation",
          body: "Le fruit pousse contre la tige et sous les feuilles, et le changement de couleur avance à des rythmes différents selon la plante et la chaleur. Quelques fruits par plante changent beaucoup le total.",
        },
        {
          heading: "Ce que compte Atias",
          body: "Le détecteur repère chaque poivron dans la vidéo de chaque côté du rang, décide de sa maturité par la couleur et le compte une seule fois même s'il apparaît sur plusieurs images.",
        },
        {
          heading: "Des fruits aux kilos",
          body: "Les fruits sont convertis en kilos avec le poids moyen de la variété. La température réelle de la serre, heure par heure, indique comment la couleur avancera dans la semaine.",
        },
      ],
      testing: "Dans le pilote, nous vérifions le poids moyen par fruit et le nombre de fruits cachés derrière les feuilles.",
    },
    pepino: {
      name: "Concombre",
      title: "Estimation de récolte de concombre sous serre",
      seoTitle: "Estimation de récolte de concombre en vidéo | Atias",
      seoDescription:
        "Prévision de récolte de concombre : Atias compte les concombres de chaque tronçon de rang par vision artificielle, repère le calibre et prévoit les kilos.",
      lead: "Le concombre pousse vite et se récolte presque tous les jours. Et il est aussi vert que les feuilles qui l'entourent.",
      sections: [
        {
          heading: "Ce qui complique l'estimation",
          body: "Un concombre passe de petit à prêt à récolter en quelques jours, et sa couleur se confond avec le feuillage. La maturité se voit au calibre, pas à la couleur.",
        },
        {
          heading: "Ce que compte Atias",
          body: "Le détecteur distingue le concombre des feuilles et décide s'il est prêt d'après son calibre. Chaque fruit est compté une fois et attribué à son tronçon de rang.",
        },
        {
          heading: "Des fruits aux kilos",
          body: "Les concombres au calibre sont convertis en kilos avec le poids moyen de la variété, et le rythme de croissance est ajusté avec la température réelle de la serre.",
        },
      ],
      testing: "Dans le pilote, nous vérifions le détecteur sur des vidéos de serres réelles et le poids moyen par fruit.",
    },
  },
  tour: {
    "eyebrow": "Le parcours",
    "title": "Descendez et parcourez le rang avec Atias",
    "hint": "Faites défiler pour avancer dans la serre",
    "tag": "Reconstitution animée",
    "counted": "fruits mûrs comptés",
    "steps": [
      {
        "label": "Tomate cerise",
        "title": "Fruit par fruit, grappe par grappe",
        "body": "La caméra parcourt le rang et marque chaque tomate mûre à sa couleur. Les vertes ne comptent pas encore."
      },
      {
        "label": "Concombre",
        "title": "Caché sous les grandes feuilles",
        "body": "Elle distingue le concombre de la plante et juge s'il est prêt à son calibre."
      },
      {
        "label": "Poivron",
        "title": "Dans le buisson bas et dense",
        "body": "Elle compte chaque poivron mûr, rouge ou jaune, tronçon par tronçon."
      },
      {
        "label": "La coopérative",
        "title": "Du rang aux kilos",
        "body": "Ce qui est compté dans chaque tronçon devient des kilos du lundi au vendredi, avec leur marge, et les cueilleurs nécessaires."
      },
      {
        "label": "Toute la serre",
        "title": "Et ensuite, soigner la plante",
        "body": "La même caméra pourra voir ravageurs, maladies et l'état de chaque plante. Atias recommande ; le technicien décide."
      }
    ]
  },
  results: {
    "eyebrow": "Résultats du pilote",
    "title": "Ce que nous avons mesuré face à la balance",
    "lead": "Mesuré sur {greenhouses} et {weeks}, en comparant chaque prévision aux kilos récoltés.",
    "greenhouse": {
      "one": "1 serre",
      "other": "{n} serres"
    },
    "week": {
      "one": "1 semaine",
      "other": "{n} semaines"
    },
    "asOf": "Données au {date}",
    "source": "Prévision",
    "error": "Erreur sur les kilos de la semaine",
    "bias": "Biais",
    "sources": {
      "atias": "Atias",
      "agricultor": "Producteur",
      "tecnico": "Technicien"
    },
    "control": "Comptage de la caméra face au comptage manuel dans les tronçons de contrôle : {value} d'écart.",
    "method": "Erreur : écart entre la prévision et la récolte, en pourcentage des kilos récoltés. Biais positif : surestimation.",
    "caution": "Avec moins de 8 semaines mesurées, le résultat oriente mais ne prouve pas."
  },
  vision: {
    "eyebrow": "Vision",
    "title": "De compter les fruits à soigner toute la serre",
    "lead": "La caméra qui compte les fruits mûrs peut aussi voir les ravageurs, les maladies et l'état de chaque plante. Nous commençons par la récolte, car elle se vérifie sur la balance ; le reste viendra version après version.",
    "roadmapTitle": "Feuille de route",
    "roadmapLead": "Chaque version s'appuie sur la précédente et ne commence que lorsque celle-ci a prouvé qu'elle fonctionne.",
    "versions": [
      {
        "version": "0.9",
        "name": "Pilote",
        "when": "Maintenant",
        "line": "Mesurer la prévision de récolte dans de vraies serres face à ce qui est récolté.",
        "items": [
          "Une vidéo par rang filmée au téléphone",
          "Comptage des fruits mûrs par tronçon de rang",
          "Comparaison avec la prévision du producteur et du technicien"
        ]
      },
      {
        "version": "1.0",
        "name": "Première saison",
        "when": "Ensuite",
        "line": "La coopérative utilise Atias chaque semaine pour décider quoi vendre et qui embaucher.",
        "items": [
          "Fonctionnement dans le cloud",
          "Connexion au système de gestion de la coopérative",
          "Précision mesurée semaine après semaine"
        ]
      },
      {
        "version": "1.x",
        "name": "Amélioration continue",
        "when": "Pendant la saison",
        "line": "Affiner la prévision avec ce que l'on apprend chaque semaine.",
        "items": [
          "Capteurs dans la serre",
          "Alertes quand il manque un rang ou qu'une vidéo est ratée",
          "Rapports hebdomadaires"
        ]
      },
      {
        "version": "2.0",
        "name": "Sans filmer à la main",
        "when": "Plus tard",
        "line": "Plus personne ne filme, et la récolte du jour est connue avant la pesée.",
        "items": [
          "Une caméra qui parcourt le rang sur un rail",
          "Les kilos de chaque caisse des cueilleurs"
        ]
      },
      {
        "version": "3.0",
        "name": "Santé des plantes",
        "when": "Plus tard",
        "line": "Trouver ravageurs et maladies avant qu'ils ne s'étendent.",
        "items": [
          "Détection sur la plante et sur les pièges chromatiques",
          "Carte des foyers par rang",
          "Alerte de risque selon le climat et quoi faire dans chaque zone"
        ]
      },
      {
        "version": "4.0",
        "name": "État de la plante",
        "when": "Plus tard",
        "line": "Savoir comment va chaque zone de la culture et comment la conduire.",
        "items": [
          "Stress hydrique et irrigation",
          "Nutrition",
          "Croissance, floraison et nouaison",
          "Climat de la serre"
        ]
      }
    ],
    "principleEyebrow": "Notre principe",
    "principleTitle": "Atias recommande, le technicien décide",
    "principleBody": "Atias ne remplace personne : il donne des yeux sur chaque rang à ceux qui connaissent la culture. Les décisions de vente, de traitement et de conduite restent humaines.",
    "closeTitle": "Envie de voir le pilote ?"
  },
};
