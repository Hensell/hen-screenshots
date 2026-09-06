# Capturas reales de FrogHappy

Sesión local: 6 de septiembre de 2026. Cinco PNG originales de Android para validar Hen Screenshots: Home, Insights de hábitos, Work en la columna Now, Journal y Focus. Se eligió Insights para mostrar estadísticas y el gráfico semanal completo. El calendario de un hábito queda como referencia adicional de QA.

## Entorno utilizado

- Fuente: checkout local de HappyFrog, sin cambios de código de esta sesión. Se preservó el cambio previo de versión en `pubspec.yaml` a `1.0.8+44`.
- Flutter **3.44.7**, Dart **3.12.2**; dependencias restauradas con `flutter pub get --enforce-lockfile`.
- Build: `flutter build apk --debug --flavor development --target lib/main_development.dart --no-pub`.
- Android 16 ARM64, AVD exclusivo **HenScreenshots_QA**, serial `emulator-5554` en esta sesión. Imagen instalada `system-images;android-36.1;google_apis_playstore;arm64-v8a`.
- Pantalla 1080 × 2400, densidad 360 dpi, orientación vertical, inglés y tema claro.
- Invitado sin sesión de cuenta; DB `froghappy_guest.db`, esquema 28. Datos ficticios locales: seis hábitos, tres semanas de historial, ocho tareas, dos proyectos, cinco entradas de diario y veinte sesiones de enfoque.
- Reloj visible **09:41**, batería **100 %**, sin notificaciones ni indicadores de red. Las imágenes no fueron retocadas ni recortadas.

El avdmanager instalado creó inicialmente `target=android-0` por interpretar mal `36.1`. Se corrigió a `target=android-36` en el archivo `.ini` del nuevo AVD. No se modificaron otros emuladores.

## Repetir la sesión

Usar siempre el AVD dedicado y comprobar su serial con `adb devices -l`. Los siguientes comandos se ejecutan desde la raíz de Hen Screenshots y suponen que el APK development ya está instalado y la DB invitada fue inicializada. Preparar una copia local de la DB según [el procedimiento del seeder](../tools/happyfrog/README.md); conservar el original y cualquier sidecar SQLite antes de modificarla.

```sh
adb -s emulator-5554 shell wm density 360
adb -s emulator-5554 shell am force-stop com.hensell.froghappy.dev
python3 tools/happyfrog/seed_demo.py --db references/screenshots/happyfrog/setup/froghappy_guest.db --date 2026-09-06
```

La sesión usó America/Managua y el reloj real del emulador a las 09:41 del día de referencia (15:41 UTC), para que las sesiones de Focus de las 12:00 y 13:00 UTC ya hubieran ocurrido. El modo demo fija solo la barra. Si se necesita reproducir la misma hora real en este AVD:

```sh
adb -s emulator-5554 shell settings put global auto_time 0
adb -s emulator-5554 shell cmd alarm set-time 1788709260000
```

Cambiar tanto esa fecha/hora como `--date` al preparar otra sesión. No basta cambiar la barra para cambiar el día que usa la app.

Con la app detenida, restaurar únicamente la DB de prueba completa. Esta sesión usó journal DELETE, sin WAL pendiente. Si la copia tiene WAL, consolidarlo mediante SQLite antes de restaurar; no dejar sidecars antiguos junto a un archivo principal distinto.

```sh
adb -s emulator-5554 shell "run-as com.hensell.froghappy.dev sh -c 'cat > databases/froghappy_guest.db'" < references/screenshots/happyfrog/setup/froghappy_guest.db
bash tools/happyfrog/status_bar.sh emulator-5554
maestro test --device emulator-5554 -e OUTPUT_DIR="$PWD/references/screenshots/happyfrog" tools/happyfrog/capture.yaml
```

El helper de la barra activa modo avión y oculta sus indicadores para mantener la sesión visual estable. El control por ADB sigue funcionando. El flujo conserva los datos, inicia la app, ordena los hábitos y comprueba contenido antes de capturar las cinco vistas. Maestro agrega `.png`, por eso los nombres del flujo no incluyen extensión.

Para devolver conectividad, batería y reloj automáticos al AVD, ejecutar `bash tools/happyfrog/status_bar.sh emulator-5554 reset`. Para restaurar su densidad original: `adb -s emulator-5554 shell wm density reset`. El reset vuelve a valores habituales del AVD dedicado; no es un respaldo de preferencias anteriores.

## Archivos y comprobaciones

Los originales, el ZIP, la galería `index.html` y las bases de prueba están en `references/screenshots/happyfrog/`, excluido de Git. Los archivos finales son `01-home.png`, `02-insights.png`, `03-work.png`, `04-journal.png` y `05-focus.png`.

Revisión final con `autoreview --mode local` sobre una copia aislada de los helpers: limpia, sin hallazgos accionables. Se aisló ese alcance porque el nombre del CSS público `brand/tokens.css` activaba el filtro de archivos sensibles del helper.

La app compiló e inició correctamente. El seeder pasó integridad, claves foráneas, idempotencia, preservación de datos ajenos y rollback sobre copias de la DB real. El flujo Maestro pasó sus 31 pasos y las cinco vistas fueron inspeccionadas. La galería conserva las imágenes completas; los metadatos de captura registran dimensiones y hashes.

La pantalla Insights conserva el aviso real “Full Pro preview active” de esta versión de FrogHappy. Los datos son una demostración, no actividad real del usuario. Todavía no son mockups promocionales: esa composición se hará en Hen Screenshots, usando [marcos Android e iOS](device-frames.md).

Referencia para el modo demo: [Android System UI](https://android.googlesource.com/platform/frameworks/base/+/master/packages/SystemUI/docs/demo_mode.md).
