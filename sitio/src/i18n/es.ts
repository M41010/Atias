/**
 * Textos en español: la referencia de todas las traducciones. Ninguna cifra de precisión ni
 * ningún cliente: el producto está en piloto. Lo marcado como pendiente lo debe completar la empresa.
 */
export const es = {
  meta: {
    title: "Atias · Cuenta la cosecha antes de recogerla",
    description:
      "Un vídeo por hilera, grabado con el móvil. Atias cuenta la fruta madura del invernadero y prevé los kilos de cada día y los temporeros necesarios. Piloto en curso.",
  },
  nav: {
    home: "Inicio",
    company: "Quiénes somos",
    product: "Producto",
    contact: "Contacto",
    vision: "Visión",
    pilot: "Piloto en curso",
    language: "Idioma",
    menu: "Menú",
    close: "Cerrar",
    skip: "Saltar al contenido",
  },
  cta: {
    demo: "Pide una demostración",
    how: "Cómo funciona",
  },
  counter: {
    title: "Invernadero de ejemplo",
    sample: "Datos inventados para mostrar el método",
    position: "Avanza por la hilera",
    replay: "Volver a contar",
    tramo: "Hilera",
    of: "de",
    ripe: "frutos maduros",
    kg: "kg previstos",
    range: "Entre {min} y {max} kg",
    workers: "temporeros",
    workersNote: "para recogerlo de lunes a viernes",
    legendObserved: "Verde: lo contado en el vídeo",
    legendForecast: "Ámbar: previsión, aún sin validar",
    legendRipe: "Fruto maduro",
    legendUnripe: "Fruto verde, aún no cuenta",
    tally: "Cada celda negra son 500 frutos maduros contados",
  },
  home: {
    heroTitle: "Cuenta la cosecha antes de recogerla.",
    heroLead:
      "Un vídeo por hilera, grabado con el móvil el sábado. Atias cuenta la fruta madura tramo a tramo y te dice cuántos kilos tendrás de lunes a viernes, con su margen, y cuántas personas harán falta para recogerlos.",
    problemTitle: "Cada semana se vende y se contrata a ojo.",
    problemBody: [
      "La cooperativa compromete kilos con sus clientes y llama a sus cuadrillas antes de saber cuánto va a madurar.",
      "Si se queda corta, incumple. Si se pasa, malvende o paga jornales de más. La previsión del técnico ayuda, pero nadie puede recorrer cada hilera contando fruta.",
    ],
    howTitle: "De una hilera grabada a la semana planificada.",
    steps: [
      {
        day: "Sábado",
        title: "Se graba",
        body: "El agricultor recorre cada hilera con el móvil, un vídeo por lado. Si la conexión se corta, la subida sigue donde se quedó.",
      },
      {
        day: "Domingo",
        title: "Se cuenta",
        body: "Atias revisa que el vídeo sirva y cuenta la fruta madura de cada tramo de hilera, una sola vez cada fruto.",
      },
      {
        day: "Lunes",
        title: "Se decide",
        body: "La cooperativa ve los kilos de cada día hasta el viernes, con su margen, y cuántos temporeros necesita.",
      },
    ],
    howLink: "Ver el producto en detalle",
    forTitle: "Para quién es.",
    audiences: [
      {
        who: "Cooperativas y comercializadoras",
        what: "Comprometer ventas y cuadrillas con una cifra que se puede comprobar, del total a la hilera y de la hilera a su vídeo.",
      },
      {
        who: "Agricultores",
        what: "Grabar con el móvil, sin aparatos nuevos ni contraseñas: un enlace propio para cada semana.",
      },
      {
        who: "Técnicos",
        what: "Poner su previsión junto a la de Atias y la cosecha real, día a día, para aprender qué falla y dónde.",
      },
      {
        who: "Inversores y socios",
        what: "Un piloto real en invernaderos del sur de España, con un método de validación definido desde el primer día.",
      },
    ],
    pilotTitle: "Lo que ya funciona y lo que estamos comprobando.",
    pilotLead: "Atias está en piloto. Preferimos enseñarte dónde estamos a prometerte una cifra que aún no hemos medido.",
    worksTitle: "Funciona",
    works: [
      "Subida de vídeos desde el móvil, también con mala cobertura.",
      "Revisión automática de luz, nitidez y duración de cada vídeo.",
      "Temperatura real hora a hora en cada invernadero, comparada con lo normal en esa época.",
      "Previsión diaria de lunes a viernes, junto a la del técnico.",
      "Panel de la cooperativa con kilos, márgenes, temporeros y avisos.",
    ],
    testingTitle: "Estamos comprobando",
    testing: [
      "El detector de fruta con vídeos de invernaderos reales.",
      "Cuánto acierta en kilos. El objetivo es un error de hasta el 10 %, y aún no está medido.",
      "El peso medio por fruto de cada variedad.",
      "Cuánta fruta queda tapada por las hojas.",
    ],
    closeTitle: "¿Lo vemos en vuestros invernaderos?",
    closeBody: "Te enseñamos el piloto en una llamada de veinte minutos y vemos si encaja con vuestra forma de trabajar.",
  },
  company: {
    title: "Quiénes somos",
    headline: "Escuchamos al campo. Ahora queremos cambiarlo.",
    lead: "Atias nació de conversaciones con gente que trabaja en invernaderos. Tiene raíces en el campo y la ambición de cambiar cómo se cultiva bajo plástico.",
    facts: [
      { value: "Oct. 2026", label: "Empezamos a construir Atias" },
      { value: "3", label: "Cultivos en el piloto: tomate cherry, pimiento y pepino" },
      { value: "1", label: "Invernadero real comparado con la báscula" },
      { value: "≤ 10 %", label: "El error que nos exigimos, medido frente a lo recogido" },
    ],
    forTitle: "Para quién trabajamos",
    forWho: [
      { name: "Cooperativas y comercializadoras", body: "Saber cuántos kilos vender y cuántos temporeros contratar, día a día." },
      { name: "Agricultores", body: "Grabar con el móvil y no perder el trabajo aunque falle la conexión." },
      { name: "Técnicos", body: "Una segunda opinión contada fruto a fruto para contrastar su previsión." },
    ],
    whyNowTitle: "Por qué ahora",
    whyNow: [
      { name: "Un móvil basta", body: "Cualquier móvil graba con detalle suficiente para distinguir frutos en la planta." },
      { name: "La visión artificial ha madurado", body: "Los detectores abiertos de última generación reconocen objetos en vídeo y se pueden entrenar con imágenes del propio invernadero." },
      { name: "Decidir a ojo sale caro", body: "Vender de más o de menos y contratar a destiempo cuesta dinero cada semana." },
    ],
    originTitle: "Todo empezó escuchando",
    origin: [
      "Gente que trabaja en invernaderos del sur de España nos contó un problema que se repite cada semana: hay que decidir cuántos kilos vender y a cuántas personas llamar, y casi siempre se hace con una estimación a ojo.",
      "Nos pusimos a investigar cómo resolverlo. ¿Y si la fruta se pudiera contar en lugar de estimar? Un vídeo grabado con el móvil, una inteligencia artificial que reconoce cada fruto maduro y una cifra para cada día, con su margen.",
      "Así nació Atias. Hoy lo estamos probando en un invernadero real, frente a lo que se recoge de verdad.",
    ],
    missionEyebrow: "Nuestra misión",
    mission: "Que en el invernadero ninguna decisión importante se tome a ojo.",
    missionBody: "Empezamos por la cosecha porque se puede comprobar en la báscula. Después vendrán las plagas, el riego y el clima: la misma cámara, más preguntas.",
    missionLink: "Ver la hoja de ruta",
    milestonesTitle: "Hasta aquí",
    milestones: [
      {
        when: "Octubre de 2026",
        name: "La idea",
        body: "Conversaciones con gente del campo e investigación para resolver su problema: contar la fruta en lugar de estimarla.",
      },
      {
        when: "Noviembre de 2026",
        name: "Primer prototipo",
        body: "La aplicación completa: subida del vídeo desde el móvil, conteo por tramo de hilera, kilos por día y temporeros.",
      },
      {
        when: "Noviembre de 2026",
        name: "Primer piloto",
        body: "Grabación en un invernadero real y comparación con lo que se recoge esa semana.",
      },
      {
        when: "Próximamente",
        name: "Primera temporada",
        body: "Uso semanal en varios invernaderos, midiendo la precisión frente a la báscula.",
      },
    ],
    nameTitle: "Qué significa ATIAS",
    nameBody: "Cuatro palabras que resumen lo que hacemos: llevar la tecnología y la inteligencia artificial a la agricultura para dar soluciones que se pueden comprobar.",
    nameParts: [
      { letter: "A", word: "Agricultura", meaning: "" },
      { letter: "T", word: "Tecnología", meaning: "" },
      { letter: "IA", word: "Inteligencia Artificial", meaning: "" },
      { letter: "S", word: "Soluciones", meaning: "" },
    ],
    logoTitle: "El símbolo, pieza a pieza",
    logo: [
      {
        name: "Tres naves",
        body: "Un invernadero multitúnel visto de frente, como los que hay en el sur de España.",
      },
      {
        name: "La nave central es la A",
        body: "En el logotipo, la nave del centro hace de primera letra de ATIAS.",
      },
      {
        name: "Cuatro marcas",
        body: "Las patas de las naves son marcas de conteo: lo que se cuenta se puede comprobar.",
      },
      {
        name: "El punto verde",
        body: "El punto de medida: el fruto que la cámara ha visto y contado.",
      },
    ],
    principlesTitle: "Cómo trabajamos",
    principles: [
      {
        name: "Cada cifra con su margen",
        body: "Una previsión sin margen da más seguridad de la que tiene. Las nuestras siempre lo llevan.",
      },
      {
        name: "Lo probado, separado de lo que no",
        body: "Lo que aún está en pruebas se dice. Nunca presentamos como seguro algo que no hemos medido.",
      },
      {
        name: "El trabajo del agricultor no se pierde",
        body: "Grabar lleva su tiempo. Una mala conexión retrasa la subida, pero no obliga a repetirla.",
      },
      {
        name: "Los datos de cada uno, de cada uno",
        body: "Cada agricultor solo ve lo suyo, y los vídeos se borran cuando ya no hacen falta.",
      },
    ],
    joinTitle: "Súmate",
    joinLead: "Atias está empezando y busca a quien quiera ayudar a sacarlo adelante, esté donde esté.",
    join: [
      {
        name: "Cooperativas piloto",
        body: "Prueba Atias en tus invernaderos, en cualquier parte del mundo.",
      },
      {
        name: "Inversores y socios",
        body: "Para quien quiera impulsar el proyecto con capital, conocimiento o tecnología.",
      },
      {
        name: "Trabajar con nosotros",
        body: "Visión artificial, agronomía, desarrollo, ventas: si puedes ayudar, queremos conocerte.",
      },
    ],
    joinCta: "Escríbenos",
    closeTitle: "¿Hablamos?",
  },
  product: {
    title: "El producto",
    lead: "Atias une tres cosas: lo que se ve en el vídeo, lo que hace el clima y lo que ya sabe la cooperativa.",
    sections: [
      {
        title: "Grabar",
        body: "El agricultor recibe un enlace propio para cada semana. Graba cada hilera con el móvil, un vídeo por lado, caminando despacio. La subida se reanuda sola si se corta la conexión, y cada vídeo se revisa al llegar: si está oscuro, movido o es demasiado corto, se avisa para repetirlo.",
      },
      {
        title: "Contar",
        body: "Un detector entrenado localiza cada fruto y lo sigue entre fotogramas para contarlo una sola vez. La hilera se divide en tramos, y cada fruto se asigna al suyo según lo que ha avanzado la cámara. La madurez se decide por color en tomate y pimiento, y por calibre en pepino.",
      },
      {
        title: "Prever",
        body: "Los frutos se convierten en kilos con el peso medio de cada variedad. Lo que madurará durante la semana depende del calor: Atias usa la temperatura real de cada invernadero, hora a hora, y la compara con lo normal en esas fechas. El resultado se reparte entre lunes y viernes, siempre con su margen.",
      },
      {
        title: "Planificar",
        body: "Con los kilos previstos y lo que recoge una persona en un jornal, Atias calcula los temporeros de cada familia de cultivo. La cooperativa ajusta los parámetros y ve el resultado al instante.",
      },
      {
        title: "Comprobar",
        body: "Cada semana se compara la previsión de Atias con la del técnico y con lo recogido de verdad. Así se ve, día a día, quién se acerca más y dónde hay que corregir.",
      },
    ],
    panelTitle: "El panel de la cooperativa",
    panelBody:
      "Resumen semanal, previsión diaria, detalle de cada invernadero hasta el tramo de hilera, vídeos recibidos, enlaces para los agricultores, cosecha real y temporeros.",
    panelCaption: "Panel de la cooperativa con datos de ejemplo.",
    cropsTitle: "Cultivos",
    crops: ["Tomate cherry", "Pimiento", "Pepino"],
    cropsNote: "Son los cultivos del piloto. Cada nuevo cultivo necesita su propio entrenamiento y validación.",
    dataTitle: "Seguridad y datos",
    data: [
      "Cada enlace solo da acceso a su invernadero y a su semana, caduca solo y se puede anular.",
      "La cooperativa entra con su cuenta. Las contraseñas se guardan cifradas.",
      "Los vídeos sustituidos o quitados se borran a los siete días.",
    ],
  },
  contact: {
    title: "Contacto",
    lead: "Cuéntanos quién eres y qué cultivas. Te escribimos para enseñarte el piloto.",
    name: "Nombre",
    organization: "Empresa o cooperativa",
    role: "Eres",
    roles: ["Cooperativa o comercializadora", "Agricultor", "Técnico", "Inversor o socio", "Otro"],
    email: "Correo electrónico",
    phone: "Teléfono (opcional)",
    message: "¿Qué te gustaría ver?",
    consent: "He leído la política de privacidad y acepto que uséis estos datos para responderme.",
    privacyLink: "política de privacidad",
    submit: "Enviar solicitud",
    sending: "Enviando…",
    sent: "Recibido. Te escribiremos en unos días.",
    error: "No se ha podido enviar. Inténtalo de nuevo en un momento.",
    inactive:
      "El formulario aún no está activo: falta indicar a qué correo llegan las solicitudes. Mientras tanto no se envía ningún dato.",
    required: "Obligatorio",
    invalidEmail: "Revisa el correo: parece incompleto.",
    consentRequired: "Necesitamos tu permiso para responderte.",
    directTitle: "También puedes escribirnos",
    directEmail: "Correo de contacto pendiente",
  },
  legal: {
    noticeTitle: "Aviso legal",
    privacyTitle: "Política de privacidad",
    pending: "Pendiente",
    draft: "Borrador sin validez legal hasta que la empresa complete los datos marcados y lo revise un asesor.",
    notice: [
      {
        heading: "Titular",
        body: "Esta web pertenece a {titular}, con NIF {nif} y domicilio en {domicilio}. Correo de contacto: {correo}.",
      },
      {
        heading: "Objeto",
        body: "La web presenta Atias, un sistema de previsión de cosecha en invernadero que está en fase de piloto, y permite pedir una demostración.",
      },
      {
        heading: "Propiedad intelectual",
        body: "Los textos, el diseño y el código de esta web pertenecen a su titular salvo que se indique otra cosa. No se pueden reproducir sin permiso.",
      },
      {
        heading: "Responsabilidad",
        body: "La información sobre el producto describe un piloto en curso y puede cambiar. Ninguna cifra mostrada como ejemplo procede de clientes reales.",
      },
    ],
    privacy: [
      {
        heading: "Responsable",
        body: "{titular}, con NIF {nif}. Correo para cualquier cuestión de privacidad: {correo}.",
      },
      {
        heading: "Qué datos y para qué",
        body: "Solo los que escribes en el formulario de contacto (nombre, empresa, perfil, correo, teléfono si lo das y mensaje), para responderte y organizar una demostración. No los usamos para nada más.",
      },
      {
        heading: "Base legal",
        body: "Tu consentimiento, que das al enviar el formulario y puedes retirar cuando quieras.",
      },
      {
        heading: "Cuánto tiempo",
        body: "Mientras dure la conversación contigo y, como mucho, un año después del último contacto, salvo que pidas antes que los borremos.",
      },
      {
        heading: "Con quién se comparten",
        body: "Con nadie, salvo el proveedor que recibe el formulario por cuenta nuestra: {proveedor}.",
      },
      {
        heading: "Tus derechos",
        body: "Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {correo}. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).",
      },
      {
        heading: "Cookies",
        body: "Esta web no usa cookies ni herramientas de seguimiento. Si eso cambia, lo indicaremos aquí y te pediremos permiso.",
      },
    ],
  },
  footer: {
    rights: "Atias · Previsión de cosecha a partir de vídeo",
    notice: "Aviso legal",
    privacy: "Privacidad",
    noCookies: "Sin cookies ni seguimiento.",
  },
  root: {
    choose: "Elige tu idioma",
  },
};

export type Dictionary = typeof es;
