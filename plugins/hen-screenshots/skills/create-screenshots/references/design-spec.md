# Design spec v1

Paths resolve relative to the JSON file. Run `templates`, `profiles` and `languages` for the current catalog. Unknown fields and unsupported IDs fail with an error.

```json
{
  "version": 1,
  "name": "My app",
  "profile": "play-phone-portrait",
  "template": "halo",
  "device": "android",
  "sourceLanguage": "en",
  "slides": [
    {
      "image": "captures/home.png",
      "title": "Build a daily routine.",
      "subtitle": "Your habits, in one place.",
      "translations": {
        "es": {
          "title": "Crea una rutina diaria.",
          "subtitle": "Tus hábitos, en un solo lugar."
        }
      }
    }
  ]
}
```

## Fields

| Field            | Meaning                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `version`        | Required, `1`. Separate from the full project schema.                                                                                                              |
| `name`           | Required, 1–80 characters.                                                                                                                                         |
| `profile`        | Required, an ID from `profiles`. Exact dimensions and per-language slide limits apply.                                                                             |
| `template`       | Optional default ID from `templates`. Defaults to `studio`, or `banner-signal` for banner profiles.                                                                |
| `device`         | `android`, `ios`, `ipad`, `android-tablet`, `monitor`, `laptop`, or `card`. Defaults from the profile. Multi-device templates choose their own device combination. |
| `sourceLanguage` | Defaults to `en`. Must match the original captions.                                                                                                                |
| `customSize`     | `{ "width": 1600, "height": 1200 }`, only with `portfolio-custom`. Whole numbers from 256–4096; ratio up to 4:1.                                                   |
| `brandKit`       | Optional local `.henbrand` file exported from the studio. Applies its colors and fonts to all slides.                                                              |
| `slides`         | Required, 1–20 entries. Panorama entries create two output slides and count twice toward the profile limit.                                                        |

Each slide requires `image` and `title` (up to 100 characters; empty is allowed). `subtitle` is optional, up to 180 characters. A slide can override `template` and `device`.

Input images: PNG, JPEG and still WebP, at most 50 MB per file, 24 megapixels per image, and 120 MB combined. Other formats must be converted first, for example with the web studio. Images are decoded and EXIF orientation is applied without modifying the original files.

### Layout adjustments

`placement` replaces all four device coordinates: `{ "x": 240, "y": 640, "width": 600, "rotation": -8 }`. Values use Hen's 1080-unit canvas width, independent of export resolution. Device x is -1080–2160, y is -2160–4096, width is 32–2160; the shared project validator enforces frame-specific bounds and rotation limits.

`textOffsets` moves captions relative to their template positions: `{ "title": { "x": 0, "y": 20 }, "subtitle": { "x": 0, "y": 20 } }`. Omit it to use the template defaults.

`style` can override `background`, `backgroundEnd`, `backgroundMode` (`solid`/`gradient`), `textColor`, `accentColor`, `titleFont`/`bodyFont` (`Manrope`/`Fraunces`), `titleSize`, `align` (`left`/`center`), `texture` (`none`/`dots`), `accentTitle`, `fit` (`contain`/`cover`), `frame`, `camera`, and `deviceOrientation` (`portrait`/`landscape`). Colors use six-digit hex notation. Boolean fields require actual JSON booleans. A supplied brand kit takes precedence over style colors and fonts.

### Panoramas

Use a panorama start ID such as `panorama`, `daybreak`, or `orbit`, and provide a `continuation` object with `title`, optional `subtitle`, and matching `translations`. It shares the image and device placement with the first slide. Both slide captions remain independently editable in the studio.

```json
{
  "image": "captures/home.png",
  "template": "panorama",
  "title": "Small habits.",
  "continuation": { "title": "A happier day." }
}
```

### Multiple devices

Supply `companions` in the slot order reported by the template. `ecosystem`, for example, uses a desktop primary image plus tablet and phone images:

```json
{
  "image": "captures/desktop.png",
  "template": "ecosystem",
  "companions": ["captures/tablet.png", "captures/phone.png"],
  "title": "At home on every screen."
}
```

### Languages and output

Each target code must have captions on every slide, including continuations. At most 10 languages including the original. Translations remain drafts; the agent or user must check wording and fit. One project retains the linked design. PNGs and the ZIP are organized as `en/01.png`, `es/01.png`, etc.

The output also includes `preview.png`, `project.henscreenshots`, and `report.json`. Preview is a contact sheet for review, not a store upload. PNG exports have exact profile dimensions and opaque RGB pixels. Correct dimensions do not guarantee store approval; content guidance and the actual app/device listing still matter.

v0.1 cannot author image overlays or per-language screenshot replacements in this small config. It can render those already present in an imported full Hen project. Source-only Wear OS exports are not supported in the local renderer. Native and browser rasterization can differ slightly, so compare the result visually before publication.
