# Captura automática: alternativas y cómo decidir

No se fija aquí el número de cámaras ni de raíles, ni se dan costes: dependen de datos que todavía no
existen. Las valoraciones son **cualitativas y previas**, y deben confirmarse en el banco de pruebas.

## Comparativa

| Criterio | Raíl con cámara móvil | Cámaras fijas | Carro que ya circula por el cultivo | Robot terrestre autónomo | Dron interior |
|---|---|---|---|---|---|
| **Cobertura** | Alta: recorre toda la hilera | Limitada: tiene puntos ciegos salvo con muchas unidades | Alta, si recorre todas las calles | Alta si cabe por las calles | Variable; espacio estrecho |
| **Ver entre hojas** | Muchos ángulos por fruto, cerca del cultivo | Un solo ángulo; el fruto tapado queda tapado | Muchos ángulos | Muchos ángulos | Muchos, con turbulencia y distancia |
| **Iluminación** | Puede llevar luz propia y capturar de noche | Difícil de controlar; mucha fuente de luz | Luz propia posible; horario impuesto por la operación | Luz propia | Muy limitada por el peso |
| **Identificar planta** | Muy buena: posición precisa en el raíl | Buena: cada cámara ve una zona fija | Requiere marcadores u odometría | Marcadores u odometría | Lo más difícil |
| **Contar una vez** | Buena: movimiento regular y conocido | Sencillo por vista; solape entre cámaras difícil | Media: velocidad irregular | Buena | Difícil |
| **Exposición al ambiente** | Se guarda fuera y entra solo al recorrer | Permanente: **incumple la idea inicial** salvo carcasa muy robusta | Depende de dónde se guarde | Se guarda fuera | Se guarda fuera |
| **Limpieza y mantenimiento** | Pocas ópticas y un punto de limpieza al guardar; raíl y tracción a mantener | Muchas ópticas repartidas que limpiar a mano | Baja | Baterías, ruedas, navegación | Alto |
| **Adaptación a 600 tamaños** | Tramos de raíl a medida; depende de la estructura | Número de cámaras crece con la superficie | Se adapta sola si ya existe | Se adapta por software si el suelo lo permite | Se adapta por software |
| **Automatización** | Alta | Total | **Exige una persona empujando**, salvo que esté motorizado | Alta | Media-baja |
| **Interferencia con la operación** | Puede invadir pasillos o estorbar a tratamientos y labores | Baja | Baja | Coordinar con trabajadores | Seguridad con personas |

### Conclusión provisional

- **Raíl con cámara móvil**: candidato principal. Es el que mejor cumple la protección, la cercanía y el
  conteo único. Su gran incógnita es si la estructura de cada invernadero admite instalarlo.
- **Cámaras fijas**: conviene probar una como **testigo** barato de clima, luz y desarrollo del cultivo,
  no como medio principal de conteo.
- **Robot terrestre**: la alternativa a evaluar si la estructura no admite raíl y el suelo es transitable.
- **Carro existente**: útil como paso intermedio barato para recoger datos desde una trayectoria parecida
  al raíl. No cumple «automático» salvo motorizado.
- **Dron**: descartado de entrada por espacio, seguridad y autonomía, salvo evidencia en contra.

Un raíl puede ser aéreo o a poca altura, y una o dos cámaras pueden ir a alturas distintas, porque la fruta
se reparte a lo largo de la planta. La **altura** y si un recorrido por calle ve las dos hileras enfrentadas
son decisiones que salen del banco de pruebas: determinan cuántos raíles y cuántas cámaras hacen falta.

## Banco de pruebas en el piloto

Antes de construir nada fijo, montar la cámara en un carro o soporte que imite la trayectoria y comparar
configuraciones (altura, distancia, ángulo, velocidad, luz, hora) sobre **las mismas plantas con conteo manual**:

| Pregunta | Medida |
|---|---|
| Cobertura | % de frutos reales vistos desde un lado, desde dos y según altura |
| Visibilidad entre hojas | `k` por configuración y su variación por fase del cultivo |
| Luz | Exactitud de clasificación de color a distintas horas y con luz propia |
| Identificación | % de frutos asignados a la planta o tramo correcto; visibilidad de marcadores |
| Conteo único | Error de conteo por pasada, y al repetir pasada sobre las mismas plantas |
| Solape | % de frutos marcados que se ven desde ambos lados |
| Calibre | Error en mm según distancia; si hace falta cámara de profundidad |

El número de raíles y cámaras por invernadero sale de aquí como **regla** (por ejemplo, un recorrido por cada
N calles, según ancho de calle y altura de cultivo), que se aplica a las dimensiones de cada invernadero.

## Requisitos de diseño del equipo

### Protección y refugio

- Cámara guardada en un refugio fuera del invernadero o sellado, y expuesta solo durante el recorrido.
- **Cuidado con la condensación:** un equipo frío que entra en aire caliente y húmedo empaña la lente de
  inmediato. El refugio no debe enfriar por debajo del punto de rocío del interior, o hay que calentar la
  ventana óptica antes de entrar. Hay que medirlo con temperatura y humedad reales.
- Materiales y sellado aptos para la temperatura, la humedad, la radiación solar, los fitosanitarios y el
  azufre, si se usa. Pedir al fabricante la resistencia frente a los productos reales aplicados.

### Limpieza y mantenimiento

- La ventana óptica, no la lente, recibe la suciedad: debe ser barata de sustituir.
- Limpieza automática en el refugio (por ejemplo, aire o rasqueta) y comprobación con una **carta de
  referencia** antes de cada recorrido: si sale borrosa o con el color desviado, se avisa y no se da por buena.
- Limpieza de raíl y tracción frente a polvo y restos vegetales. Repuestos sustituibles sin herramientas especiales.

### Automatización del recorrido

- Programación semanal con ventana de reintentos el viernes y el sábado.
- Coordinación con **tratamientos y labores**: no capturar durante un tratamiento ni con personas en el recorrido.
- Detección de obstáculos y parada segura, final de carrera y regreso al refugio tras un fallo.
- Posición registrada (encoder o marcas) para asociar cada imagen a hilera y tramo sin depender solo de la visión.
- Avisos de recorrido incompleto: si falta un tramo, la app lo indica en lugar de dar un total engañoso.
- Almacenamiento local en el equipo; envío al equipo de análisis por cable o Wi-Fi al volver al refugio.

### Seguridad eléctrica y de personas

Baja tensión o protección adecuada en ambiente húmedo y cumplimiento de la normativa de maquinaria aplicable
a un equipo móvil automático cerca de trabajadores. Debe revisarlo un técnico competente antes de instalar.
