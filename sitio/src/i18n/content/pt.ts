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
};
