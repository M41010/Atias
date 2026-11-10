/**
 * Textos pensados para buscadores en español: títulos y descripciones de cada página, la guía de
 * aforo, las preguntas frecuentes y las páginas de cultivo. Es la referencia de las traducciones.
 * Reglas: sin cifras de precisión que no estén medidas, sin clientes y sin nombrar la empresa del
 * piloto ni su zona concreta.
 */
export const contentEs = {
  seo: {
    home: {
      title: "Previsión de cosecha en invernadero con vídeo | Atias",
      description:
        "Atias cuenta la fruta madura con un vídeo por hilera grabado con el móvil y prevé los kilos de cada día y los temporeros necesarios. Piloto en curso.",
    },
    company: {
      title: "Quiénes somos · Previsión de cosecha en invernadero | Atias",
      description:
        "Atias nace en el sur de España para que la previsión de cosecha de hortícolas salga de la fruta que hay en la planta, con su margen y comprobable.",
    },
    product: {
      title: "Aforo de cosecha con visión artificial: el producto | Atias",
      description:
        "Grabar con el móvil, contar cada fruto con visión artificial, prever los kilos de lunes a viernes y calcular los temporeros. Así funciona Atias.",
    },
    contact: {
      title: "Pide una demostración de Atias | Previsión de cosecha",
      description:
        "Cuéntanos qué cultivas y te enseñamos el piloto de Atias en una llamada de veinte minutos: aforo de cosecha y temporeros a partir de vídeo.",
    },
    guide: {
      title: "Aforo de cosecha en invernadero: métodos y errores | Atias",
      description:
        "Qué es el aforo de cosecha, cómo se hace hoy en invernadero (a ojo, por muestreo, con histórico), por qué falla y cómo ayuda contar la fruta con vídeo.",
    },
    faq: {
      title: "Preguntas frecuentes sobre la previsión de cosecha | Atias",
      description:
        "Cultivos, grabación con el móvil, precisión, temporeros, datos y piloto: respuestas claras sobre cómo funciona la previsión de cosecha de Atias.",
    },
    crops: {
      title: "Previsión de cosecha por cultivo de invernadero | Atias",
      description:
        "Aforo de tomate cherry, pimiento y pepino en invernadero con visión artificial: qué cuenta Atias en cada cultivo y qué está aún en pruebas.",
    },
    vision: {
      "title": "Visión: de contar fruta a cuidar el invernadero | Atias",
      "description": "Hacia dónde va Atias: de la previsión de cosecha a la sanidad vegetal y el estado de la planta, versión a versión. Atias recomienda y el técnico decide."
    },
    notice: { title: "Aviso legal | Atias", description: "Aviso legal de la web de Atias." },
    privacy: { title: "Política de privacidad | Atias", description: "Política de privacidad de la web de Atias." },
  },
  links: {
    heroEyebrow: "Previsión de cosecha en invernadero",
    guide: "Guía del aforo de cosecha",
    faq: "Preguntas frecuentes",
    crops: "Cultivos",
    guideTeaser: "Cómo se hace hoy el aforo de cosecha y por qué falla",
    faqTeaser: "Resolvemos las dudas más habituales",
    cropTeaser: "Ver la página del cultivo",
    vision: "Visión",
    breadcrumb: "Ruta de navegación",
  },
  guide: {
    eyebrow: "Guía",
    title: "Aforo de cosecha en invernadero: cómo se hace y por qué falla",
    lead: "El aforo decide cuántos kilos se venden y cuántas personas se contratan cada semana. Repasamos los métodos habituales, sus límites y qué cambia al contar la fruta con vídeo.",
    updated: "Actualizado en noviembre de 2026",
    date: "2026-11-09",
    sections: [
      {
        heading: "Qué es el aforo de cosecha",
        paragraphs: [
          "El aforo de cosecha es la estimación, antes de recoger, de cuántos kilos va a dar una finca o un invernadero en un periodo. En hortícolas de invernadero se recoge varias veces por semana, así que el aforo también es semanal: cuántos kilos habrá cada día de lunes a viernes.",
          "De esa cifra dependen tres decisiones: cuánto se compromete con los clientes, cuántos temporeros se llaman y cuántos envases, camiones y turnos de almacén se preparan.",
        ],
      },
      {
        heading: "Cómo se hace hoy",
        paragraphs: [
          "A ojo: el técnico o el agricultor recorre el invernadero y estima la producción por experiencia. Es rápido y aprovecha mucho conocimiento, pero depende de quién lo haga y de cuánto pueda recorrer.",
          "Por muestreo: se cuentan los frutos de unas cuantas plantas y se multiplica por el total. Es más objetivo, pero unas pocas plantas rara vez representan a todo el invernadero, y contar a mano lleva tiempo.",
          "Con histórico: se parte de lo recogido en campañas anteriores en las mismas fechas. Sirve de referencia, pero no ve lo que pasa este año en la planta.",
          "Con clima: el calor acelera la maduración, y algunos modelos ajustan la previsión con la temperatura acumulada. Afinan el ritmo, pero necesitan saber cuánta fruta hay para empezar.",
        ],
      },
      {
        heading: "Por qué el aforo falla",
        paragraphs: [
          "La producción no es igual en todo el invernadero: cambia de una hilera a otra y dentro de la misma hilera. Una estimación que solo mira una parte arrastra ese error al total.",
          "Parte de la fruta queda tapada por las hojas, y la que está a punto de cambiar de color es fácil de pasar por alto. Además, una semana más calurosa de lo normal adelanta la maduración y desmonta una previsión hecha con días templados.",
          "Y casi nunca se mide el acierto: si no se compara la previsión con lo recogido cada día, no se sabe en qué falla ni cómo corregirla.",
        ],
      },
      {
        heading: "Qué cambia al contar con vídeo",
        paragraphs: [
          "Con un vídeo por hilera, grabado con el móvil caminando despacio, se puede contar toda la fruta visible y no solo una muestra. Un detector de visión artificial localiza cada fruto y lo sigue entre fotogramas para contarlo una sola vez, y lo asigna al tramo de hilera por el que pasaba la cámara.",
          "Los frutos se convierten en kilos con el peso medio de cada variedad, y la temperatura real de cada invernadero, hora a hora, indica cuánto madurará durante la semana. El resultado es una previsión diaria con su margen, que se puede seguir del total a la hilera y de la hilera a su vídeo.",
          "No es magia: hay fruta que la cámara no ve y el peso medio varía. Por eso cualquier sistema de este tipo tiene que compararse cada semana con la cosecha real antes de darlo por bueno.",
        ],
      },
      {
        heading: "Cómo saber si una previsión funciona",
        paragraphs: [
          "Pide que cada cifra venga con su margen y compárala, día a día, con lo que se recoge de verdad. Mira el error en kilos por día y por semana, y compáralo con el de la previsión que ya usas, por ejemplo la del técnico.",
          "Una buena previsión no es la que acierta una semana, sino la que acierta de forma estable y explica de dónde sale cada número.",
        ],
      },
      {
        heading: "Del aforo a los temporeros",
        paragraphs: [
          "Con los kilos previstos de cada día y lo que recoge una persona en un jornal en cada cultivo, se calcula cuántos temporeros hacen falta. Si el aforo es fiable, la cuadrilla se ajusta a la fruta que hay y no se paga de más ni se queda fruta sin recoger.",
        ],
      },
    ],
    ctaTitle: "¿Quieres ver cómo lo hace Atias?",
    ctaBody: "Te enseñamos el piloto con datos de ejemplo y te contamos qué estamos comprobando con cosecha real.",
  },
  faq: {
    title: "Preguntas frecuentes",
    lead: "Lo que más nos preguntan cooperativas, agricultores y técnicos sobre la previsión de cosecha con vídeo.",
    items: [
      {
        q: "¿Qué es Atias?",
        a: "Un sistema de previsión de cosecha para invernadero. A partir de un vídeo por hilera grabado con el móvil, cuenta la fruta madura, prevé los kilos de cada día de lunes a viernes con su margen y calcula cuántos temporeros harán falta.",
      },
      {
        q: "¿Hace falta comprar cámaras o sensores?",
        a: "No. Se graba con el móvil del agricultor, que recibe un enlace propio cada semana. No hay que instalar nada en el invernadero ni crear contraseñas.",
      },
      {
        q: "¿Cómo se graba cada hilera?",
        a: "Caminando despacio por el pasillo, un vídeo por cada lado de la hilera. Al subirlo, Atias revisa la luz, la nitidez y la duración, y avisa si hay que repetirlo.",
      },
      {
        q: "¿Para qué cultivos sirve?",
        a: "El piloto trabaja con tomate cherry, pimiento y pepino. Cada cultivo nuevo necesita su propio entrenamiento y su validación antes de ofrecerse.",
      },
      {
        q: "¿Cuánto acierta?",
        a: "Aún no lo hemos medido con cosecha real, y no daremos una cifra hasta hacerlo. El objetivo es un error de hasta el 10 % en kilos. Cada previsión lleva su margen y se compara cada semana con lo recogido.",
      },
      {
        q: "¿Cómo calcula los temporeros?",
        a: "Divide los kilos previstos de cada día entre lo que recoge una persona en un jornal en cada familia de cultivo. La cooperativa puede ajustar ese rendimiento y ve el resultado al instante.",
      },
      {
        q: "¿Sustituye al técnico?",
        a: "No. Su previsión se pone junto a la de Atias y la cosecha real, día a día, para ver quién se acerca más y dónde corregir. El conocimiento del técnico sigue siendo clave.",
      },
      {
        q: "¿Qué pasa si no hay buena cobertura en el invernadero?",
        a: "La subida se reanuda sola donde se quedó. Una mala conexión retrasa el envío, pero no obliga a grabar de nuevo.",
      },
      {
        q: "¿Qué se hace con los vídeos y los datos?",
        a: "Cada agricultor solo ve lo suyo, y cada enlace caduca y se puede anular. Los vídeos sustituidos o quitados se borran a los siete días. La web no usa cookies ni seguimiento.",
      },
      {
        q: "¿Cómo puedo probarlo?",
        a: "Pide una demostración desde la página de contacto. Te enseñamos el piloto en una llamada de veinte minutos y vemos si encaja con vuestra forma de trabajar.",
      },
    ],
  },
  cropsHub: {
    title: "Previsión de cosecha por cultivo",
    lead: "Cada cultivo madura, se esconde entre las hojas y se recoge a su manera. Estos son los cultivos del piloto de Atias.",
    note: "Cada cultivo nuevo necesita su propio entrenamiento y validación antes de ofrecerse.",
  },
  crops: {
    "tomate-cherry": {
      name: "Tomate cherry",
      title: "Aforo de tomate cherry en invernadero",
      seoTitle: "Aforo de tomate cherry en invernadero con vídeo | Atias",
      seoDescription:
        "Previsión de cosecha de tomate cherry: Atias cuenta los frutos maduros de cada racimo y tramo de hilera con visión artificial y prevé los kilos de la semana.",
      lead: "Muchos frutos pequeños, en racimos y a distintas alturas: el tomate cherry es de los cultivos más difíciles de aforar a ojo.",
      sections: [
        {
          heading: "Qué complica el aforo",
          body: "Un racimo reúne frutos verdes, en viraje y maduros a la vez, y muchos quedan tapados por las hojas o por otros frutos. Contar unas pocas plantas a mano lleva tiempo y rara vez representa a toda la hilera.",
        },
        {
          heading: "Qué cuenta Atias",
          body: "El detector localiza cada fruto en el vídeo y decide su madurez por el color. Cada fruto se cuenta una sola vez y se asigna a su tramo de hilera, así que se ve dónde se concentra la producción.",
        },
        {
          heading: "De frutos a kilos",
          body: "Los frutos maduros se convierten en kilos con el peso medio de la variedad, y la temperatura real del invernadero indica cuántos madurarán durante la semana.",
        },
      ],
      testing: "En el piloto estamos comprobando el peso medio por fruto de cada variedad y cuánta fruta queda tapada por las hojas.",
    },
    pimiento: {
      name: "Pimiento",
      title: "Aforo de pimiento en invernadero",
      seoTitle: "Aforo de pimiento en invernadero con vídeo | Atias",
      seoDescription:
        "Previsión de cosecha de pimiento: Atias cuenta los frutos de cada tramo de hilera con visión artificial, decide su madurez por color y prevé los kilos.",
      lead: "Frutos grandes y pesados, pero escondidos entre un follaje denso: en pimiento, cada fruto que se escapa del aforo pesa mucho en los kilos.",
      sections: [
        {
          heading: "Qué complica el aforo",
          body: "El fruto crece pegado al tallo y bajo las hojas, y el cambio de color avanza a ritmos distintos según la planta y el calor. Un error de pocos frutos por planta se nota mucho en los kilos totales.",
        },
        {
          heading: "Qué cuenta Atias",
          body: "El detector localiza cada pimiento en el vídeo de cada lado de la hilera, decide su madurez por el color y lo cuenta una sola vez aunque aparezca en varios fotogramas.",
        },
        {
          heading: "De frutos a kilos",
          body: "Los frutos se convierten en kilos con el peso medio de la variedad. La temperatura real del invernadero, hora a hora, indica cuánto avanzará el color durante la semana.",
        },
      ],
      testing: "En el piloto estamos comprobando el peso medio por fruto y cuántos frutos quedan ocultos tras las hojas.",
    },
    pepino: {
      name: "Pepino",
      title: "Aforo de pepino en invernadero",
      seoTitle: "Aforo de pepino en invernadero con vídeo | Atias",
      seoDescription:
        "Previsión de cosecha de pepino: Atias cuenta los pepinos de cada tramo de hilera con visión artificial, decide cuáles tienen calibre y prevé los kilos.",
      lead: "El pepino crece deprisa y se recoge casi a diario. Además, es verde como las hojas que lo rodean.",
      sections: [
        {
          heading: "Qué complica el aforo",
          body: "Un pepino pasa de pequeño a listo para recoger en pocos días, y su color se confunde con el follaje. La madurez no se ve en el color, sino en el tamaño.",
        },
        {
          heading: "Qué cuenta Atias",
          body: "El detector distingue el pepino de las hojas y decide si está listo por su calibre. Cada fruto se cuenta una sola vez y se asigna a su tramo de hilera.",
        },
        {
          heading: "De frutos a kilos",
          body: "Los pepinos con calibre se convierten en kilos con el peso medio de la variedad, y el ritmo de crecimiento se ajusta con la temperatura real del invernadero.",
        },
      ],
      testing: "En el piloto estamos comprobando el detector con vídeos de invernaderos reales y el peso medio por fruto.",
    },
  },
  tour: {
    "eyebrow": "El recorrido",
    "title": "Baja y recorre la hilera con Atias",
    "hint": "Desplázate para avanzar por el invernadero",
    "tag": "Recreación animada",
    "counted": "frutos maduros contados",
    "steps": [
      {
        "label": "Tomate cherry",
        "title": "Fruto a fruto, racimo a racimo",
        "body": "La cámara recorre la hilera y marca cada tomate maduro por su color. Los verdes no cuentan todavía."
      },
      {
        "label": "Pepino",
        "title": "Escondido entre hojas grandes",
        "body": "Distingue el pepino de la planta y decide si ya está listo por su calibre."
      },
      {
        "label": "Pimiento",
        "title": "En la mata baja y tupida",
        "body": "Cuenta cada pimiento maduro, rojo o amarillo, tramo a tramo de la hilera."
      },
      {
        "label": "La cooperativa",
        "title": "De la hilera a los kilos",
        "body": "Lo contado en cada tramo se convierte en kilos de lunes a viernes, con su margen, y en los temporeros necesarios."
      },
      {
        "label": "Todo el invernadero",
        "title": "Y después, cuidar la planta",
        "body": "La misma cámara podrá ver plagas, enfermedades y cómo está cada planta. Atias recomienda; el técnico decide."
      }
    ]
  },
  results: {
    "eyebrow": "Resultados del piloto",
    "title": "Lo que hemos medido frente a la báscula",
    "lead": "Medido en {greenhouses} y {weeks}, comparando cada previsión con los kilos recogidos.",
    "greenhouse": {
      "one": "1 invernadero",
      "other": "{n} invernaderos"
    },
    "week": {
      "one": "1 semana",
      "other": "{n} semanas"
    },
    "asOf": "Datos a {date}",
    "source": "Previsión",
    "error": "Error en kilos de la semana",
    "bias": "Sesgo",
    "sources": {
      "atias": "Atias",
      "agricultor": "Agricultor",
      "tecnico": "Técnico"
    },
    "control": "Conteo de la cámara frente al conteo a mano en los tramos de control: {value} de diferencia.",
    "method": "Error: diferencia entre lo previsto y lo recogido, en porcentaje de los kilos recogidos. Sesgo positivo: se estima de más.",
    "caution": "Con menos de 8 semanas medidas, el resultado orienta pero no demuestra."
  },
  vision: {
    "eyebrow": "Visión",
    "title": "De contar fruta a cuidar todo el invernadero",
    "lead": "La misma cámara que cuenta la fruta madura puede ver plagas, enfermedades y cómo está cada planta. Empezamos por la cosecha porque se puede comprobar con la báscula; lo demás llega versión a versión.",
    "roadmapTitle": "Hoja de ruta",
    "roadmapLead": "Cada versión se apoya en la anterior y solo empieza cuando la anterior ha demostrado que funciona.",
    "versions": [
      {
        "version": "0.9",
        "name": "Piloto",
        "when": "Ahora",
        "line": "Medir la previsión de cosecha en invernaderos reales frente a lo recogido.",
        "items": [
          "Un vídeo por hilera grabado con el móvil",
          "Conteo de fruta madura por tramo de hilera",
          "Comparación con la previsión del agricultor y del técnico"
        ]
      },
      {
        "version": "1.0",
        "name": "Primera temporada",
        "when": "Siguiente",
        "line": "La cooperativa usa Atias cada semana para decidir qué vender y a quién contratar.",
        "items": [
          "Funcionamiento en la nube",
          "Conexión con el sistema de gestión de la cooperativa",
          "Precisión medida semana a semana"
        ]
      },
      {
        "version": "1.x",
        "name": "Mejora continua",
        "when": "Durante la temporada",
        "line": "Afinar la previsión con lo que se aprende cada semana.",
        "items": [
          "Sensores dentro del invernadero",
          "Avisos cuando falta una hilera o un vídeo sale mal",
          "Informes semanales"
        ]
      },
      {
        "version": "2.0",
        "name": "Sin grabar a mano",
        "when": "Más adelante",
        "line": "Que nadie tenga que grabar y saber lo recogido antes de pesarlo.",
        "items": [
          "Cámara que recorre la hilera sobre un raíl",
          "Kilos de cada caja de los temporeros"
        ]
      },
      {
        "version": "3.0",
        "name": "Sanidad vegetal",
        "when": "Más adelante",
        "line": "Encontrar plagas y enfermedades antes de que se extiendan.",
        "items": [
          "Detección en la planta y en las trampas cromáticas",
          "Mapa de focos por hilera",
          "Aviso de riesgo según el clima y qué hacer en cada zona"
        ]
      },
      {
        "version": "4.0",
        "name": "Estado de la planta",
        "when": "Más adelante",
        "line": "Saber cómo está cada zona del cultivo y cómo manejarla.",
        "items": [
          "Estrés hídrico y riego",
          "Nutrición",
          "Crecimiento, floración y cuajado",
          "Clima del invernadero"
        ]
      }
    ],
    "principleEyebrow": "Nuestro principio",
    "principleTitle": "Atias recomienda, el técnico decide",
    "principleBody": "Atias no sustituye a nadie: da ojos en cada hilera a quien conoce el cultivo. Las decisiones de venta, de tratamiento y de manejo siguen siendo de las personas.",
    "closeTitle": "¿Quieres ver el piloto?"
  },
  appTour: {
    "eyebrow": "La app por dentro",
    "title": "Así lo ve la cooperativa cada lunes",
    "lead": "Pantallas reales de la aplicación, con datos de ejemplo. Cada una responde a una decisión de la semana.",
    "sample": "Datos de ejemplo",
    "blurred": "Los nombres de las variedades aparecen difuminados.",
    "uiLanguage": "",
    "tabsLabel": "Pantallas de la aplicación",
    "screens": [
      {
        "id": "resumen",
        "name": "Resumen",
        "decision": "Cuántos kilos vender esta semana y con qué margen.",
        "alt": "Resumen semanal: previsión para la venta, temporeros necesarios y fruta madura observada, con avisos por hilera."
      },
      {
        "id": "prevision",
        "name": "Previsión diaria",
        "decision": "Cuánto se recoge cada día, al lado de la previsión del técnico.",
        "alt": "Tabla de kilos por día de lunes a viernes: real, previsión del técnico y previsión de Atias."
      },
      {
        "id": "invernadero",
        "name": "Invernadero",
        "decision": "Dónde está la fruta: cada invernadero, hilera y tramo.",
        "alt": "Detalle de un invernadero: fruta madura observada, previsión y kilos por día de recolección."
      },
      {
        "id": "temporeros",
        "name": "Temporeros",
        "decision": "Cuántas personas llamar para recogerlo de lunes a viernes.",
        "alt": "Temporeros necesarios para la semana, con el rango según la previsión y los kilos por jornal."
      },
      {
        "id": "precision",
        "name": "Precisión",
        "decision": "Cuánto acierta Atias frente a la báscula, junto al agricultor y el técnico.",
        "alt": "Pantalla de precisión: error de Atias, del agricultor y del técnico frente a lo recogido."
      }
    ]
  },
};

export type Content = typeof contentEs;
