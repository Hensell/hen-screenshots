# Hen Screenshots — mejoras de UI/UX y QA visual

10 de septiembre de 2026 · Implementación local sobre `fc99d05`, rama `main`.

Se implementaron las mejoras de la [auditoría inicial](ui-ux-review-2026-09-10.md), con tres subagentes para landing, catálogo y diálogos. Se conservaron la identidad de Hen, las funciones existentes y los contratos de proyectos y exportación. Los cambios no se han publicado ni enviado a GitHub en esta pasada.

## Los nueve recorridos

| Recorrido       | Resultado                                                                                                                                                                                     | Evidencia posterior      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Landing         | Los ejemplos reales aparecen antes de los enlaces secundarios en móvil. Títulos más concretos, listas compactas y GitHub/Ko-fi agrupados. Se mantienen información, navegación y FAQ.         | 12–15                    |
| Guía de agentes | Se conserva la estructura que funcionaba. Se verificaron instalación, copia de comandos y su confirmación visual; portugués a 320 px.                                                         | 16–18                    |
| Biblioteca      | Los proyectos guardados son la primera tarea. Portadas reales del diseño, cargadas al acercarse a la vista, con alternativa si no se pueden generar. Primera fila completa en escritorio.     | 09–10                    |
| Nuevo proyecto  | “¿Qué quieres crear?”, explicación del resultado del clic y “Capturas para tiendas”. Creación directa comprobada.                                                                             | 11, 29–30                |
| Editor          | Cabecera y tira móviles compactas. Alternancia entre Lienzo y Editar diapositiva. Etiquetas constantes para idioma de interfaz y de capturas. Barra compacta a 844 px.                        | 01–02, 19–21, 23, 28, 30 |
| Plantillas      | Búsqueda, colección y filtros prioritarios; orden y cantidad agrupados. Paginación después de resultados. Primera vista previa completa visible en móvil.                                     | 06–07, 27–28             |
| Marca           | Guardar es principal con cambios pendientes; Aplicar pasa a ser principal después. El motivo y el alcance permanecen visibles en móvil y tablet.                                              | 08, 25–26, 31            |
| Idiomas         | Estado de guardado conectado al real, campos de traducción más próximos en móvil y cierre correcto de diálogos anidados.                                                                      | 03, 24                   |
| Exportación     | Resumen coherente PNG/JPEG/ZIP, dimensiones, idiomas y tamaño del resultado. Acciones explícitas Preparar y Descargar. Validaciones conservadas en un desplegable y cierre siempre accesible. | 04–05, 22                |

También se conserva el idioma al volver a Inicio, se usa el singular al aplicar estilo a una diapositiva y la vista previa individual ya no invita a deslizar.

## Evidencia visual

- Antes: `exports/qa/ui-ux-2026-09-10/` — 28 capturas de la auditoría inicial.
- Después: `exports/qa/ui-ux-implementation-2026-09-10/` — 31 capturas reales, sin retoque.
- Galería comparativa: `exports/qa/ui-ux-implementation-2026-09-10/index.html`.
- Inventario de dimensiones y comprobaciones: `exports/qa/ui-ux-implementation-2026-09-10/verification.json`.

Los números de la tabla corresponden al prefijo de los archivos. Los viewports solicitados para las comparaciones móviles principales fueron 390 × 844; también se revisaron 320 × 740, 844 × 390, 1024 × 900 y 1440 × 1000. Algunas imágenes entregadas por la herramienta tienen dimensiones menores (por ejemplo, 375 × 812); el inventario conserva el tamaño real de cada archivo y no se han reescalado manualmente. El kit tiene evidencia adicional de borrador a 320, 390 y 1024 px. Hay muestras EN, ES y PT; no representan todas las combinaciones de idioma, contenido y tamaño.

## Interacciones comprobadas

- Biblioteca: portadas del contenido guardado, filtros por propósito y apertura de proyectos.
- Creación: un clic abre el editor vacío; Agregar diapositiva crea una diapositiva sin archivo y permite editarla. Deshacer devuelve el estado vacío.
- Editor: Lienzo ↔ herramientas, foco al abrirlas, pestañas con teclado, cambio y restablecimiento de tamaño del dispositivo. El idioma de interfaz conserva los textos de las capturas; las versiones ES/EN mantienen sus textos distintos.
- Catálogo: buscar, recuperar resultados vacíos, filtrar, añadir/quitar favorito, ordenar y pasar a la segunda página. Aplicar Snowfall conservó imagen y textos; Deshacer restauró Cabana.
- Marca: borrador con Guardar habilitado y Aplicar deshabilitado; guardado con Aplicar disponible. Se restauró el nombre original del kit de QA.
- Idiomas: Escape desde el traductor deja abierto Idiomas y devuelve el foco a Traducir; otro Escape vuelve al editor con foco en Gestionar idiomas.
- Exportación: una versión genera PNG y dos versiones anuncian ZIP en resumen y acción. El PNG llegó al estado listo con 1 archivo y 0,36 MB; se comprobaron el enlace Descargar PNG y su nombre de archivo.
- Landing y guía: menú móvil, cierre con Escape, enlaces a secciones, FAQ y copia de comandos con confirmación.

Se muestrearon estilos computados de ayuda: `#5e655f` sobre `#f6f4ed` supera 4,5:1. Persisten ayudas compactas de 10–11 px; esto no es una certificación de accesibilidad. Se verificó en código que las reglas existentes desactivan animación/transiciones con movimiento reducido; no se emuló esa preferencia en esta sesión.

## Validación del código

- **608 pruebas aprobadas, 47 archivos:** `npm test -- --maxWorkers=2 --testTimeout=30000`.
- Los primeros intentos con el límite predeterminado de 5 segundos agotaron tiempo en pruebas pesadas de render. Se repitió la suite con el límite explícito anterior, sin cambiar la configuración del repositorio ni ocultar fallos de aserciones.
- Después de los ajustes finales: 39 pruebas focalizadas de i18n, repositorio, exportación y SEO aprobadas.
- `npm run lint`, `npm run format:check`, `npm run build`, `npm run seo:check` y `git diff --check` aprobados. SEO verificó seis rutas públicas, robots/sitemap, noindex del estudio, 404, redirecciones y ZIP del plugin.
- Autoreview detectó una incoherencia del resumen PNG/ZIP. Se corrigió y la revisión final terminó sin hallazgos accionables.
- La carga de portadas tiene una prueba de lectura limitada a los assets referenciados y al proyecto correspondiente. No se cambió el esquema de almacenamiento.

## Límites y datos de prueba

La comprobación fue local en el navegador integrado. No se probaron otros navegadores, dispositivos físicos, teclado virtual ni lector de pantalla. No se descargó el modelo de traducción, no se provocó un error de almacenamiento y no se repitió toda la matriz de formatos de tiendas. Las mejoras de comprensión son decisiones de diseño; no resultados medidos con usuarios.

**Descarga:** en la auditoría inicial sí apareció un PNG de 1080 × 1920 en Descargas. En esta implementación se generó el resultado y se activó su enlace, pero no se observó un archivo nuevo verificable en Descargas. El archivo anterior no se cuenta como una descarga nueva. La causa de esta limitación no se determinó.

Se utilizó el proyecto local **Hen UI audit · September 10** (`bb1abfde-d726-4321-9450-fa3310730de7`) y su kit. Se creó **Hen UI follow-up · Empty** (`7097909e-d085-4dba-8bda-415016da32d2`) para comprobar creación, añadir diapositiva y deshacer; quedó vacío. No se modificaron los proyectos de producción del usuario.
