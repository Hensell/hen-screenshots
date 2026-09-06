# Hen Screenshots

Aplicación web para crear screenshots elegantes con estilo mockup para Google Play.

Nombre público confirmado por el usuario: **Hen Screenshots**.

Repositorio: [Hensell/hen-screenshots](https://github.com/Hensell/hen-screenshots).

**App screenshot studio** — *Your app. Beautifully presented.*

Consultar la [identidad pública](docs/brand-identity.md), la [muestra visual](brand/index.html) y la [revisión inicial de nombres](docs/name-check.md).

La [arquitectura propuesta](docs/architecture.md) define el modelo del editor, la persistencia, la exportación y el orden de implementación.

La primera versión tendrá **layouts y marcos para iOS y Android**. La [especificación de dispositivos](docs/device-frames.md) define ambas familias, las áreas seguras y el tratamiento de las barras de sistema.

## Usuario y dirección del producto

- El primer usuario será el creador del proyecto, para preparar screenshots de sus propias apps.
- La primera versión se validará con ese uso real y se pulirá antes de compartirla con otras personas.
- Se contempla publicarla gratis y como código abierto más adelante. La publicación y la licencia todavía no están decididas.

## Decisiones del proyecto

- El despliegue será en **Cloudflare**, según la indicación del usuario.
- Base propuesta: **React + TypeScript + Vite** como aplicación de una sola página (SPA).
- Editor propuesto: **Konva + react-konva**, con composición y exportación de imágenes en el navegador.
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

Siguiente paso: concretar las pantallas Projects y Editor a partir de la arquitectura propuesta, e iniciar el recorrido mínimo de importar, editar, guardar, reabrir y exportar una pieza.

## Despliegue previsto

Se recomienda Cloudflare Workers con Static Assets y el plugin oficial de Cloudflare para Vite. Esta base permite servir el frontend y añadir una API cuando el producto la necesite. Cloudflare Pages también es compatible con React + Vite.

El procesamiento de las capturas y la exportación del editor se diseñarán para ejecutarse en el navegador. El guardado local no implica sincronización entre dispositivos.

Referencias oficiales:

- [React + Vite en Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Plugin de Cloudflare para Vite](https://developers.cloudflare.com/workers/vite-plugin/)
- [React en Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)

## Estado

Proyecto en definición inicial, con nombre público confirmado y primera dirección de identidad documentada. Todavía no se ha implementado ni desplegado la aplicación.

La [primera sesión de capturas reales de FrogHappy](docs/capture-session.md) proporciona cinco imágenes Android con datos de muestra y un flujo reproducible para validar el editor.
