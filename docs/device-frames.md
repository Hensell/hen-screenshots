# Marcos y layouts de dispositivos

Estado: alcance acordado para la primera versión de Hen Screenshots. Fecha: 6 de septiembre de 2026.

Hen Screenshots tendrá **dos familias: iOS y Android**, disponibles desde el primer editor. Esta decisión complementa la [arquitectura](architecture.md); el producto mantiene React, TypeScript y Vite con despliegue en Cloudflare.

## Tres elecciones independientes

| Elección | Define | Ejemplo inicial |
| --- | --- | --- |
| Familia y marco | Apariencia del dispositivo, máscara de pantalla y áreas seguras | iOS o Android, con marco visible u oculto |
| Layout | Composición de texto, captura y fondo | Título superior y teléfono centrado, con variante por familia |
| Perfil de exportación | Destino, dimensiones y formato del archivo | Google Play con dimensiones elegidas |

Elegir iOS no selecciona App Store ni cambia el tamaño del documento. El primer destino sigue siendo Google Play; los perfiles de otras tiendas se incorporarán y verificarán por separado. Elegir un marco tampoco convierte la interfaz capturada de Android a iOS: el contenido sigue siendo la imagen importada.

## Catálogo inicial

| Familia | Marco y pantalla | Elementos opcionales |
| --- | --- | --- |
| iOS | Teléfono vertical, bordes redondeados y bisel discreto | Recorte superior tipo notch; barra de estado e indicador inferior |
| Android | Teléfono vertical, bordes redondeados y bisel discreto | Cámara perforada; barra de estado y navegación por gestos o tres botones |

Los marcos serán recursos vectoriales o geometría del renderer, propios y versionados. La primera versión no necesita múltiples generaciones de teléfonos, marcas comerciales, perspectiva ni modelos 3D. Cada familia admite ocultar el marco para mostrar la captura sola.

La primera plantilla tendrá dos presets sobre una composición compartida: título, descripción opcional y captura centrada. Cada preset define escala y separación adecuadas a la geometría de su marco. Nuevas plantillas conservarán esa estructura de variantes, sin duplicar el texto ni los assets del proyecto.

## Geometría y ajuste de capturas

Cada `DeviceFrame` define su familia, ID y versión, contorno externo, rectángulo de pantalla, radios, máscara de recorte, zona opcional de cámara/notch e insets seguros. Las medidas del marco usan un sistema local y se escalan de manera uniforme.

La pantalla completa y el área segura son regiones distintas: una captura completa se ajusta a la pantalla, incluyendo sus barras si ya las contiene. Una captura de solo contenido puede ocupar el área segura mientras el editor compone las barras alrededor. Los insets no deben añadir espacio una segunda vez a una captura que ya lo tiene.

El ajuste inicial será **contener**: mostrar la captura completa, preservar su relación de aspecto y completar cualquier espacio sobrante con un color editable. **Llenar** permite un recorte proporcional con posición ajustable y vista previa. Ningún modo deforma la imagen. El archivo original se conserva y todos los recortes se guardan como datos editables.

Los layouts mantienen títulos y descripciones fuera del dispositivo y de sus zonas reservadas. La posición final se puede editar libremente; cambiar solo el marco conserva posiciones, textos, fondo y dimensiones del artboard. La acción separada de aplicar un preset de layout puede reorganizar los elementos y constituye un único paso de deshacer.

## Barras de sistema y recortes de cámara

La importación comienza en modo **conservar original**, sin superponer barras o recortes. La presencia de barras y cámara se confirma mediante controles de presentación de la captura; no depende de una detección automática infalible.

| Modo | Comportamiento |
| --- | --- |
| Conservar original | La hora, batería, navegación y cualquier cámara/notch que aparezcan en la captura se mantienen. No se generan duplicados. |
| Sustituir barras | El usuario delimita las franjas originales que se excluyen, o confirma que la imagen ya contiene solo el contenido. El editor compone las barras de la familia seleccionada y coloca el contenido en su área segura. |
| Sin barras | Usa una captura de contenido o un recorte explícito y omite las barras generadas. No borra píxeles dentro del archivo original. |

El recorte superior del marco tiene un control separado: ninguno, generado por el marco o ya presente en la captura. Si está presente en la captura, no se vuelve a dibujar. Un marco con notch/cámara generado reserva su zona para que los indicadores añadidos no se superpongan.

Las barras generadas admiten **hora y batería fijas**, apariencia clara u oscura y navegación adecuada a la familia. Los valores iniciales propuestos son 09:41 y 100 %, editables y guardados en el proyecto; no consultan el reloj ni la batería del equipo. En modo conservar original esos controles no modifican las cifras incrustadas en la imagen: para fijarlas hay que preparar la captura en el dispositivo o sustituir sus barras explícitamente.

El recorte de barras exige vista previa: puede excluir contenido dibujado bajo ellas. Si la imagen no permite separarlo correctamente, se conserva el original o se importa otra captura. El editor no inventa contenido oculto ni reemplaza elementos de navegación propios de la app.

## Datos y herencia

- El proyecto conserva familia, ID/versión de marco y apariencia predeterminados; cada pieza puede personalizarlos o volver al estilo compartido.
- La presentación de cada captura conserva asset, modo de ajuste, recorte, tratamiento de barras, presencia de cámara/notch y configuración de barras generadas.
- El artboard mantiene su perfil de exportación y dimensiones por separado. El preset aplicado se materializa como contenido y posiciones editables.
- Una modificación de familia se puede deshacer. Cambia la geometría y las barras generadas; conserva la configuración de las barras originales y no intenta convertir el contenido de la captura.
- Guardado local, respaldo y exportación resuelven la misma versión de geometría y las mismas propiedades. Las actualizaciones del catálogo no modifican silenciosamente proyectos anteriores.

## Criterios de aceptación

1. Crear una pieza con marco iOS y otra con Android a partir de la misma plantilla; ambas permiten editar los mismos textos, fondo y captura.
2. Cambiar la familia mantiene assets, contenido y perfil/dimensiones de exportación. Aplicar un layout es explícito y deshacer recupera la composición anterior.
3. Importar una captura con barras visibles no añade otra hora, batería, cámara/notch o navegación. Repetir con una captura sin barras permite generarlas sin tapar el contenido.
4. Las barras generadas muestran los valores fijos elegidos después de guardar, reabrir, restaurar un respaldo y exportar; no cambian con la hora real.
5. Probar una captura con proporción distinta a la pantalla: contener muestra todo; llenar recorta según la posición elegida. Ninguno estira la imagen y el recorte es reversible.
6. Inspeccionar las dos familias en la vista previa y en PNG: marcos, radios, máscaras, zonas seguras y barras coinciden y no dejan texto ni contenido cortados accidentalmente.
7. Cambiar el marco del proyecto actualiza piezas heredadas y conserva personalizaciones individuales; una pieza sin marco sigue exportándose correctamente.

Estas comprobaciones validan el editor. Las capturas finales de una app deben seguir representando la plataforma y el contenido reales que su creador quiera mostrar.
