# Portfolio y tarjetas v0.4

Implementado el 6 de septiembre de 2026.

Hen Screenshots sirve también para preparar portadas de proyectos, tarjetas para un portfolio y composiciones para una web. En **Canvas**, elegir **Portfolio**. El lienzo se configura por separado del dispositivo y de la plantilla.

| Formato | Tamaño inicial | Proporción |
| --- | --- | --- |
| Project card | 1600 × 1200 | 4:3 |
| Square | 1600 × 1600 | 1:1 |
| Portrait card | 1200 × 1500 | 4:5 |
| Widescreen | 1920 × 1080 | 16:9 |
| Custom size | 1600 × 1200, editable | Personalizada |

**Screenshot card** es un marco simple, sin hardware ni cámara, con sombra suave y bordes redondeados opcionales. La tarjeta interior usa 4:3 horizontal o 3:4 vertical. También se puede usar cualquier teléfono, tablet, monitor o laptop dentro de un lienzo de portfolio. Contener y llenar mantienen la proporción de la imagen original.

Para tamaño personalizado, escribir ancho y alto y pulsar **Apply size**. Los campos pendientes no modifican el documento. Se aceptan enteros de 256 a 4096 px por lado, con una proporción máxima 4:1 en cualquiera de las orientaciones. Son límites del editor para acotar el tamaño del canvas y mantener la composición utilizable; no corresponden a una tienda.

Al aplicar tamaño se reajusta la serie en una sola acción de deshacer. El tamaño personalizado se guarda aunque después se seleccione un preset de tienda. Solo el preset Custom usa esas medidas: los destinos de App Store y Google Play mantienen sus medidas y validaciones exactas. Cambiar entre Portfolio y App stores elige una tarjeta 4:3 o Google Play Phone inicialmente; el selector permite escoger el destino concreto.

Preview, galería y exportación resuelven el mismo tamaño final. Los PNG se verifican contra esas dimensiones y siguen siendo RGB sin alfa. El nombre de una exportación personalizada incorpora ancho y alto. El máximo de portfolio es 20 imágenes por serie; los límites de cada tienda siguen siendo independientes.

Schema 4 incorpora `customSize` y el marco `card`. Proyectos y backups v1–v3 se migran conservando su formato, composición e imágenes; las medidas personalizadas iniciales no cambian su lienzo. Los esquemas históricos conservan sus propios campos, marcos, presets y límites válidos.

Validación: pruebas de migración y backups, formatos personalizados inválidos, resolución de dimensiones, reflow/deshacer, geometría de tarjeta y extremos 4:1/1:4. En Chrome se exportaron PNG de los tres nuevos presets y una serie de 1537 × 1103; los archivos tienen las dimensiones exactas y color RGB8 sin alfa. El proyecto de muestra usa una captura de la identidad de Hen y se guarda localmente en `exports/portfolio-v0.4/`.
