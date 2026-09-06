# Plantillas · v0.2

Esta iteración amplía el editor local con cuatro composiciones. La referencia visual fueron las capturas de Consoly en [App Store](https://apps.apple.com/us/app/consoly-coding-challenges/id6761283615) y [Google Play](https://play.google.com/store/apps/details?id=app.consoly), revisadas el 6 de septiembre de 2026: titulares fuertes, palabras en color, profundidad en el fondo y teléfonos grandes o inclinados. Las composiciones y fondos de Hen se dibujan con código propio; no se empaquetan recursos de Consoly.

| Plantilla | Composición                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Classic   | El diseño original: fondo liso, titular arriba y teléfono completo centrado.                                          |
| Spotlight | Titular grande con acento, degradado verde, puntos sutiles y teléfono ampliado que continúa fuera del borde inferior. |
| Tilt      | Titular alineado a la izquierda, paleta cálida, fondo diagonal y teléfono girado −9°.                                 |
| Editorial | Teléfono completo sobre un panel, con titular y texto debajo.                                                         |

## Uso

**Templates**, sobre el lienzo, abre una galería con la captura y el marco actuales. Elegir una tarjeta solo cambia la selección del diálogo. **Apply** aplica la plantilla a la captura seleccionada o a toda la serie. Restablece posición, ancho, rotación y estilo, conservando imágenes, textos, IDs, familia de dispositivo y opciones del marco. **Keep my colors** conserva los cuatro colores efectivos de cada captura. Toda la aplicación se deshace en un único paso.

Aplicar a toda la serie actualiza también el estilo del proyecto; las capturas que se importen después heredan ese estilo y la posición inicial de su plantilla. Se pueden mezclar plantillas dentro del mismo proyecto.

El inspector permite ajustar tamaño del titular (48–132 px), acento de su última línea explícita, fondo sólido o degradado, color final, color de acento, textura de puntos y rotación del teléfono (−20° a 20°). La plantilla Editorial utiliza el color final también para su panel. Los textos largos reducen su tamaño para caber; si una composición no permite representarlos completos, muestra un error en vez de truncarlos.

**Apply style to all** comparte colores, tipografía y opciones del marco, conservando las plantillas y posiciones individuales. **Reset to project style** conserva también la plantilla individual. **Reset**, en Composition, restaura la posición inicial de la plantilla de esa captura.

## Compatibilidad y renderizado

El documento y el archivo `.henscreenshots` pasan al esquema 2. La migración de IndexedDB mantiene IDs, timestamps, revisiones, blobs, textos, colores y posiciones del esquema 1, añadiendo los valores de Classic y rotación cero. La importación valida respaldos de ambas versiones y luego migra v1; la exportación escribe v2. Se rechazan versiones futuras y discrepancias entre el esquema del manifiesto y su proyecto.

`src/core/templates.ts` contiene catálogo, valores iniciales y aplicación de estilos. Los IDs y geometrías son parte del esquema: una composición incompatible debe recibir un ID nuevo. La galería, el lienzo y los PNG usan la misma escena Konva. La rotación se realiza sobre el centro del teléfono, conservando coordenadas de posición sin rotación para edición y guardado.

Se mantiene la salida fija de 1080 × 1920, RGB de 24 bits sin alfa, con marcos genéricos iOS/Android. Una familia de marco no cambia el perfil de exportación. Las composiciones panorámicas continuas entre varias capturas y la perspectiva 3D quedan para otra iteración.

## Validación

- `npm run check`: 86 pruebas, TypeScript y build. Incluye migración real de IndexedDB v1, validación de respaldos v1/v2, aplicación individual y en serie, preservación de colores y dispositivos, vista previa sin mutación y deshacer/rehacer de la aplicación completa.
- En la vista integrada se restauró un respaldo v1 y se creó **FrogHappy · Template study**, separado del proyecto original. Se aplicó Spotlight a las cinco capturas, se verificó deshacer/rehacer y se preparó una serie con las cuatro plantillas. La recarga conserva el proyecto y sus ajustes.
- En Chrome se descargaron series con ambas familias de marco. Los diez PNG se verificaron leyendo cabeceras: 1080 × 1920, 8 bits por canal, RGB sin alfa. Los ZIP pasan la comprobación de integridad. Se inspeccionaron visualmente los diseños exportados, incluidos ambos marcos con rotación.
- El respaldo v2 descargado se restauró como un proyecto con ID nuevo; conservó las cuatro plantillas, gradientes, colores y rotación −9° de Tilt.
- Se probaron textos largos, conservación de colores, retorno del foco al cerrar el diálogo y anchos de 320, 390, 768, 1000 y 1440 px, además de 844 × 390 horizontal. Sin desborde horizontal. El teclado virtual en un teléfono físico no se verificó.
- No se observaron errores de consola durante la validación final. IndexedDB informó del cierre de una conexión anterior para completar su actualización, que terminó correctamente.

Los archivos de prueba permanecen en `exports/templates-v0.2/`, ignorado por Git. El despliegue continúa local.
