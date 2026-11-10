import type { Content } from "./es";

/** Português (Portugal). A rever por um falante nativo antes de publicar. */
export const contentPt: Content = {
  seo: {
    home: {
      title: "Previsão de colheita em estufa a partir de vídeo | Atias",
      description:
        "A Atias conta a fruta madura com um vídeo por linha gravado no telemóvel e prevê os quilos de cada dia e os trabalhadores sazonais necessários. Piloto em curso.",
    },
    company: {
      title: "Quem somos · Previsão de colheita em estufa | Atias",
      description:
        "A Atias nasce no sul de Espanha para que a previsão de colheita hortícola parta da fruta que está na planta, com a sua margem e verificável.",
    },
    product: {
      title: "Estimativa de colheita com visão artificial | Atias",
      description:
        "Gravar com o telemóvel, contar cada fruto com visão artificial, prever os quilos de segunda a sexta e planear os sazonais: é assim que funciona a Atias.",
    },
    contact: {
      title: "Peça uma demonstração da Atias | Previsão de colheita",
      description:
        "Conte-nos o que cultiva e mostramos-lhe o piloto da Atias numa chamada de vinte minutos: estimativa de colheita e sazonais a partir de vídeo.",
    },
    guide: {
      title: "Estimativa de colheita em estufa: métodos e erros | Atias",
      description:
        "O que é a estimativa de colheita, como se faz hoje em estufa (a olho, por amostragem, com histórico), porque falha e como ajuda contar a fruta em vídeo.",
    },
    faq: {
      title: "Perguntas frequentes sobre previsão de colheita | Atias",
      description:
        "Culturas, gravação com o telemóvel, precisão, sazonais, dados e piloto: respostas claras sobre como funciona a previsão de colheita da Atias.",
    },
    crops: {
      title: "Previsão de colheita por cultura de estufa | Atias",
      description:
        "Estimativa de colheita de tomate cereja, pimento e pepino em estufa com visão artificial: o que a Atias conta em cada cultura e o que ainda está em teste.",
    },
    vision: {
      "title": "Visão: de contar fruta a cuidar da estufa | Atias",
      "description": "Para onde vai a Atias: da previsão de colheita à sanidade vegetal e ao estado da planta, versão a versão. A Atias recomenda, o técnico decide."
    },
    measure: {
      title: "Como medimos a precisão da previsão de colheita | Atias",
      description: "Comparamos cada previsão com os quilos pesados na balança, junto com a do agricultor e a do técnico. Método, critério dos 10 % e o que ainda está em teste.",
    },
    notice: { title: "Aviso legal | Atias", description: "Aviso legal do site da Atias." },
    privacy: { title: "Política de privacidade | Atias", description: "Política de privacidade do site da Atias." },
  },
  links: {
    heroEyebrow: "Previsão de colheita em estufa",
    guide: "Guia da estimativa de colheita",
    faq: "Perguntas frequentes",
    crops: "Culturas",
    guideTeaser: "Como se estima hoje a colheita e porque falha",
    faqTeaser: "Respostas às dúvidas mais comuns",
    cropTeaser: "Ver a página da cultura",
    vision: "Visão",
    measure: "Como medimos",
    breadcrumb: "Percurso de navegação",
  },
  guide: {
    eyebrow: "Guia",
    title: "Estimativa de colheita em estufa: como se faz e porque falha",
    lead: "A estimativa decide quantos quilos se vendem e quantas pessoas se contratam todas as semanas. Revemos os métodos habituais, os seus limites e o que muda ao contar a fruta em vídeo.",
    updated: "Atualizado em novembro de 2026",
    date: "2026-11-09",
    sections: [
      {
        heading: "O que é a estimativa de colheita",
        paragraphs: [
          "A estimativa de colheita é a previsão, antes de colher, de quantos quilos uma exploração ou uma estufa vai produzir num período. Nas hortícolas de estufa colhe-se várias vezes por semana, por isso a estimativa também é semanal: quantos quilos haverá em cada dia de segunda a sexta.",
          "Dessa cifra dependem três decisões: quanto se compromete com os clientes, quantos trabalhadores sazonais se chamam e quantas embalagens, camiões e turnos de armazém se preparam.",
        ],
      },
      {
        heading: "Como se faz hoje",
        paragraphs: [
          "A olho: o técnico ou o agricultor percorre a estufa e estima a produção pela experiência. É rápido e aproveita muito conhecimento, mas depende de quem o faz e de quanto consegue percorrer.",
          "Por amostragem: contam-se os frutos de algumas plantas e multiplica-se pelo total. É mais objetivo, mas poucas plantas raramente representam toda a estufa, e contar à mão leva tempo.",
          "Com histórico: parte-se do que se colheu nas campanhas anteriores nas mesmas datas. É uma referência útil, mas não vê o que acontece este ano na planta.",
          "Com o clima: o calor acelera a maturação, e alguns modelos ajustam a previsão com a temperatura acumulada. Afinam o ritmo, mas precisam de saber quanta fruta há à partida.",
        ],
      },
      {
        heading: "Porque a estimativa falha",
        paragraphs: [
          "A produção não é igual em toda a estufa: muda de uma linha para outra e dentro da mesma linha. Uma estimativa que só olha para uma parte leva esse erro para o total.",
          "Parte da fruta fica escondida pelas folhas, e a que está prestes a mudar de cor passa facilmente despercebida. Além disso, uma semana mais quente do que o normal antecipa a maturação e desfaz uma previsão feita com dias amenos.",
          "E quase nunca se mede o acerto: sem comparar a previsão com o que se colhe todos os dias, não se sabe onde falha nem como corrigi-la.",
        ],
      },
      {
        heading: "O que muda ao contar em vídeo",
        paragraphs: [
          "Com um vídeo por linha, gravado no telemóvel a caminhar devagar, pode contar-se toda a fruta visível e não só uma amostra. Um detetor de visão artificial localiza cada fruto e segue-o entre fotogramas para o contar uma só vez, e atribui-o ao troço de linha por onde a câmara passava.",
          "Os frutos convertem-se em quilos com o peso médio de cada variedade, e a temperatura real de cada estufa, hora a hora, indica quanto vai amadurecer durante a semana. O resultado é uma previsão diária com a sua margem, que se pode seguir do total à linha e da linha ao seu vídeo.",
          "Não é magia: há fruta que a câmara não vê e o peso médio varia. Por isso, qualquer sistema deste tipo tem de ser comparado todas as semanas com a colheita real antes de se confiar nele.",
        ],
      },
      {
        heading: "Como saber se uma previsão funciona",
        paragraphs: [
          "Peça que cada número venha com a sua margem e compare-o, dia a dia, com o que realmente se colhe. Veja o erro em quilos por dia e por semana, e compare-o com a previsão que já usa, por exemplo a do técnico.",
          "Uma boa previsão não é a que acerta numa semana, mas a que se mantém próxima de forma estável e explica de onde vem cada número.",
        ],
      },
      {
        heading: "Da estimativa aos sazonais",
        paragraphs: [
          "Com os quilos previstos para cada dia e o que uma pessoa colhe numa jorna em cada cultura, calcula-se quantos trabalhadores sazonais são precisos. Se a estimativa for fiável, a equipa ajusta-se à fruta que existe: sem jornas pagas a mais nem fruta por colher.",
        ],
      },
    ],
    ctaTitle: "Quer ver como a Atias o faz?",
    ctaBody: "Mostramos-lhe o piloto com dados de exemplo e contamos-lhe o que estamos a verificar com a colheita real.",
  },
  faq: {
    title: "Perguntas frequentes",
    lead: "O que cooperativas, agricultores e técnicos mais nos perguntam sobre a previsão de colheita a partir de vídeo.",
    items: [
      {
        q: "O que é a Atias?",
        a: "Um sistema de previsão de colheita para estufa. A partir de um vídeo por linha gravado no telemóvel, conta a fruta madura, prevê os quilos de cada dia de segunda a sexta com a sua margem e calcula quantos trabalhadores sazonais serão precisos.",
      },
      {
        q: "É preciso comprar câmaras ou sensores?",
        a: "Não. O agricultor grava com o seu próprio telemóvel através de um link pessoal que recebe todas as semanas. Não é preciso instalar nada na estufa nem criar palavras-passe.",
      },
      {
        q: "Como se grava cada linha?",
        a: "A caminhar devagar pelo corredor, um vídeo para cada lado da linha. Ao enviar, a Atias verifica a luz, a nitidez e a duração, e avisa se for preciso repetir.",
      },
      {
        q: "Para que culturas serve?",
        a: "O piloto trabalha com tomate cereja, pimento e pepino. Cada nova cultura precisa do seu próprio treino e validação antes de ser oferecida.",
      },
      {
        q: "Qual é a precisão?",
        a: "Ainda não a medimos com colheita real, e não daremos um número antes de o fazer. O objetivo é um erro de até 10 % em quilos. Cada previsão tem a sua margem e é comparada todas as semanas com o que se colhe.",
      },
      {
        q: "Como calcula os trabalhadores sazonais?",
        a: "Divide os quilos previstos de cada dia pelo que uma pessoa colhe numa jorna em cada família de culturas. A cooperativa pode ajustar esse rendimento e vê o resultado de imediato.",
      },
      {
        q: "Substitui o técnico?",
        a: "Não. A previsão dele fica ao lado da da Atias e da colheita real, dia a dia, para ver quem se aproxima mais e onde corrigir. O conhecimento do técnico continua a ser essencial.",
      },
      {
        q: "E se a rede for fraca na estufa?",
        a: "O envio retoma sozinho onde parou. Uma má ligação atrasa o envio, mas nunca obriga a gravar de novo.",
      },
      {
        q: "O que acontece aos vídeos e aos dados?",
        a: "Cada agricultor só vê os seus, e cada link expira e pode ser anulado. Os vídeos substituídos ou retirados são apagados ao fim de sete dias. Este site não usa cookies nem rastreio.",
      },
      {
        q: "Como posso experimentar?",
        a: "Peça uma demonstração na página de contacto. Mostramos-lhe o piloto numa chamada de vinte minutos e vemos se encaixa na vossa forma de trabalhar.",
      },
    ],
  },
  cropsHub: {
    title: "Previsão de colheita por cultura",
    lead: "Cada cultura amadurece, esconde-se entre as folhas e colhe-se à sua maneira. Estas são as culturas do piloto da Atias.",
    note: "Cada nova cultura precisa do seu próprio treino e validação antes de ser oferecida.",
  },
  crops: {
    "tomate-cherry": {
      name: "Tomate cereja",
      title: "Estimativa de colheita de tomate cereja em estufa",
      seoTitle: "Estimativa de colheita de tomate cereja com vídeo | Atias",
      seoDescription:
        "Previsão de colheita de tomate cereja: a Atias conta os frutos maduros de cada cacho e troço de linha com visão artificial e prevê os quilos da semana.",
      lead: "Muitos frutos pequenos, em cachos e a diferentes alturas: o tomate cereja é das culturas mais difíceis de estimar a olho.",
      sections: [
        {
          heading: "O que complica a estimativa",
          body: "Um cacho junta frutos verdes, a mudar de cor e maduros ao mesmo tempo, e muitos ficam escondidos pelas folhas ou por outros frutos. Contar à mão algumas plantas leva tempo e raramente representa toda a linha.",
        },
        {
          heading: "O que a Atias conta",
          body: "O detetor localiza cada fruto no vídeo e decide a sua maturação pela cor. Cada fruto conta-se uma só vez e é atribuído ao seu troço de linha, para se ver onde se concentra a produção.",
        },
        {
          heading: "De frutos a quilos",
          body: "Os frutos maduros convertem-se em quilos com o peso médio da variedade, e a temperatura real da estufa indica quantos vão amadurecer durante a semana.",
        },
      ],
      testing: "No piloto estamos a verificar o peso médio por fruto de cada variedade e quanta fruta fica escondida pelas folhas.",
    },
    pimiento: {
      name: "Pimento",
      title: "Estimativa de colheita de pimento em estufa",
      seoTitle: "Estimativa de colheita de pimento com vídeo | Atias",
      seoDescription:
        "Previsão de colheita de pimento: a Atias conta os frutos de cada troço de linha com visão artificial, decide a maturação pela cor e prevê os quilos.",
      lead: "Frutos grandes e pesados escondidos numa folhagem densa: no pimento, cada fruto que escapa à estimativa pesa muito nos quilos.",
      sections: [
        {
          heading: "O que complica a estimativa",
          body: "O fruto cresce junto ao caule e debaixo das folhas, e a mudança de cor avança a ritmos diferentes conforme a planta e o calor. Poucos frutos por planta fazem muita diferença no total.",
        },
        {
          heading: "O que a Atias conta",
          body: "O detetor localiza cada pimento no vídeo de cada lado da linha, decide a sua maturação pela cor e conta-o uma só vez, mesmo que apareça em vários fotogramas.",
        },
        {
          heading: "De frutos a quilos",
          body: "Os frutos convertem-se em quilos com o peso médio da variedade. A temperatura real da estufa, hora a hora, indica quanto vai avançar a cor durante a semana.",
        },
      ],
      testing: "No piloto estamos a verificar o peso médio por fruto e quantos frutos ficam escondidos atrás das folhas.",
    },
    pepino: {
      name: "Pepino",
      title: "Estimativa de colheita de pepino em estufa",
      seoTitle: "Estimativa de colheita de pepino com vídeo | Atias",
      seoDescription:
        "Previsão de colheita de pepino: a Atias conta os pepinos de cada troço de linha com visão artificial, identifica os que têm calibre e prevê os quilos.",
      lead: "O pepino cresce depressa e colhe-se quase todos os dias. Além disso, é tão verde como as folhas que o rodeiam.",
      sections: [
        {
          heading: "O que complica a estimativa",
          body: "Um pepino passa de pequeno a pronto para colher em poucos dias, e a sua cor confunde-se com a folhagem. A maturação vê-se no calibre, não na cor.",
        },
        {
          heading: "O que a Atias conta",
          body: "O detetor distingue o pepino das folhas e decide se está pronto pelo calibre. Cada fruto conta-se uma só vez e é atribuído ao seu troço de linha.",
        },
        {
          heading: "De frutos a quilos",
          body: "Os pepinos com calibre convertem-se em quilos com o peso médio da variedade, e o ritmo de crescimento ajusta-se com a temperatura real da estufa.",
        },
      ],
      testing: "No piloto estamos a verificar o detetor com vídeos de estufas reais e o peso médio por fruto.",
    },
  },
  tour: {
    "eyebrow": "O percurso",
    "title": "Desça e percorra a linha com a Atias",
    "hint": "Desloque para avançar pela estufa",
    "tag": "Recriação animada",
    "counted": "frutos maduros contados",
    "steps": [
      {
        "label": "Tomate-cereja",
        "title": "Fruto a fruto, cacho a cacho",
        "body": "A câmara percorre a linha e marca cada tomate maduro pela cor. Os verdes ainda não contam."
      },
      {
        "label": "Pepino",
        "title": "Escondido entre folhas grandes",
        "body": "Distingue o pepino da planta e decide pelo calibre se já está pronto."
      },
      {
        "label": "Pimento",
        "title": "Na mata baixa e densa",
        "body": "Conta cada pimento maduro, vermelho ou amarelo, troço a troço da linha."
      },
      {
        "label": "A cooperativa",
        "title": "Da linha aos quilos",
        "body": "O que se conta em cada troço transforma-se em quilos de segunda a sexta, com a sua margem, e nos apanhadores necessários."
      },
      {
        "label": "Toda a estufa",
        "title": "E depois, cuidar da planta",
        "body": "A mesma câmara poderá ver pragas, doenças e o estado de cada planta. A Atias recomenda; o técnico decide."
      }
    ]
  },
  results: {
    "eyebrow": "Resultados do piloto",
    "title": "O que medimos face à balança",
    "lead": "Medido em {greenhouses} e {weeks}, comparando cada previsão com os quilos colhidos.",
    "greenhouse": {
      "one": "1 estufa",
      "other": "{n} estufas"
    },
    "week": {
      "one": "1 semana",
      "other": "{n} semanas"
    },
    "asOf": "Dados a {date}",
    "source": "Previsão",
    "error": "Erro nos quilos da semana",
    "bias": "Enviesamento",
    "sources": {
      "atias": "Atias",
      "agricultor": "Agricultor",
      "tecnico": "Técnico"
    },
    "control": "Contagem da câmara face à contagem manual nos troços de controlo: {value} de diferença.",
    "method": "Erro: diferença entre a previsão e a colheita, em percentagem dos quilos colhidos. Enviesamento positivo: sobrestimar.",
    "caution": "Com menos de 8 semanas medidas, o resultado orienta mas não demonstra."
  },
  vision: {
    "eyebrow": "Visão",
    "title": "De contar fruta a cuidar de toda a estufa",
    "lead": "A mesma câmara que conta a fruta madura consegue ver pragas, doenças e o estado de cada planta. Começamos pela colheita porque se confirma na balança; o resto chega versão a versão.",
    "roadmapTitle": "Roteiro",
    "roadmapLead": "Cada versão apoia-se na anterior e só começa quando esta demonstrou que funciona.",
    "versions": [
      {
        "version": "0.9",
        "name": "Piloto",
        "when": "Agora",
        "line": "Medir a previsão de colheita em estufas reais face ao que se colhe.",
        "items": [
          "Um vídeo por linha gravado com o telemóvel",
          "Contagem da fruta madura por troço de linha",
          "Comparação com a previsão do agricultor e do técnico"
        ]
      },
      {
        "version": "1.0",
        "name": "Primeira campanha",
        "when": "A seguir",
        "line": "A cooperativa usa a Atias todas as semanas para decidir o que vender e quem contratar.",
        "items": [
          "Funcionamento na nuvem",
          "Ligação ao sistema de gestão da cooperativa",
          "Precisão medida semana a semana"
        ]
      },
      {
        "version": "1.x",
        "name": "Melhoria contínua",
        "when": "Durante a campanha",
        "line": "Afinar a previsão com o que se aprende cada semana.",
        "items": [
          "Sensores dentro da estufa",
          "Avisos quando falta uma linha ou um vídeo sai mal",
          "Relatórios semanais"
        ]
      },
      {
        "version": "2.0",
        "name": "Sem gravar à mão",
        "when": "Mais tarde",
        "line": "Ninguém precisa de gravar e a colheita do dia conhece-se antes da pesagem.",
        "items": [
          "Uma câmara que percorre a linha sobre um carril",
          "Os quilos de cada caixa dos apanhadores"
        ]
      },
      {
        "version": "3.0",
        "name": "Sanidade vegetal",
        "when": "Mais tarde",
        "line": "Encontrar pragas e doenças antes de se espalharem.",
        "items": [
          "Deteção na planta e nas armadilhas cromáticas",
          "Mapa de focos por linha",
          "Aviso de risco segundo o clima e o que fazer em cada zona"
        ]
      },
      {
        "version": "4.0",
        "name": "Estado da planta",
        "when": "Mais tarde",
        "line": "Saber como está cada zona da cultura e como a conduzir.",
        "items": [
          "Stress hídrico e rega",
          "Nutrição",
          "Crescimento, floração e vingamento",
          "Clima da estufa"
        ]
      }
    ],
    "principleEyebrow": "O nosso princípio",
    "principleTitle": "A Atias recomenda, o técnico decide",
    "principleBody": "A Atias não substitui ninguém: dá olhos em cada linha a quem conhece a cultura. As decisões de venda, tratamento e condução continuam a ser das pessoas.",
    "closeTitle": "Quer ver o piloto?"
  },
  measure: {
    eyebrow: "Como medimos",
    title: "A precisão mede-se na balança, não se promete",
    lead: "Quase ninguém no setor publica quanto a sua previsão falha. Nós publicamos o método antes do resultado, para que qualquer pessoa o possa verificar.",
    compareTitle: "O que comparamos",
    compare: [
      {
        name: "A Atias prevê",
        body: "Os quilos que se vão colher cada dia de segunda a sexta, a partir do vídeo de sábado.",
      },
      {
        name: "O agricultor e o técnico também",
        body: "Registamos a previsão deles antes da colheita, dia a dia e em separado.",
      },
      {
        name: "A balança decide",
        body: "Os quilos realmente colhidos são pesados todos os dias.",
      },
      {
        name: "Comparamos as três",
        body: "Todas as semanas vê-se quem esteve mais perto da colheita, e por quanto.",
      },
    ],
    metricsTitle: "Como calculamos o erro",
    formula: "erro = |quilos previstos − quilos colhidos| ÷ quilos colhidos",
    metrics: [
      {
        name: "Erro da semana",
        body: "Soma-se quanto falha cada estufa e divide-se por tudo o que foi colhido. Assim, uma colheita pequena não dispara a percentagem.",
      },
      {
        name: "Enviesamento",
        body: "Se a previsão tende a ficar abaixo ou a passar. Um enviesamento estável pode ser corrigido.",
      },
      {
        name: "Margem de confiança",
        body: "Com poucas semanas, o erro real pode ser maior do que o medido. Calculamos entre que valores está, com 90 % de confiança.",
      },
      {
        name: "Semanas dentro do objetivo",
        body: "Quantas semanas o erro ficou em 10 % ou menos.",
      },
    ],
    criteriaTitle: "Quando dizemos que os 10 % se cumprem",
    criteriaLead: "Só se as quatro condições se verificarem ao mesmo tempo:",
    criteria: [
      "Todos os dados são reais: nada simulado nos vídeos, nos parâmetros ou na colheita.",
      "As semanas avaliadas não foram usadas para calibrar o sistema.",
      "Há pelo menos 8 semanas e estufas medidas.",
      "Até o extremo alto da margem de confiança fica em 10 % ou menos.",
    ],
    criteriaNote: "Mesmo assim, o resultado vale para essa estufa, essa cultura e essa forma de gravar. Antes de o afirmar noutro sítio, mede-se de novo.",
    linksTitle: "Onde se perde a precisão",
    linksLead: "O erro total não diz o que falha. Medimos cada elo em separado:",
    links: [
      {
        name: "A contagem da câmara",
        body: "Em troços de controlo marcados com fita, a fruta é contada à mão e comparada com o que a Atias contou no mesmo troço de linha.",
      },
      {
        name: "A fruta escondida",
        body: "Nesses troços conta-se também a que só se vê afastando as folhas: a que nenhuma câmara vê a partir do corredor.",
      },
      {
        name: "O peso por fruto",
        body: "Pesa-se uma amostra de frutos para passar de frutos contados a quilos.",
      },
      {
        name: "A maturação",
        body: "O que amadurece depois de gravar reparte-se segundo o calor de cada dia e confronta-se com a colheita.",
      },
    ],
    statusTitle: "O que está provado e o que não está",
    proven: {
      name: "Provado",
      body: "O sistema funciona de ponta a ponta: envio do vídeo, contagem por troço, quilos por dia e comparação automática com a balança.",
    },
    testing: {
      name: "Em teste",
      body: "A precisão real. Em novembro de 2026 começámos a medi-la numa estufa real. Vamos publicar o resultado com este método, seja bom ou mau.",
    },
    closeTitle: "Medimos nas suas estufas?",
  },
  pilotOffer: {
    badge: "Piloto grátis de 4 semanas",
    eyebrow: "Piloto grátis",
    title: "Experimente 4 semanas nas suas estufas, sem custos",
    lead: "Todas as semanas, compare a nossa previsão com o que marca a sua balança. Se não lhe servir, não perdeu nada.",
    steps: [
      {
        name: "Grave uma vez por semana",
        body: "Um vídeo por linha e por lado com o telemóvel, antes da semana de colheita.",
      },
      {
        name: "Registe os quilos colhidos",
        body: "Os quilos de cada dia, como já os pesam hoje. Também a sua própria previsão, se a quiser comparar.",
      },
      {
        name: "Compare com a sua balança",
        body: "Todas as semanas vê a nossa previsão face ao que foi colhido, com o seu erro medido.",
      },
    ],
    note: "Aberto a cooperativas e agricultores de qualquer país.",
    cta: "Quero um piloto",
    interestLabel: "O que lhe interessa?",
    interests: {
      piloto: "Piloto grátis de 4 semanas",
      demo: "Uma demonstração",
      otro: "Outra coisa",
    },
  },
  appTour: {
    "eyebrow": "A aplicação por dentro",
    "title": "O que a cooperativa vê todas as segundas-feiras",
    "lead": "Ecrãs reais da aplicação, com dados de exemplo. Cada um responde a uma decisão da semana.",
    "sample": "Dados de exemplo",
    "blurred": "Os nomes das variedades aparecem desfocados.",
    "uiLanguage": "A aplicação é mostrada em espanhol.",
    "tabsLabel": "Ecrãs da aplicação",
    "screens": [
      {
        "id": "resumen",
        "name": "Resumo",
        "decision": "Quantos quilos vender esta semana, e com que margem.",
        "alt": "Resumo semanal: previsão de venda, trabalhadores necessários e fruta madura observada, com avisos por linha."
      },
      {
        "id": "prevision",
        "name": "Previsão diária",
        "decision": "Quanto se colhe cada dia, ao lado da previsão do técnico.",
        "alt": "Quilos por dia de segunda a sexta: real, previsão do técnico e previsão da Atias."
      },
      {
        "id": "invernadero",
        "name": "Estufa",
        "decision": "Onde está a fruta: cada estufa, linha e troço.",
        "alt": "Detalhe de uma estufa: fruta madura observada, previsão e quilos por dia de colheita."
      },
      {
        "id": "temporeros",
        "name": "Trabalhadores",
        "decision": "Quantas pessoas chamar para colher de segunda a sexta.",
        "alt": "Trabalhadores necessários para a semana, com o intervalo segundo a previsão e os quilos por jornada."
      },
      {
        "id": "precision",
        "name": "Precisão",
        "decision": "Quanto acerta a Atias face à balança, ao lado do agricultor e do técnico.",
        "alt": "Ecrã de precisão: erro da Atias, do agricultor e do técnico face ao que se colhe."
      }
    ]
  },
  dataTrust: {
    "eyebrow": "Os seus dados",
    "title": "O que acontece aos seus vídeos, sem letra miudinha",
    "lead": "É assim que funciona hoje, tal como está programado.",
    "points": [
      {
        "name": "Uma ligação por estufa e semana",
        "body": "O agricultor não precisa de conta. A sua ligação só abre a sua estufa e a sua semana, expira ao começar a colheita e a cooperativa pode anulá-la."
      },
      {
        "name": "A cooperativa, com palavra-passe",
        "body": "Os seus ecrãs pedem utilizador e palavra-passe. As palavras-passe não são guardadas em claro e as tentativas falhadas repetidas são bloqueadas."
      },
      {
        "name": "Os vídeos não saem da Atias",
        "body": "São contados pelo nosso próprio detetor. Para a meteorologia só se usa a localização da estufa."
      },
      {
        "name": "O que se retira, apaga-se",
        "body": "Se o agricultor substituir ou retirar um vídeo, o anterior é apagado de vez ao fim de sete dias."
      }
    ],
    "pending": "O prazo para apagar os vídeos em uso ainda não está fixado.",
    "more": "Mais sobre segurança e dados"
  },
};
