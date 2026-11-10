import type { Content } from "./es";

/** English. Pending review by a native speaker before publishing. */
export const contentEn: Content = {
  seo: {
    home: {
      title: "Greenhouse harvest forecasting from video | Atias",
      description:
        "Atias counts ripe fruit from one phone video per row and forecasts each day's kilos and the pickers you will need. Pilot in progress.",
    },
    company: {
      title: "About us · Greenhouse harvest forecasting | Atias",
      description:
        "Atias was born in southern Spain so that vegetable harvest forecasts come from the fruit on the plant, with a margin and open to checking.",
    },
    product: {
      title: "Crop yield estimation with computer vision | Atias",
      description:
        "Record with a phone, count every fruit with computer vision, forecast kilos from Monday to Friday and plan pickers. This is how Atias works.",
    },
    contact: {
      title: "Request an Atias demo | Harvest forecasting",
      description:
        "Tell us what you grow and we will show you the Atias pilot in a twenty-minute call: yield estimation and picker planning from video.",
    },
    guide: {
      title: "Greenhouse crop yield estimation: methods and errors | Atias",
      description:
        "What yield estimation is, how it is done in greenhouses today (by eye, by sampling, from history), why it fails and how counting fruit on video helps.",
    },
    faq: {
      title: "Harvest forecasting: frequently asked questions | Atias",
      description:
        "Crops, phone recording, accuracy, pickers, data and the pilot: clear answers about how Atias harvest forecasting works.",
    },
    crops: {
      title: "Harvest forecasting by greenhouse crop | Atias",
      description:
        "Yield estimation for greenhouse cherry tomato, pepper and cucumber with computer vision: what Atias counts in each crop and what is still being tested.",
    },
    vision: {
      "title": "Vision: from counting fruit to caring for the greenhouse | Atias",
      "description": "Where Atias is heading: from harvest forecasting to plant health and crop condition, one version at a time. Atias recommends, the agronomist decides."
    },
    measure: {
      title: "How we measure harvest forecast accuracy | Atias",
      description: "We compare every forecast with the kilos weighed on the scales, alongside the grower's and the agronomist's. Method, the 10 % criterion and what is still being tested.",
    },
    investors: {
      title: "Investors and partners: invest in Atias | Atias",
      description: "Atias counts the fruit in every row to forecast greenhouse harvests. We are looking for investors and partners to help take it to its first season.",
    },
    journal: {
      title: "Pilot journal: how Atias is progressing | Atias",
      description: "Dated news from the Atias pilot: from the first prototype to the first recording in a real greenhouse. Facts only, no unmeasured figures.",
    },
    notice: { title: "Legal notice | Atias", description: "Legal notice for the Atias website." },
    privacy: { title: "Privacy policy | Atias", description: "Privacy policy for the Atias website." },
  },
  links: {
    heroEyebrow: "Greenhouse harvest forecasting",
    guide: "Yield estimation guide",
    faq: "FAQ",
    crops: "Crops",
    guideTeaser: "How yield estimation is done today and why it fails",
    faqTeaser: "Answers to the most common questions",
    cropTeaser: "See the crop page",
    vision: "Vision",
    measure: "How we measure",
    investors: "Investors",
    journal: "Pilot journal",
    breadcrumb: "Breadcrumb",
  },
  guide: {
    eyebrow: "Guide",
    title: "Greenhouse crop yield estimation: how it is done and why it fails",
    lead: "Yield estimates decide how many kilos are sold and how many people are hired each week. We review the usual methods, their limits and what changes when fruit is counted on video.",
    updated: "Updated November 2026",
    date: "2026-11-09",
    sections: [
      {
        heading: "What crop yield estimation is",
        paragraphs: [
          "Yield estimation is the forecast, before picking, of how many kilos a farm or greenhouse will produce over a period. Greenhouse vegetables are picked several times a week, so the estimate is weekly too: how many kilos there will be each day from Monday to Friday.",
          "Three decisions depend on that figure: how much is promised to customers, how many pickers are called in and how many boxes, lorries and packhouse shifts are prepared.",
        ],
      },
      {
        heading: "How it is done today",
        paragraphs: [
          "By eye: the agronomist or grower walks the greenhouse and estimates production from experience. It is fast and draws on a lot of knowledge, but it depends on who does it and how much they can cover.",
          "By sampling: the fruit on a few plants is counted and multiplied by the total. It is more objective, but a few plants rarely represent the whole greenhouse, and counting by hand takes time.",
          "From history: the starting point is what was picked in previous seasons on the same dates. It is a useful reference, but it cannot see what is happening on the plant this year.",
          "With climate: heat speeds up ripening, and some models adjust the forecast with accumulated temperature. They refine the pace, but they need to know how much fruit there is to begin with.",
        ],
      },
      {
        heading: "Why yield estimates fail",
        paragraphs: [
          "Production is not the same across the greenhouse: it changes from row to row and within the same row. An estimate that only looks at one part carries that error into the total.",
          "Some fruit is hidden by leaves, and fruit about to change colour is easy to miss. A week hotter than usual also brings ripening forward and breaks a forecast made in mild weather.",
          "And accuracy is rarely measured: if the forecast is not compared with what is picked each day, nobody knows where it fails or how to correct it.",
        ],
      },
      {
        heading: "What changes when you count on video",
        paragraphs: [
          "With one video per row, recorded on a phone while walking slowly, all visible fruit can be counted, not just a sample. A computer vision detector finds each fruit and tracks it across frames to count it only once, and assigns it to the stretch of row the camera was passing.",
          "Fruit is converted into kilos with the average weight of each variety, and the real temperature of each greenhouse, hour by hour, shows how much will ripen during the week. The result is a daily forecast with its margin that can be traced from the total to the row and from the row to its video.",
          "It is not magic: some fruit is out of the camera's sight and average weight varies. That is why any system like this must be compared with the real harvest every week before it is trusted.",
        ],
      },
      {
        heading: "How to tell whether a forecast works",
        paragraphs: [
          "Ask for every figure to come with its margin and compare it, day by day, with what is actually picked. Look at the error in kilos per day and per week, and compare it with the forecast you already use, such as the agronomist's.",
          "A good forecast is not one that gets a single week right, but one that is consistently close and explains where every number comes from.",
        ],
      },
      {
        heading: "From yield estimate to pickers",
        paragraphs: [
          "With each day's forecast kilos and what one person picks in a working day for each crop, you can work out how many pickers you need. If the estimate is reliable, the crew matches the fruit that is there: no paying for extra hands, no fruit left unpicked.",
        ],
      },
    ],
    ctaTitle: "Want to see how Atias does it?",
    ctaBody: "We will show you the pilot with sample data and tell you what we are testing against real harvests.",
  },
  faq: {
    title: "Frequently asked questions",
    lead: "What cooperatives, growers and agronomists ask us most about harvest forecasting from video.",
    items: [
      {
        q: "What is Atias?",
        a: "A harvest forecasting system for greenhouses. From one phone video per row, it counts ripe fruit, forecasts each day's kilos from Monday to Friday with a margin and works out how many pickers you will need.",
      },
      {
        q: "Do I need to buy cameras or sensors?",
        a: "No. Growers record with their own phone using a personal link they receive each week. Nothing is installed in the greenhouse and no passwords are needed.",
      },
      {
        q: "How is each row recorded?",
        a: "By walking slowly along the aisle, one video for each side of the row. When it is uploaded, Atias checks light, sharpness and length, and asks for a new one if needed.",
      },
      {
        q: "Which crops does it work with?",
        a: "The pilot covers cherry tomato, pepper and cucumber. Each new crop needs its own training and validation before it is offered.",
      },
      {
        q: "How accurate is it?",
        a: "We have not yet measured it against real harvests, and we will not give a figure until we have. The goal is an error of up to 10% in kilos. Every forecast comes with its margin and is compared with what is picked each week.",
      },
      {
        q: "How does it work out the number of pickers?",
        a: "It divides each day's forecast kilos by what one person picks in a working day for each crop family. The cooperative can adjust that rate and sees the result instantly.",
      },
      {
        q: "Does it replace the agronomist?",
        a: "No. Their forecast sits next to Atias' and the real harvest, day by day, to see who is closer and where to correct. The agronomist's knowledge is still key.",
      },
      {
        q: "What if coverage in the greenhouse is poor?",
        a: "The upload resumes on its own where it stopped. A bad connection delays sending, but never means recording again.",
      },
      {
        q: "What happens to the videos and data?",
        a: "Each grower only sees their own, and every link expires and can be revoked. Replaced or removed videos are deleted after seven days. This website uses no cookies or tracking.",
      },
      {
        q: "How can I try it?",
        a: "Request a demo from the contact page. We will show you the pilot in a twenty-minute call and see whether it fits the way you work.",
      },
    ],
  },
  cropsHub: {
    title: "Harvest forecasting by crop",
    lead: "Each crop ripens, hides among the leaves and is picked in its own way. These are the crops in the Atias pilot.",
    note: "Each new crop needs its own training and validation before it is offered.",
  },
  crops: {
    "tomate-cherry": {
      name: "Cherry tomato",
      title: "Greenhouse cherry tomato yield estimation",
      seoTitle: "Cherry tomato yield estimation from video | Atias",
      seoDescription:
        "Cherry tomato harvest forecasting: Atias counts the ripe fruit on every truss and stretch of row with computer vision and forecasts the week's kilos.",
      lead: "Lots of small fruit, in trusses and at different heights: cherry tomato is one of the hardest crops to estimate by eye.",
      sections: [
        {
          heading: "What makes it hard",
          body: "One truss holds green, turning and ripe fruit at the same time, and much of it is hidden by leaves or by other fruit. Counting a few plants by hand takes time and rarely represents the whole row.",
        },
        {
          heading: "What Atias counts",
          body: "The detector finds each fruit in the video and decides its ripeness by colour. Each fruit is counted once and assigned to its stretch of row, so you can see where production is concentrated.",
        },
        {
          heading: "From fruit to kilos",
          body: "Ripe fruit is converted into kilos with the variety's average weight, and the greenhouse's real temperature shows how much will ripen during the week.",
        },
      ],
      testing: "In the pilot we are checking the average weight per fruit of each variety and how much fruit is hidden by leaves.",
    },
    pimiento: {
      name: "Pepper",
      title: "Greenhouse pepper yield estimation",
      seoTitle: "Pepper yield estimation from video | Atias",
      seoDescription:
        "Pepper harvest forecasting: Atias counts the fruit in every stretch of row with computer vision, decides ripeness by colour and forecasts the kilos.",
      lead: "Large, heavy fruit hidden in dense foliage: in peppers, every fruit missed by the estimate weighs heavily on the kilos.",
      sections: [
        {
          heading: "What makes it hard",
          body: "The fruit grows close to the stem and under the leaves, and colour change moves at different speeds depending on the plant and the heat. A few fruit per plant make a big difference to total kilos.",
        },
        {
          heading: "What Atias counts",
          body: "The detector finds each pepper in the video of each side of the row, decides its ripeness by colour and counts it once even if it appears in several frames.",
        },
        {
          heading: "From fruit to kilos",
          body: "Fruit is converted into kilos with the variety's average weight. The greenhouse's real temperature, hour by hour, shows how far colour will advance during the week.",
        },
      ],
      testing: "In the pilot we are checking the average weight per fruit and how many fruit stay hidden behind the leaves.",
    },
    pepino: {
      name: "Cucumber",
      title: "Greenhouse cucumber yield estimation",
      seoTitle: "Cucumber yield estimation from video | Atias",
      seoDescription:
        "Cucumber harvest forecasting: Atias counts the cucumbers in every stretch of row with computer vision, decides which are ready by size and forecasts the kilos.",
      lead: "Cucumbers grow fast and are picked almost every day. They are also as green as the leaves around them.",
      sections: [
        {
          heading: "What makes it hard",
          body: "A cucumber goes from small to ready in a few days, and its colour blends into the foliage. Readiness shows in size, not colour.",
        },
        {
          heading: "What Atias counts",
          body: "The detector tells cucumbers apart from leaves and decides whether each one is ready by its size. Every fruit is counted once and assigned to its stretch of row.",
        },
        {
          heading: "From fruit to kilos",
          body: "Cucumbers at picking size are converted into kilos with the variety's average weight, and the growth rate is adjusted with the greenhouse's real temperature.",
        },
      ],
      testing: "In the pilot we are checking the detector on videos from real greenhouses and the average weight per fruit.",
    },
  },
  tour: {
    "eyebrow": "The walkthrough",
    "title": "Scroll down and walk the row with Atias",
    "hint": "Scroll to move through the greenhouse",
    "tag": "Animated recreation",
    "counted": "ripe fruits counted",
    "steps": [
      {
        "label": "Cherry tomato",
        "title": "Fruit by fruit, truss by truss",
        "body": "The camera runs along the row and marks every ripe tomato by its colour. Green ones don't count yet."
      },
      {
        "label": "Cucumber",
        "title": "Hidden among large leaves",
        "body": "It tells the cucumber apart from the plant and decides whether it is ready by its size."
      },
      {
        "label": "Pepper",
        "title": "In the low, dense bush",
        "body": "It counts every ripe pepper, red or yellow, section by section along the row."
      },
      {
        "label": "The cooperative",
        "title": "From the row to kilos",
        "body": "What is counted in each section becomes kilos from Monday to Friday, with a margin, and the pickers needed."
      },
      {
        "label": "The whole greenhouse",
        "title": "And then, caring for the plant",
        "body": "The same camera will be able to spot pests, diseases and how each plant is doing. Atias recommends; the agronomist decides."
      }
    ]
  },
  results: {
    "eyebrow": "Pilot results",
    "title": "What we measured against the scale",
    "lead": "Measured over {greenhouses} and {weeks}, comparing each forecast with the kilos picked.",
    "greenhouse": {
      "one": "1 greenhouse",
      "other": "{n} greenhouses"
    },
    "week": {
      "one": "1 week",
      "other": "{n} weeks"
    },
    "asOf": "Data as of {date}",
    "source": "Forecast",
    "error": "Error in weekly kilos",
    "bias": "Bias",
    "sources": {
      "atias": "Atias",
      "agricultor": "Grower",
      "tecnico": "Agronomist"
    },
    "control": "Camera count against the hand count in the control sections: {value} difference.",
    "method": "Error: difference between forecast and harvest, as a percentage of the kilos picked. Positive bias: overestimating.",
    "caution": "With fewer than 8 weeks measured, the result is a pointer, not proof."
  },
  vision: {
    "eyebrow": "Vision",
    "title": "From counting fruit to caring for the whole greenhouse",
    "lead": "The same camera that counts ripe fruit can spot pests, diseases and how each plant is doing. We start with the harvest because it can be checked on the scale; the rest comes one version at a time.",
    "roadmapTitle": "Roadmap",
    "roadmapLead": "Each version builds on the previous one and only starts once that one has proven it works.",
    "versions": [
      {
        "version": "0.9",
        "name": "Pilot",
        "when": "Now",
        "line": "Measure the harvest forecast in real greenhouses against what is picked.",
        "items": [
          "One phone video per row",
          "Ripe fruit counted per row section",
          "Compared with the grower's and the agronomist's forecast"
        ]
      },
      {
        "version": "1.0",
        "name": "First season",
        "when": "Next",
        "line": "The cooperative uses Atias every week to decide what to sell and whom to hire.",
        "items": [
          "Runs in the cloud",
          "Connected to the cooperative's management system",
          "Accuracy measured week by week"
        ]
      },
      {
        "version": "1.x",
        "name": "Continuous improvement",
        "when": "During the season",
        "line": "Sharpen the forecast with what is learned each week.",
        "items": [
          "Sensors inside the greenhouse",
          "Alerts when a row is missing or a video goes wrong",
          "Weekly reports"
        ]
      },
      {
        "version": "2.0",
        "name": "No more manual recording",
        "when": "Later",
        "line": "Nobody has to record, and the day's harvest is known before weighing.",
        "items": [
          "A camera that runs along the row on a rail",
          "Kilos in each picker's crate"
        ]
      },
      {
        "version": "3.0",
        "name": "Plant health",
        "when": "Later",
        "line": "Find pests and diseases before they spread.",
        "items": [
          "Detection on the plant and on sticky traps",
          "Map of hotspots per row",
          "Climate-based risk alerts and what to do in each zone"
        ]
      },
      {
        "version": "4.0",
        "name": "Crop condition",
        "when": "Later",
        "line": "Know how each zone of the crop is doing and how to manage it.",
        "items": [
          "Water stress and irrigation",
          "Nutrition",
          "Growth, flowering and fruit set",
          "Greenhouse climate"
        ]
      }
    ],
    "principleEyebrow": "Our principle",
    "principleTitle": "Atias recommends, the agronomist decides",
    "principleBody": "Atias replaces nobody: it gives the people who know the crop eyes on every row. Decisions on sales, treatments and crop management stay with people.",
    "closeTitle": "Want to see the pilot?"
  },
  measure: {
    eyebrow: "How we measure",
    title: "Accuracy is measured on the scales, not promised",
    lead: "Almost no one in the sector publishes how wrong their forecast is. We publish the method before the result, so anyone can check it.",
    compareTitle: "What we compare",
    compare: [
      {
        name: "Atias forecasts",
        body: "The kilos to be harvested each day from Monday to Friday, from Saturday's video.",
      },
      {
        name: "So do the grower and the agronomist",
        body: "We record their forecast before the harvest, day by day and separately.",
      },
      {
        name: "The scales decide",
        body: "The kilos actually harvested are weighed every day.",
      },
      {
        name: "We compare all three",
        body: "Each week shows who came closest to the harvest, and by how much.",
      },
    ],
    metricsTitle: "How we calculate the error",
    formula: "error = |forecast kilos − harvested kilos| ÷ harvested kilos",
    metrics: [
      {
        name: "Weekly error",
        body: "We add up how far off each greenhouse is and divide by everything harvested, so a small harvest does not inflate the percentage.",
      },
      {
        name: "Bias",
        body: "Whether the forecast tends to fall short or overshoot. A steady bias can be corrected.",
      },
      {
        name: "Confidence range",
        body: "With few weeks, the true error may be larger than the one measured. We calculate its range with 90 % confidence.",
      },
      {
        name: "Weeks on target",
        body: "How many weeks the error stayed at 10 % or less.",
      },
    ],
    criteriaTitle: "When we say the 10 % target is met",
    criteriaLead: "Only when all four conditions hold at once:",
    criteria: [
      "All data are real: nothing simulated in the videos, the parameters or the harvest.",
      "The weeks evaluated were not used to calibrate the system.",
      "At least 8 weeks and greenhouses have been measured.",
      "Even the high end of the confidence range stays at 10 % or less.",
    ],
    criteriaNote: "Even then, the result holds for that greenhouse, that crop and that way of filming. Before claiming it elsewhere, it is measured again.",
    linksTitle: "Where accuracy is lost",
    linksLead: "The total error does not say what fails. We measure each link separately:",
    links: [
      {
        name: "The camera count",
        body: "In control sections marked with tape, fruit is counted by hand and compared with what Atias counted on the same stretch of row.",
      },
      {
        name: "Hidden fruit",
        body: "In those sections we also count the fruit you only see by moving leaves: the fruit no camera sees from the aisle.",
      },
      {
        name: "Weight per fruit",
        body: "A sample of fruit is weighed to turn counted fruit into kilos.",
      },
      {
        name: "Ripening",
        body: "What ripens after filming is spread by each day's heat and checked against the harvest.",
      },
    ],
    statusTitle: "What is proven and what is not",
    proven: {
      name: "Proven",
      body: "The system works end to end: video upload, count per section, kilos per day and automatic comparison with the scales.",
    },
    testing: {
      name: "Being tested",
      body: "Real accuracy. In November 2026 we started measuring it in a real greenhouse. We will publish the result with this method, good or bad.",
    },
    closeTitle: "Shall we measure it in your greenhouses?",
  },
  pilotOffer: {
    badge: "Free 4-week pilot",
    eyebrow: "Free pilot",
    title: "Try it for 4 weeks in your greenhouses, free of charge",
    lead: "Every week, compare our forecast with what your scales say. If it does not help, you have lost nothing.",
    steps: [
      {
        name: "Film once a week",
        body: "One video per row and side with your phone, before the harvest week.",
      },
      {
        name: "Record the kilos harvested",
        body: "Each day's kilos, the way you already weigh them. Your own forecast too, if you want to compare it.",
      },
      {
        name: "Compare with your scales",
        body: "Every week you see our forecast against the harvest, with its error measured.",
      },
    ],
    note: "Open to cooperatives and growers in any country.",
    cta: "I want a pilot",
    interestLabel: "What are you interested in?",
    interests: {
      piloto: "Free 4-week pilot",
      demo: "A demo",
      otro: "Something else",
    },
  },
  appTour: {
    "eyebrow": "Inside the app",
    "title": "What the cooperative sees every Monday",
    "lead": "Real screens from the app, with sample data. Each one answers a decision for the week.",
    "sample": "Sample data",
    "blurred": "Variety names are generic.",
    "uiLanguage": "The app is shown in Spanish.",
    "tabsLabel": "App screens",
    "screens": [
      {
        "id": "resumen",
        "name": "Summary",
        "decision": "How many kilos to sell this week, and with what margin.",
        "alt": "Weekly summary: sales forecast, pickers needed and ripe fruit observed, with warnings per row."
      },
      {
        "id": "prevision",
        "name": "Daily forecast",
        "decision": "How much is picked each day, next to the agronomist's forecast.",
        "alt": "Kilos per day from Monday to Friday: actual, agronomist's forecast and Atias forecast."
      },
      {
        "id": "invernadero",
        "name": "Greenhouse",
        "decision": "Where the fruit is: each greenhouse, row and section.",
        "alt": "Greenhouse detail: ripe fruit observed, forecast and kilos per harvest day."
      },
      {
        "id": "temporeros",
        "name": "Pickers",
        "decision": "How many people to call in to pick it from Monday to Friday.",
        "alt": "Pickers needed for the week, with the range from the forecast and kilos per working day."
      },
      {
        "id": "precision",
        "name": "Accuracy",
        "decision": "How close Atias gets to the scales, next to the grower and the agronomist.",
        "alt": "Accuracy screen: error of Atias, the grower and the agronomist against the harvest."
      }
    ]
  },
  dataTrust: {
    "eyebrow": "Your data",
    "title": "What happens to your videos, no small print",
    "lead": "This is how it works today, exactly as it is built.",
    "points": [
      {
        "name": "One link per greenhouse and week",
        "body": "Growers need no account. Their link only opens their greenhouse and week, expires when the harvest starts and the cooperative can revoke it."
      },
      {
        "name": "The cooperative signs in",
        "body": "Its screens ask for a username and password. Passwords are not stored in plain text and repeated failed attempts are blocked."
      },
      {
        "name": "Videos stay within Atias",
        "body": "They are counted by our own detector. Only the greenhouse location is used to look up the weather."
      },
      {
        "name": "What is removed is deleted",
        "body": "If a grower replaces or removes a video, the old one is deleted for good after seven days."
      }
    ],
    "pending": "The retention period for current videos has not been set yet.",
    "more": "More on security and data"
  },
};
