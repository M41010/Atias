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
};
