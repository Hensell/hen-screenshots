# Third-party notices

Hen Screenshots code is distributed under the MIT license in `LICENSE`. This does not replace the licenses of third-party components, user screenshots, or optional translation models.

The ZIP includes Manrope and Fraunces fonts under the SIL Open Font License. Their copyright notices and full licenses are included in `assets/fonts/OFL.txt` and `assets/fonts/OFL-Fraunces.txt`.

The local renderer installs these direct dependencies using the included lockfile:

| Dependency  | License    | Source                                    |
| ----------- | ---------- | ----------------------------------------- |
| Konva       | MIT        | https://github.com/konvajs/konva          |
| Skia Canvas | MIT        | https://github.com/samizdatco/skia-canvas |
| Sharp       | Apache-2.0 | https://github.com/lovell/sharp           |
| fflate      | MIT        | https://github.com/101arrowz/fflate       |

Their packages and native libraries carry their own licenses and notices, including those of transitive dependencies. They are downloaded during setup and are not bundled as `node_modules` in the Hen ZIP. Preserve those notices when redistributing installed dependencies.

The plugin does not bundle screenshots, project files, or translation models.
