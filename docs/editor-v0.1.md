# Primer editor de Hen Screenshots

## Alcance implementado

- React, TypeScript y Vite, con el plugin oficial de Cloudflare para publicar archivos estáticos en Workers. Sin API, cuentas ni almacenamiento remoto.
- Biblioteca de proyectos; creación, nombre editable y reapertura por URL.
- Hasta 20 capturas PNG, JPEG o WebP estático por proyecto. Límites: 20 MB y 24 megapíxeles por imagen; 120 MB de originales utilizados por proyecto.
- Una composición vertical de 1080 × 1920, con titular, texto de apoyo, color de fondo y texto, alineación izquierda o centrada.
- Marcos genéricos propios de iOS y Android, con opción de ocultar marco y cámara opcional desactivada inicialmente. Ajuste proporcional completo o recorte central para llenar. Conserva las barras originales.
- Movimiento del teléfono con arrastre, flechas del teclado o controles de posición; ancho ajustable. Cambiar familia conserva posiciones, texto y dimensiones de salida.
- Estilo de proyecto con personalizaciones por captura. **Apply style to all** actualiza el estilo de toda la serie y elimina sus personalizaciones; **Reset to project style** restaura la herencia individual. Ambas acciones se pueden deshacer.
- Duplicar, quitar y reordenar capturas; hasta 60 estados de deshacer. Las ediciones consecutivas del mismo campo se agrupan hasta salir del campo.
- Autoguardado transaccional de documento e imágenes en IndexedDB, con cola de escritura y detección de revisiones modificadas por otra pestaña. Los fallos conservan el trabajo y ofrecen reintentar, guardar una copia o descargar un respaldo.
- `.henscreenshots`: ZIP con manifiesto versionado y originales utilizados. Validación antes de restaurar; importa una copia con IDs nuevos. Los archivos del formato v1 almacenan los bytes sin compresión ZIP adicional.
- Exportación del PNG seleccionado o ZIP de toda la serie, en orden, con recursos y documento congelados durante la operación. Composición Konva compartida, Manrope cargada explícitamente y PNG RGB de 24 bits, sin canal alfa.
- Vista adaptada a escritorio, tablet y móvil. En pantallas estrechas la serie pasa a una tira horizontal y los controles quedan debajo del lienzo.

## Decisiones de implementación

`src/core/model.ts` es el documento serializable, independiente de React, Konva y Cloudflare. `src/editor/store.ts` separa documento, historial, revisión persistida y estado de guardado. Los blobs permanecen fuera del historial JSON.

`src/rendering/scene.ts` construye la misma escena para `Artboard` y `renderShot`. Se usa Konva directamente desde el componente React para compartir esta construcción con la exportación; no hace falta la dependencia `react-konva`.

La geometría del catálogo v1 está vinculada al esquema del documento v1. Si cambia la geometría de forma incompatible, se debe conservar la versión anterior o migrar explícitamente el esquema, nunca reinterpretar silenciosamente un respaldo.

El formato exporta únicamente originales referenciados por la serie actual. IndexedDB conserva también imágenes anteriores para permitir deshacer durante la sesión. La recolección de imágenes antiguas en almacenamiento se deja para una iteración posterior.

Los recursos de marca se empaquetan desde `brand/`. La licencia OFL de Manrope se incluye en el build como `OFL-Manrope.txt`. Las capturas privadas de referencia no se empaquetan ni se suben al repositorio.

## Siguientes iteraciones

La arquitectura general describe un producto más amplio. Esta entrega todavía no incluye catálogo de plantillas, múltiples dimensiones/perfiles de tienda, fuentes adicionales, fondos con gradiente, recorte manual de barras, barras sintéticas, recorte desplazable, sincronización ni cuentas.

El perfil fijo de 1080 × 1920 se mantiene independiente del marco. Usar un marco iOS no convierte una imagen en una captura nativa de iOS ni garantiza que cumpla todos los tamaños de una ficha de App Store.

No hay service worker: el procesamiento ocurre localmente, pero abrir de nuevo la aplicación requiere que sus recursos estén disponibles. Los datos locales no se trasladan automáticamente entre el origen de desarrollo y el dominio de producción.

## Validación reproducible

`npm run check` cubre geometría proporcional, importaciones inválidas, transacciones atómicas, conflictos entre pestañas, colas de guardado, recuperación tras error, deshacer/rehacer y restauración íntegra del respaldo. `npm run deploy:check` valida el build y Wrangler sin publicar.

Para la prueba manual, importar las cinco capturas locales de FrogHappy descritas en [capture-session.md](capture-session.md). Editar títulos, cambiar marcos, aplicar estilo a la serie, duplicar y deshacer, guardar y recargar. Exportar ambos marcos y una serie ZIP; restaurar el archivo de proyecto en otro proyecto y comprobar imágenes y ajustes.

### Resultado del 6 de septiembre de 2026

- Las 46 pruebas pasan; TypeScript y el build de producción pasan. Wrangler confirma el despliegue de prueba sin publicar.
- Las cinco capturas, textos y ajustes se recuperaron después de un reinicio real del equipo, tanto en Chrome como en la vista integrada.
- En Chrome se descargaron PNG de ambos marcos y el ZIP completo. Los cinco PNG del ZIP se verificaron leyendo sus cabeceras: 1080 × 1920, 8 bits por canal, RGB sin alfa. Se inspeccionaron visualmente ambas variantes de marco.
- El respaldo descargado contiene cinco originales y un manifiesto válido; la importación desde la biblioteca recuperó la serie como un proyecto con ID nuevo. Se verificaron duplicado, reordenamiento, estilo para toda la serie y sus acciones de deshacer/rehacer.
- Se inspeccionó el editor en anchos de 320, 360, 390, 768, 1000 y 1440 píxeles, además de 844 × 390 en horizontal. Se corrigió el desborde de 320 píxeles con barras de desplazamiento persistentes. La consola de la vista integrada no reportó errores ni advertencias.
- Las exportaciones de prueba permanecen en `exports/froghappy-v0.1/`, ignorado por Git. El teclado virtual de un teléfono físico no forma parte de esta validación.
