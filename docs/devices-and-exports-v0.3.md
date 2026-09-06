# Dispositivos y exportación v0.3

Implementado el 6 de septiembre de 2026. React, Konva y Cloudflare siguen siendo la base del proyecto.

## Dispositivos y composiciones

- iPhone y teléfono Android, ahora verticales u horizontales.
- iPad (pantalla 3:4) y tablet Android (10:16), con ambas orientaciones.
- Monitor (pantalla 16:9, soporte y base) y laptop (16:10, teclado y trackpad).
- Marcos genéricos dibujados con geometría propia. Contener preserva toda la captura; llenar recorta proporcionalmente. Ningún modo estira la imagen.
- Classic, Spotlight, Tilt y Editorial se adaptan a la relación del lienzo y al dispositivo. Se conservan las coordenadas originales para teléfonos verticales en 1080 × 1920.
- Cambiar familia u orientación reajusta el dispositivo de esa pieza. Cambiar el preset reajusta toda la serie y se deshace en una acción. Texto, imágenes y colores se conservan. La familia no cambia automáticamente al seleccionar una tienda.
- Se pueden editar posición, ancho y rotación, ocultar el marco y activar la cámara. Las barras de sistema permanecen en los píxeles originales.

## Presets verificados

Fuentes oficiales consultadas el **2026-09-06**:
[Apple — Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) y
[Google Play — Preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

| Destino | Vertical | Horizontal | Máximo por slot/tipo |
| --- | --- | --- | --- |
| App Store · iPhone 6.9 pulgadas | 1320 × 2868 | 2868 × 1320 | 10 |
| App Store · iPhone 6.5 pulgadas | 1242 × 2688 | 2688 × 1242 | 10 |
| App Store · iPad 13 pulgadas | 2064 × 2752 | 2752 × 2064 | 10 |
| App Store · Mac | — | 2880 × 1800 | 10 |
| Google Play · teléfono | 1080 × 1920 | 1920 × 1080 | 8 |
| Google Play · tablet 7 pulgadas | 1440 × 2560 | 2560 × 1440 | 8 |
| Google Play · tablet 10 pulgadas | 1440 × 2560 | 2560 × 1440 | 8 |
| Google Play · Chromebook | — | 1920 × 1080 | 8 |
| Presentación · desktop y web | — | 1920 × 1080 | 20 (límite del editor) |

Se ofrece un tamaño aceptado por cada slot de Apple; no es una lista exhaustiva de todos sus tamaños. El slot iPhone 6.5 es necesario cuando no se aportan capturas de 6.9. El slot iPad 13 es obligatorio si la app funciona en iPad. No se incluyen Watch, TV ni Vision.

Google Play permite imágenes entre 320 y 3840 px, con el lado largo como máximo dos veces el corto en sus reglas generales. Para tablets y Chromebook indica 16:9 o 9:16, mínimo 4 capturas y dimensiones entre 1080 y 7680; nuestros presets también quedan dentro de los límites generales. El mínimo de publicación general es 2 capturas entre tipos de dispositivo; para recomendaciones de apps pide al menos 4 capturas de alta resolución. Los mínimos se muestran como orientación: un PNG individual puede formar parte de una serie ya cargada.

**Contenido:** Google pide excluir texto promocional adicional en capturas de pantallas grandes. Los avisos del diálogo enlazan a esa regla. El editor valida dimensiones, formato y el máximo de imágenes de cada ZIP; no certifica el contenido ni convierte la plataforma de la app capturada. Usar el contenido real de la plataforma correspondiente. La opción de presentación web no declara conformidad con una tienda.

## Renderizado y comprobación

El documento usa 1080 unidades de ancho y altura derivada del preset. Vista previa y exportación usan la misma escena y escala uniforme. La exportación usa las dimensiones finales exactas, sin depender del zoom ni de la densidad de píxeles de la pantalla.

Antes de entregar cada PNG se comprueban sus dimensiones y su cabecera IHDR: profundidad 8 bits y tipo RGB (24 bits, sin canal alfa). Si el navegador produce otro formato, falla con un mensaje en lugar de entregar un archivo incompatible. Los nombres de PNG y ZIP incluyen el ID del destino.

Un ZIP no puede superar 8 imágenes para Play ni 10 para Apple. Se permite seguir editando hasta 20 piezas y exportar piezas individuales. Las imágenes fuente se conservan sin modificar.

## Persistencia y pruebas

Schema 3 añade `exportProfile` al proyecto y `deviceOrientation` al estilo. IndexedDB y backups v1/v2 se migran con el destino original 1080 × 1920 y orientación vertical, conservando IDs, assets, revisiones y composiciones. Los backups nuevos son v3; las versiones futuras y documentos inválidos se rechazan.

Pruebas automatizadas: reglas de tamaño independientes del catálogo, validación de cabecera PNG, todos los dispositivos/orientaciones/plantillas en los 15 perfiles, ajuste proporcional y límites de las composiciones, migraciones y roundtrip de backups.

Verificación manual: exportados en Chrome los 15 presets; dimensiones exactas y RGB8 sin alfa comprobados en los archivos descargados. Evidencia local privada en `exports/devices-v0.3/png-validation.json`. La serie de muestra usa una captura real de la página de identidad de Hen para probar los marcos; no representa una app nativa ya publicada.
