# Hen Screenshots — revisión de UI y UX

10 de septiembre de 2026 · Base: `fc99d05`, rama `main`.

**Estado: auditoría inicial terminada. Las mejoras se implementaron después; ver [implementación y QA visual](ui-ux-improvements-2026-09-10.md).** El resto de este documento conserva los hallazgos y límites de la revisión previa al cambio.

Hen ya tiene una identidad reconocible. La principal debilidad es la jerarquía acumulada: promoción por encima de trabajo guardado, demasiadas filas de controles en móvil y diferencias poco claras entre guardar, aplicar y descargar. “Parece hecho por AI” es una percepción; esta revisión la convierte en problemas observables y decisiones concretas.

Se investigaron los ocho enlaces enviados y se dividió la revisión entre tres subagentes: referencias, criterio visual e inventario de interfaz. El bloqueo inicial del Mac se resolvió antes de esta revisión visual. Se capturaron e inspeccionaron 28 estados actuales. Las imágenes se conservaron sin retocar; dos capturas iniciales incorrectas se sustituyeron por capturas válidas.

## Prioridades

### P1 · Recuperación y confianza

Corregir el cierre doble con Escape y conectar el estado de guardado de Idiomas al estado existente. En marca, hacer visible Guardar antes de aplicar. Es una corrección de interacción y presentación, sin cambiar persistencia ni traducción.

### P1 · Trabajo visible al volver

Poner los proyectos guardados al principio y mostrar diseños reales en sus portadas. Es la oportunidad más clara para que la app se sienta específica y útil al usarla repetidamente.

### P1 · Espacio útil en móvil

Compactar cabecera, tira de diapositivas y controles del catálogo. El usuario debe ver lo que está editando o eligiendo, sin atravesar primero casi una pantalla de controles.

### P2 · Alcance y vocabulario

Distinguir idioma de interfaz, idioma de capturas, guardar, aplicar y descargar. Aclarar el archivo final en exportación y el resultado de las tarjetas de creación.

### P2 · Presentación propia y consistente

Conservar marca, paleta y tipografía; acercar la demostración real al comienzo de la landing, reducir mensajes repetidos y unificar tamaños, estados y ayudas de controles equivalentes.

## Recorrido y estado

| Paso | Flujo                                               | Estado                                        |
| ---- | --------------------------------------------------- | --------------------------------------------- |
| 01   | Landing: entender qué puedes crear                  | Buena base; mejorar jerarquía móvil           |
| 02   | Guía para agentes: encontrar instalación y ejemplos | Clara en los tamaños revisados                |
| 03   | Biblioteca: reconocer y retomar proyectos           | Prioridad alta de rediseño                    |
| 04   | Nuevo proyecto: elegir el tipo y entrar al editor   | Funcional; etiquetas mejorables               |
| 05   | Editor: agregar contenido, editar y revisar         | Escritorio coherente; móvil demasiado apilado |
| 06   | Plantillas: buscar, filtrar, guardar y aplicar      | Completa; exceso de controles en móvil        |
| 07   | Kits de marca: editar, guardar y aplicar            | Prerrequisito poco claro en móvil             |
| 08   | Idiomas: traducir y conservar el contexto           | Corregir Escape y mensajes de estado          |
| 09   | Exportar: conocer el archivo y guardarlo            | Salida verificada; resumen mejorable          |

## 01. Landing: entender qué puedes crear

**Buena base; mejorar jerarquía móvil.**

**Funciona:** La identidad cálida y los ejemplos reales explican el producto. El menú móvil abrió con Enter y cerró con Escape; los enlaces llevaron a sus secciones. El FAQ abrió con Enter y cerró con Espacio, conservando el foco en su control.

**Hallazgo:** En móvil, descripción, enlaces de capacidades, acciones, garantías y GitHub aparecen antes de una porción significativa del resultado. En escritorio la landing midió aproximadamente 9.228 px de alto; muchas secciones repiten antetítulo, beneficio grande y explicación.

**Dirección:** Acercar los ejemplos reales al título y a Crear gratis. Ordenar la historia por resultados y proceso, y agrupar explicaciones relacionadas. Mantener la información de gratuidad, código público, soporte y traducción.

![01-landing-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/01-landing-desktop.jpg)

![02-landing-templates-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/02-landing-templates-desktop.jpg)

![03-landing-mobile-es](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/03-landing-mobile-es.jpg)

![04-mobile-navigation](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/04-mobile-navigation.jpg)

![27-faq-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/27-faq-mobile.jpg)

## 02. Guía para agentes: encontrar instalación y ejemplos

**Clara en los tamaños revisados.**

**Funciona:** La explicación, descarga, requisitos, índice y pasos están separados con claridad. El enlace de instalación desplazó al paso correspondiente. El botón de copia dejó los comandos esperados en el portapapeles. La guía en portugués a 320 px no mostró desbordamiento horizontal.

**Hallazgo:** No se encontró un bloqueo de navegación en esta muestra. El texto sigue siendo extenso porque documenta una instalación local real; reducirlo indiscriminadamente quitaría requisitos útiles.

**Dirección:** Conservar esta estructura. Mantener visibles versión, requisitos y ejemplos copiables. La prueba verificó la copia; no se midió su confirmación visual ni se instaló el plugin.

![05-agents-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/05-agents-mobile.jpg)

![06-agents-install-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/06-agents-install-mobile.jpg)

![07-agents-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/07-agents-desktop.jpg)

![28-agents-small-pt](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/28-agents-small-pt.jpg)

## 03. Biblioteca: reconocer y retomar proyectos

**Prioridad alta de rediseño.**

**Funciona:** Nuevo proyecto, abrir archivo y kits de marca tienen entradas explícitas. Los filtros Tiendas, Portafolio y Banners mostraron sus conjuntos correspondientes.

**Hallazgo:** Con 30 proyectos de tiendas ya guardados, el bloque promocional precede a la biblioteca y las primeras tarjetas empiezan cerca del 70 % de la altura de la captura de escritorio. En móvil llegan casi al final de la primera pantalla. Las portadas usan iconos genéricos, repiten nombres y algunas parten palabras: FrogHappy aparece cortado dentro de una portada.

**Dirección:** En una biblioteca poblada, empezar por Tus proyectos y Nuevo proyecto. Usar una captura representativa del diseño como portada, con un fallback fiable. Reservar la bienvenida extensa para el primer uso. Conservar los tres tipos de proyecto separados.

![08-library-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/08-library-desktop.jpg)

![11-library-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/11-library-mobile.jpg)

## 04. Nuevo proyecto: elegir el tipo y entrar al editor

**Funcional; etiquetas mejorables.**

**Funciona:** Las tres opciones describen salidas diferentes y abren el editor. Se creó un proyecto de QA sin tocar proyectos anteriores. Escape cerró el diálogo y devolvió el foco a Nuevo proyecto.

**Hallazgo:** La pregunta sobre dónde mostrar el trabajo y el término espacio de trabajo describen un destino, aunque pulsar una tarjeta crea inmediatamente un proyecto. Tiendas de apps y Banners mencionan Google Play; el tipo de archivo es la diferencia más útil.

**Dirección:** Usar ¿Qué quieres crear? y Elige un tipo de proyecto para abrir el editor. Nombrar la primera opción Capturas para tiendas. Mantener la creación en un clic y los formatos actuales. El tercer tipo requiere desplazamiento en móvil, pero es accesible.

![09-new-project-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/09-new-project-desktop.jpg)

![10-new-project-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/10-new-project-mobile.jpg)

## 05. Editor: agregar contenido, editar y revisar

**Escritorio coherente; móvil demasiado apilado.**

**Funciona:** Se agregó una diapositiva vacía, se importó una imagen real, se editaron título y apoyo y se abrió la vista previa. Las pestañas respondieron a las flechas del teclado. El tamaño del dispositivo pasó de 620 a 621 con ArrowRight y volvió a 620 mediante Restablecer. Cambiar la interfaz a portugués conservó los textos en inglés; cambiar el idioma del texto a español recuperó la versión española.

**Hallazgo:** A 390 px, cabecera y barra ocupan 306 px; la tira de una sola diapositiva añade unos 188 px. El lienzo comienza después de esa acumulación, y las propiedades aparecen alrededor de y=1.358 en el documento. Editar y comparar exige mucho desplazamiento. Hay abundante ayuda pequeña y gris. Los dos selectores de idioma tienen nombres accesibles distintos, pero su diferencia visual depende demasiado del contexto.

**Dirección:** Conservar tira, lienzo e inspector en escritorio. En móvil, compactar cabecera y tira y permitir alternar con claridad entre lienzo y herramientas, aprovechando las vistas existentes. Mostrar etiquetas constantes Idioma de la interfaz e Idioma de las capturas. Dejar los controles de objeto junto a su contexto; no añadir una cinta completa tipo Office.

![12-empty-editor-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/12-empty-editor-mobile.jpg)

![13-editor-desktop-text](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/13-editor-desktop-text.jpg)

![16-editor-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/16-editor-mobile.jpg)

![25-editor-tablet-pt](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/25-editor-tablet-pt.jpg)

![26-publishing-preview](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/26-publishing-preview.jpg)

## 06. Plantillas: buscar, filtrar, guardar y aplicar

**Completa; exceso de controles en móvil.**

**Funciona:** La búsqueda sin coincidencias ofreció recuperación; la paginación pasó de 1–12 a 13–24; los filtros móviles se abrieron y cerraron. Cabana se agregó a favoritos, apareció en su colección y se retiró al terminar. Aplicarla mantuvo textos e imagen y mostró confirmación con opción de deshacer.

**Hallazgo:** En móvil, cabecera, búsqueda, orden, filtros, colección, contador, tamaño de página, paginación y ayuda consumen gran parte del diálogo. En la captura 15 la primera plantilla empieza cerca de y=450 y su imagen solo se ve parcialmente antes del pie fijo. La selección actual puede seguir siendo aplicable aunque no aparezca en los resultados; la interfaz sí lo explica.

**Dirección:** Dejar búsqueda, colección y filtro compacto en el primer nivel. Agrupar orden y cantidad por página como ajustes secundarios, reducir la ayuda repetida y conservar paginación y pie de aplicación. Mostrar una vista previa sustancial y su nombre sin desplazarse en 390 × 844.

![14-templates-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/14-templates-desktop.jpg)

![15-templates-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/15-templates-mobile.jpg)

## 07. Kits de marca: editar, guardar y aplicar

**Prerrequisito poco claro en móvil.**

**Funciona:** El formulario separa colores y fuentes y previsualiza la marca sobre la captura actual. Se creó Hen · UI audit kit, se guardó con confirmación y se aplicó a la diapositiva de QA.

**Hallazgo:** Con un borrador, Aplicar marca está deshabilitado y mantiene el tratamiento de acción principal. Guardar kit es secundario. En escritorio aparece Guarda el kit antes de aplicarlo o exportarlo; en móvil esa explicación desaparece. La condición también está confirmada en CSS para anchos de 1050 px o menos.

**Dirección:** Hacer de Guardar la acción principal mientras existan cambios pendientes y de Aplicar después de guardar. Conservar la explicación del prerrequisito en todos los anchos. Mantener separados guardar un kit y aplicarlo a un proyecto.

![17-brand-kit-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/17-brand-kit-desktop.jpg)

![18-brand-kit-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/18-brand-kit-mobile.jpg)

## 08. Idiomas: traducir y conservar el contexto

**Corregir Escape y mensajes de estado.**

**Funciona:** Se declaró español como idioma original, se agregó inglés, se editaron sus textos y se marcó 1/1 como revisada. La explicación del traductor opcional indica descarga, almacenamiento y alcance antes de iniciar. No se descargó un modelo.

**Hallazgo:** Un Escape desde el traductor cerró tanto ese diálogo como Idiomas: había dos diálogos y quedaron cero. La fuente confirma propagación del evento onCancel. Además, el pie de Idiomas afirma Guardado en este dispositivo de forma incondicional, sin recibir el estado real de guardado; no se provocó un fallo de almacenamiento. En móvil, selección de idiomas y ayuda empujan los campos de traducción fuera de la primera pantalla.

**Dirección:** Escape debe cerrar únicamente el diálogo superior y devolver el foco a Traducir en el dispositivo. Mostrar el estado real del guardado y aclarar que los textos se incluyen al descargar un archivo de proyecto. Compactar la selección móvil para acercar los campos al idioma activo.

![19-languages-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/19-languages-mobile.jpg)

![20-languages-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/20-languages-desktop.jpg)

![21-local-translator-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/21-local-translator-desktop.jpg)

## 09. Exportar: conocer el archivo y guardarlo

**Salida verificada; resumen mejorable.**

**Funciona:** Se generó y guardó un PNG de la versión inglesa. La interfaz indicó 1080 × 1920, 0,36 MB y revisión de formato; el archivo apareció en Descargas. Seleccionar ambos idiomas cambió el distintivo de la acción individual de PNG a ZIP. Se revisó también la vista previa de publicación.

**Hallazgo:** Con un único idioma seleccionado, la ayuda afirma que el ZIP incluye una carpeta por idioma aunque la acción principal produzca PNG. Dos acciones Exportar esta captura y Exportar 1 captura tienen poco contraste semántico cuando solo hay una diapositiva. En móvil hay que recorrer un resumen largo para llegar al resultado y a Guardar; el botón de cierre puede quedar fuera de la parte visible al desplazarse.

**Dirección:** Mostrar un resumen directo del resultado: selección, idiomas, archivo y dimensiones; mantener los detalles de validación accesibles. Usar Descargar PNG / Descargar serie ZIP cuando corresponda y formular condicionalmente la explicación de carpetas. Conservar todas las validaciones y opciones actuales.

![22-export-desktop](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/22-export-desktop.jpg)

![23-export-result-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/23-export-result-mobile.jpg)

![24-export-mobile](/Users/hensell/Documents/Personal/hen_screenshot/exports/qa/ui-ux-2026-09-10/24-export-mobile.jpg)

## Observaciones adicionales verificadas

- Desde la biblioteca con interfaz española, el enlace Inicio de Hen Screenshots navega a `/` y muestra la landing en inglés. La navegación debería conservar el idioma elegido cuando existe una ruta equivalente.
- La vista previa de una sola captura muestra una invitación a deslizar aunque sus botones anterior/siguiente están deshabilitados. Ajustar la ayuda a la cantidad de diapositivas.
- En el inspector se observó “Aplicar estilo a las 1 diapositivas” y su equivalente portugués en plural. Corregir el singular.
- Los textos pequeños y grises se perciben más débiles en formularios largos. Esto justifica medir legibilidad y contraste; no se declara un incumplimiento WCAG únicamente por una captura.

## Qué tomar de las ocho referencias

| Sitio                                                       | Aplicación útil para Hen                                                                | Acceso y límites                                                                                                                                                                                                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Refero Styles](https://styles.refero.design/)              | Roles de color, tipografía, superficies y estados; imágenes como foco.                  | Se leyeron documentos y un subagente inspeccionó visualmente los ejemplos Seline y Cosmos. Son análisis de terceros y capturas de marketing, no sesiones de sus productos. En Seline la captura muestra azul aunque el documento diga escala de grises. |
| [DesignMD.me](https://designmd.me/)                         | Documentar comportamiento y anatomía junto al aspecto; ejemplo de Hashnode.             | El acceso directo devolvió 403/errores. Se utilizó texto indexado del dominio primario, con posible desfase.                                                                                                                                            |
| [OpenDesign](https://open-design.ai/)                       | Especificar superficies, hover, selección y foco.                                       | Biblioteca pública accesible. El ejemplo Figma se revisó visualmente y declara que sus previews son mockups generados. No acredita la usabilidad de un editor real; algunas reglas de foco se contradicen.                                              |
| [Designmd.supply](https://www.designmd.supply/)             | Separar procedencia de tokens, capturas y textos extraídos.                             | Funcionó www; el dominio sin www falló. Varias guías quedaron en carga; ejemplos completos se consultaron como texto indexado primario.                                                                                                                 |
| [Aura](https://www.aura.build/)                             | Reglas concretas de espaciado y componentes; evitar convertir todo en tarjetas iguales. | Las páginas directas expusieron principalmente shells vacíos. Los ejemplos Prism Dynamics y Synapse se leyeron en texto indexado primario. Synapse contiene contradicción entre modo oscuro y fondo claro.                                              |
| [Neuform](https://neuform.ai/)                              | Separar reglas de tipografía, espacio, forma y movimiento.                              | Se accedió al texto de la galería; el detalle Deep Intelligence Platform provino de texto indexado primario. No se probó el producto ni se adoptan sus efectos de brillo y cristal.                                                                     |
| [Hyperbrowser DESIGNMD](https://design-md.hyperbrowser.ai/) | Combinar evidencia visual y estructura en una especificación revisada.                  | La página quedó en Booting DESIGNMD. Se revisó el ejemplo público del proveedor; no se ejecutó una extracción ni se proporcionó una API key. Una captura de viewport no documenta todo el comportamiento.                                               |
| [TypeUI](https://www.typeui.sh/)                            | Anatomía, tamaños, variantes, foco, separación de iconos y densidad por tarea.          | Documentación pública y ejemplo Atlas legibles. No se instaló una biblioteca ni se probó material de pago.                                                                                                                                              |

Como base, usar la [lista de componentes y estados de TypeUI](https://www.typeui.sh/docs/creative/design-systems) y los ejemplos de roles de [Seline](https://styles.refero.design/style/7967c6d9-e50c-42b5-b4d1-74003ba41781) y [Cosmos](https://styles.refero.design/style/eb804e3a-1b75-446c-8374-114bbabaf0cd). Los documentos generados contienen contradicciones; no conviene importar varios como instrucciones concurrentes.

Fuentes primarias complementarias: [Hashnode en DesignMD](https://designmd.me/discover/hashnode), [biblioteca de OpenDesign](https://open-design.ai/plugins/systems/), [preview Figma de OpenDesign](https://open-design.ai/plugins/design-system-figma/), [repositorio de Designmd.supply](https://github.com/context-dot-dev/designmd-supply), [Prism Dynamics](https://www.aura.build/design-systems/prism-dynamics), [Synapse](https://www.aura.build/design-systems/synapse-full-view), [Deep Intelligence Platform](https://neuform.ai/template/deep-intelligence-platform), [ejemplo público Hyperbrowser](https://github.com/hyperbrowserai/hyperbrowser-app-examples/tree/main/hyperdesign), [Atlas de TypeUI](https://www.typeui.sh/design-skills/atlas).

## Dirección de diseño para Hen

- **Identidad:** Mantener el logotipo hen, papel cálido, tinta, arcilla y salvia, tipografías e iconos existentes. La captura del usuario aporta la mayor parte del color y la personalidad durante la edición.
- **Densidad:** Landing expresiva; biblioteca orientada a retomar trabajo; editor compacto con el lienzo como foco. No usar la misma cantidad de espacio y promoción en las tres superficies.
- **Acciones:** Una acción principal disponible por estado. Las opciones seleccionadas deben distinguirse de botones de acción, foco de teclado y controles deshabilitados.
- **Texto y ayuda:** Etiquetas de tarea explícitas. La ayuda necesaria para continuar siempre visible; detalles adicionales desplegables. Revisar texto pequeño renderizado y contraste antes de fijar nuevos valores.
- **Móvil:** Conservar el contexto de la diapositiva y permitir volver al lienzo con claridad. Reducir filas permanentes y usar las vistas y agrupaciones existentes antes de inventar navegación nueva.
- **Estados:** Unificar posición y tratamiento de progreso, guardado, errores y alcance; conservar las diferencias funcionales entre autosave, Guardar kit, Aplicar plantilla y Exportar.

Conservar especialmente los ejemplos reales de la landing, la estructura de la guía para agentes, el marco general del editor de escritorio y la separación entre capturas para tiendas, portafolio y banners. No se justifica reemplazar la marca ni agregar una cinta de Office para cambiar su apariencia.

## Orden de trabajo recomendado

1. Corregir Escape, mensajes de guardado y ayuda de Guardar/Aplicar. Cambios directos de UI.
2. Revisar biblioteca poblada y portadas. Rediseño focalizado.
3. Compactar editor y catálogo móviles. Comparar con las capturas actuales.
4. Pulir alcance, textos y componentes compartidos.
5. Reordenar la landing móvil y reducir repetición donde no aporta información.

## Criterios de aceptación para la implementación

- Biblioteca poblada: una primera fila reconocible de proyectos debe aparecer completa sin pasar por una bienvenida extensa en 1440 × 1000.
- Catálogo móvil: nombre y vista previa sustancial de la primera plantilla deben ser visibles en 390 × 844; búsqueda, filtros, favoritos, paginación y aplicación siguen accesibles.
- Editor móvil: una diapositiva cargada y el acceso a sus herramientas deben poder compararse sin recorrer cabecera, tira y formulario completos cada vez.
- Kits de marca: en borrador, Guardar y su motivo son visibles en 390 y 1024 px; después de guardar se habilita Aplicar y se explica su alcance.
- Diálogos: dos abiertos → Escape → uno y foco en el disparador del traductor; segundo Escape → cero y foco en el disparador de Idiomas.
- Idiomas y exportación: el estado de guardado debe ser veraz, la interfaz no cambia los textos exportados, y el resumen coincide con PNG/JPEG/ZIP y la selección real.
- Validación visual de cambios: comparar antes/después con el mismo contenido y viewport en EN/ES/PT. Revisar foco, texto largo, estados deshabilitados, scroll y movimiento reducido.

## Evidencia de fuente para correcciones concretas

- `src/editor/LanguagesDialog.tsx:437`: el traductor está anidado en Idiomas; `:547` atiende `onCancel` sin detener propagación y el padre en `:88` también cierra. La interacción confirmó dos cierres con un Escape. Conservar el aborto y la restauración de foco existentes al detener la propagación.
- `src/editor/LanguagesDialog.tsx:428`: el estado Guardado es incondicional; las props no contienen estado de guardado. `src/app/App.tsx:348` programa el guardado y `src/editor/store.ts:82` marca cambios pendientes. Reutilizar ese estado en la presentación, sin cambiar persistencia.
- `src/editor/BrandKitDialog.tsx:750`: Guardar es secundario; `:802` Aplicar es principal y se deshabilita cuando hay cambios. `src/editor/brand-kits.css:486` oculta la ayuda en anchos compactos.
- `src/app/ExportDialog.tsx:175`: la ayuda del ZIP depende de idiomas disponibles, mientras que el formato de la acción depende de la selección. `src/export/screenshots.ts:78` conserva la salida individual PNG/JPEG cuando corresponde.
- `src/app/ProjectLibrary.tsx:49`: bienvenida antes de proyectos; `:132` portada genérica. `src/app/NewProjectDialog.tsx:44`: pregunta y tarjetas de creación.

Estas notas explican el origen de los hallazgos de UI. No constituyen una revisión técnica general.

## Alcance y límites

Revisión visual y de interacción realizada en el navegador integrado: escritorio 1440 × 1000, móvil 390 × 844, editor a 1024 × 900 y guía en portugués a 320 × 740. Se usaron EN, ES y PT en las superficies indicadas; no es una matriz exhaustiva de idiomas. No se probó compatibilidad entre navegadores, lector de pantalla, teclado virtual ni dispositivos físicos. No se midieron conversión ni tiempos con usuarios, por lo que los efectos sobre comprensión son inferencias de diseño. No se indujeron errores de almacenamiento, no se descargaron modelos ni se revalidó aquí toda la matriz de formatos de tiendas. Las capturas muestran estados reales; los límites de acceso a referencias están identificados. No se modificó código de la aplicación ni se desplegó un rediseño.

Datos de QA creados: proyecto **Hen UI audit · September 10** (`bb1abfde-d726-4321-9450-fa3310730de7`) y kit **Hen · UI audit kit**, únicamente en el entorno local. Los proyectos anteriores y la pestaña de producción se conservaron. La exportación de prueba está en `/Users/hensell/Downloads/Hen-UI-audit-September-10-play-phone-portrait-en-01.png`.

No se requiere ejecutar la batería de tests de la aplicación para este informe: no hay cambios de código. Se comprobaron archivos, enlaces locales e imágenes del informe; cualquier implementación posterior debe realizar su propia comparación visual y pruebas de interacción.
