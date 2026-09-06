# Hen Screenshots

Aplicación web para crear screenshots elegantes con marcos iOS y Android para presentar tus apps.

Nombre público confirmado por el usuario: **Hen Screenshots**.

Repositorio: [Hensell/hen-screenshots](https://github.com/Hensell/hen-screenshots).

**App screenshot studio** — _Your app. Beautifully presented._

Consultar la [identidad pública](docs/brand-identity.md), la [muestra visual](brand/index.html) y la [revisión inicial de nombres](docs/name-check.md).

La [arquitectura propuesta](docs/architecture.md) define el modelo del editor, la persistencia, la exportación y el orden de implementación.

El primer editor ya incluye **marcos para iOS y Android**. La [especificación de dispositivos](docs/device-frames.md) define ambas familias y la dirección del catálogo. El [alcance de v0.1](docs/editor-v0.1.md) distingue lo implementado de las siguientes iteraciones.

La [iteración de plantillas v0.2](docs/templates-v0.2.md) añade **Classic, Spotlight, Tilt y Editorial**, con vista previa usando tus capturas, aplicación individual o en serie, degradados, textura, acento tipográfico y rotación. Los proyectos y respaldos anteriores siguen siendo compatibles.

## Ejecutar el editor

Requiere Node.js 22.12 o posterior.

```sh
npm ci
npm run dev
```

Abrir [el estudio local](http://127.0.0.1:5174/). Crear un proyecto e importar PNG, JPEG o WebP. Cada captura recibe su propio lienzo; los originales se conservan en el navegador.

```sh
npm run check         # Pruebas, TypeScript y build de producción
npm run preview       # Servir el build localmente, con el servidor dev detenido
npm run deploy:check  # Build y validación de Wrangler sin publicar
npm run deploy        # Publicar en Cloudflare con la sesión autorizada de Wrangler
```

El plugin oficial genera `dist/wrangler.json` y prepara el frontend para **Cloudflare Workers Static Assets**, sin Worker de negocio ni bindings. No se ha desplegado todavía. `dist/` contiene solo los recursos de la aplicación; las capturas locales, bases de datos y herramientas de FrogHappy quedan fuera.

El guardado es por navegador y origen. Usar **Project file** para descargar un `.henscreenshots` y **Open project file** para restaurarlo como copia en otro navegador, dominio o equipo. Borrar los datos del sitio también borra sus proyectos locales.

## Usuario y dirección del producto

- El primer usuario será el creador del proyecto, para preparar screenshots de sus propias apps.
- La primera versión se validará con ese uso real y se pulirá antes de compartirla con otras personas.
- Se contempla publicarla gratis y como código abierto más adelante. La publicación y la licencia todavía no están decididas.

## Decisiones del proyecto

- El despliegue será en **Cloudflare**, según la indicación del usuario.
- Base implementada: **React + TypeScript + Vite** como aplicación de una sola página (SPA).
- Editor implementado: **Konva** con un componente React y una escena compartida entre vista previa y exportación en el navegador.
- Dos familias de dispositivo desde el inicio: **iOS y Android**, con presets de composición propios. La familia del marco se elige por separado del destino y las dimensiones de exportación.
- Primera versión con guardado local mediante IndexedDB.
- Posible versión de escritorio posterior con Tauri, reutilizando el editor web.

## Primera versión propuesta

Objetivo: crear, guardar, reabrir y exportar una serie coherente de imágenes promocionales de una app propia.

1. Crear un proyecto e importar varias capturas.
2. Elegir una plantilla, su variante iOS o Android y personalizar colores, tipografía, fondo y marco del teléfono para toda la serie.
3. Editar los textos y la composición de cada imagen, con opciones para duplicar, ordenar y deshacer cambios.
4. Guardar automáticamente en el navegador y permitir descargar e importar el proyecto con sus imágenes para respaldo y traslado.
5. Exportar una imagen como PNG o la serie como ZIP, con las dimensiones elegidas.

El alcance inicial propuesto deja cuentas, sincronización, colaboración, pagos, generación con IA y escenas 3D para evaluaciones posteriores.

Validación inicial: usar capturas reales de una app del creador, preparar una serie, cerrar y reabrir el proyecto, comprobar la restauración desde un respaldo y verificar visualmente la exportación y sus dimensiones. Comprobar ambas familias de marcos, sin deformar capturas ni duplicar barras de estado, navegación o recortes de cámara.

El recorrido mínimo y la edición de series están implementados. Las siguientes iteraciones ampliarán el catálogo de composiciones y los perfiles de tamaño, a partir del uso real con FrogHappy.

## Despliegue previsto

Se recomienda Cloudflare Workers con Static Assets y el plugin oficial de Cloudflare para Vite. Esta base permite servir el frontend y añadir una API cuando el producto la necesite. Cloudflare Pages también es compatible con React + Vite.

El procesamiento de las capturas y la exportación del editor se diseñarán para ejecutarse en el navegador. El guardado local no implica sincronización entre dispositivos.

Referencias oficiales:

- [React + Vite en Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Plugin de Cloudflare para Vite](https://developers.cloudflare.com/workers/vite-plugin/)
- [React en Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)

## Estado

Primer editor funcional para uso personal: proyectos locales, hasta 20 capturas, textos, paletas, marcos iOS/Android, posición y tamaño del teléfono, duplicación, orden, deshacer/rehacer, respaldo/restauración y exportación PNG/ZIP a 1080 × 1920. Identidad pública confirmada. Todavía no se ha desplegado la aplicación.

v0.2 incorpora cuatro plantillas y documentos con esquema 2. Las plantillas mantienen la misma escena entre galería, editor y exportación.

La [primera sesión de capturas reales de FrogHappy](docs/capture-session.md) proporciona cinco imágenes Android con datos de muestra y un flujo reproducible para validar el editor.
