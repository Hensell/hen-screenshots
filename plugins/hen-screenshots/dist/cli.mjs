import { parseArgs } from "node:util";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, open, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { strToU8, unzipSync, zipSync } from "fflate";
import sharp from "sharp";
import Konva from "konva";
import "konva/skia-backend";
import { FontLibrary, Image as Image$1 } from "skia-canvas";
//#region plugins/hen-screenshots/package.json
var version = "0.2.1";
//#endregion
//#region src/core/device-composition-spec.ts
var deviceCompositions = {
	sidekick: ["laptop", "ios"],
	handoff: ["monitor", "android"],
	companion: ["ipad", "ios"],
	duet: ["android-tablet", "android"],
	workspace: ["laptop", "ipad"],
	"desktop-suite": ["monitor", "android-tablet"],
	ecosystem: [
		"laptop",
		"ipad",
		"ios"
	],
	constellation: [
		"monitor",
		"android-tablet",
		"android"
	]
};
var compositionId = (id) => Object.hasOwn(deviceCompositions, id) ? id : void 0;
//#endregion
//#region src/core/panorama-families.ts
/** Explicit pairs keep imported documents from linking unrelated designs. */
var panoramaFamilies = {
	panorama: "panorama-end",
	daybreak: "daybreak-end",
	tidal: "tidal-end",
	orbit: "orbit-end",
	moonlight: "moonlight-end",
	atrium: "atrium-end",
	obsidian: "obsidian-end",
	offset: "offset-end",
	signal: "signal-end",
	mosaic: "mosaic-end",
	folio: "folio-end"
};
function panoramaStart(id) {
	return Object.keys(panoramaFamilies).find((start) => id === start || id === panoramaFamilies[start]);
}
function isPanoramaEnd(id) {
	const start = panoramaStart(id);
	return start !== void 0 && id === panoramaFamilies[start];
}
function isPanoramaTemplate(id) {
	return panoramaStart(id) !== void 0;
}
//#endregion
//#region src/core/special-profiles.ts
var specialProfiles = [
	{
		id: "apple-tv-hd",
		name: "App Store · Apple TV · HD",
		store: "apple",
		category: "desktop",
		width: 1920,
		height: 1080,
		maxCount: 10,
		note: "Use captures from the tvOS app.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "apple-tv-4k",
		name: "App Store · Apple TV · 4K",
		store: "apple",
		category: "desktop",
		width: 3840,
		height: 2160,
		maxCount: 10,
		note: "Use captures from the tvOS app.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "apple-vision",
		name: "App Store · Apple Vision Pro",
		store: "apple",
		category: "desktop",
		width: 3840,
		height: 2160,
		maxCount: 10,
		note: "Use captures from the visionOS app.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "apple-watch-422",
		name: "App Store · Apple Watch · 422 × 514",
		store: "apple",
		category: "phone",
		width: 422,
		height: 514,
		maxCount: 10,
		note: "Use the same Apple Watch screenshot size in every language.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "apple-watch-410",
		name: "App Store · Apple Watch · 410 × 502",
		store: "apple",
		category: "phone",
		width: 410,
		height: 502,
		maxCount: 10,
		note: "Use the same Apple Watch screenshot size in every language.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "apple-watch-416",
		name: "App Store · Apple Watch · 416 × 496",
		store: "apple",
		category: "phone",
		width: 416,
		height: 496,
		maxCount: 10,
		note: "Use the same Apple Watch screenshot size in every language.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "apple-watch-396",
		name: "App Store · Apple Watch · 396 × 484",
		store: "apple",
		category: "phone",
		width: 396,
		height: 484,
		maxCount: 10,
		note: "Use the same Apple Watch screenshot size in every language.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "apple-watch-368",
		name: "App Store · Apple Watch · 368 × 448",
		store: "apple",
		category: "phone",
		width: 368,
		height: 448,
		maxCount: 10,
		note: "Use the same Apple Watch screenshot size in every language.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "apple-watch-312",
		name: "App Store · Apple Watch · 312 × 390",
		store: "apple",
		category: "phone",
		width: 312,
		height: 390,
		maxCount: 10,
		note: "Use the same Apple Watch screenshot size in every language.",
		source: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/"
	},
	{
		id: "play-wear",
		name: "Google Play · Wear OS",
		store: "google",
		category: "phone",
		width: 384,
		height: 384,
		maxCount: 8,
		note: "Wear OS requires the app interface only: no device frame, extra text, graphics, or transparent masking.",
		source: "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en",
		sourceOnly: true
	},
	{
		id: "play-tv",
		name: "Google Play · Android TV screenshots",
		store: "google",
		category: "desktop",
		width: 1920,
		height: 1080,
		maxCount: 8,
		note: "Provide at least one Android TV screenshot and a separate Android TV banner.",
		source: "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en"
	},
	{
		id: "play-xr",
		name: "Google Play · Android XR",
		store: "google",
		category: "desktop",
		width: 3840,
		height: 2400,
		maxCount: 8,
		note: "Android XR needs 4–8 screenshots, each up to 8 MB.",
		source: "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en",
		maxBytes: 8e6
	},
	{
		id: "play-auto-portrait",
		name: "Google Play · Automotive · Portrait",
		store: "google",
		category: "desktop",
		width: 800,
		height: 1280,
		maxCount: 8,
		note: "For Automotive screenshot sets, provide at least 2 portrait and 2 landscape captures using the generic system UI.",
		source: "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en"
	},
	{
		id: "play-auto-landscape",
		name: "Google Play · Automotive · Landscape",
		store: "google",
		category: "desktop",
		width: 1024,
		height: 768,
		maxCount: 8,
		note: "For Automotive screenshot sets, provide at least 2 portrait and 2 landscape captures using the generic system UI.",
		source: "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en"
	}
];
//#endregion
//#region src/core/export-profiles.ts
var APPLE_SCREENSHOTS = "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/";
var PLAY_SCREENSHOTS = "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en";
function isBannerProfile(id) {
	return id === "play-feature-graphic" || id === "play-tv-banner";
}
var DEFAULT_CUSTOM_SIZE = {
	width: 1600,
	height: 1200
};
var CUSTOM_SIZE_LIMITS = {
	min: 256,
	max: 4096,
	maxRatio: 4
};
function validateCustomSize(size) {
	if (!size || !Number.isInteger(size.width) || !Number.isInteger(size.height) || Math.min(size.width, size.height) < CUSTOM_SIZE_LIMITS.min || Math.max(size.width, size.height) > CUSTOM_SIZE_LIMITS.max) throw new Error("Use whole numbers from 256 to 4096 pixels for each side.");
	if (Math.max(size.width, size.height) > Math.min(size.width, size.height) * CUSTOM_SIZE_LIMITS.maxRatio) throw new Error("The longest side must be no more than four times the shortest side (up to 4:1).");
}
var exportProfiles = [
	...specialProfiles,
	{
		id: "play-feature-graphic",
		name: "Google Play · Feature graphic",
		store: "google",
		category: "banner",
		width: 1024,
		height: 500,
		maxCount: 1,
		note: "Required for your store listing. Upload one feature graphic per language: 1024 × 500 pixels, without transparency.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "play-tv-banner",
		name: "Google Play · Android TV banner",
		store: "google",
		category: "banner",
		width: 1280,
		height: 720,
		maxCount: 1,
		note: "Required only for Android TV apps. Upload one banner per language: 1280 × 720 pixels, without transparency.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "play-phone-portrait",
		name: "Google Play · Phone · Portrait",
		store: "google",
		category: "phone",
		width: 1080,
		height: 1920,
		maxCount: 8,
		note: "At least 2 screenshots across device types to publish; 4 are recommended for apps.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "play-phone-landscape",
		name: "Google Play · Phone · Landscape",
		store: "google",
		category: "phone",
		width: 1920,
		height: 1080,
		maxCount: 8,
		note: "16:9 landscape. Up to 8 screenshots in the phone slot.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "play-tablet7-portrait",
		name: "Google Play · 7-inch tablet · Portrait",
		store: "google",
		category: "tablet",
		width: 1440,
		height: 2560,
		maxCount: 8,
		note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "play-tablet7-landscape",
		name: "Google Play · 7-inch tablet · Landscape",
		store: "google",
		category: "tablet",
		width: 2560,
		height: 1440,
		maxCount: 8,
		note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "play-tablet10-portrait",
		name: "Google Play · 10-inch tablet · Portrait",
		store: "google",
		category: "tablet",
		width: 1440,
		height: 2560,
		maxCount: 8,
		note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "play-tablet10-landscape",
		name: "Google Play · 10-inch tablet · Landscape",
		store: "google",
		category: "tablet",
		width: 2560,
		height: 1440,
		maxCount: 8,
		note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "play-chromebook",
		name: "Google Play · Chromebook",
		store: "google",
		category: "desktop",
		width: 1920,
		height: 1080,
		maxCount: 8,
		note: "For large screens, provide at least 4 captures of the actual app and exclude extra promotional text.",
		source: PLAY_SCREENSHOTS
	},
	{
		id: "apple-iphone69-portrait",
		name: "App Store · iPhone 6.9-inch · Portrait",
		store: "apple",
		category: "phone",
		width: 1320,
		height: 2868,
		maxCount: 10,
		note: "An accepted size for the 6.9-inch iPhone slot. Use screenshots from the iOS app.",
		source: APPLE_SCREENSHOTS
	},
	{
		id: "apple-iphone69-landscape",
		name: "App Store · iPhone 6.9-inch · Landscape",
		store: "apple",
		category: "phone",
		width: 2868,
		height: 1320,
		maxCount: 10,
		note: "An accepted size for the 6.9-inch iPhone slot. Use screenshots from the iOS app.",
		source: APPLE_SCREENSHOTS
	},
	{
		id: "apple-iphone65-portrait",
		name: "App Store · iPhone 6.5-inch · Portrait",
		store: "apple",
		category: "phone",
		width: 1242,
		height: 2688,
		maxCount: 10,
		note: "An accepted 6.5-inch size; this slot is required when 6.9-inch screenshots are not supplied.",
		source: APPLE_SCREENSHOTS
	},
	{
		id: "apple-iphone65-landscape",
		name: "App Store · iPhone 6.5-inch · Landscape",
		store: "apple",
		category: "phone",
		width: 2688,
		height: 1242,
		maxCount: 10,
		note: "An accepted 6.5-inch size; this slot is required when 6.9-inch screenshots are not supplied.",
		source: APPLE_SCREENSHOTS
	},
	{
		id: "apple-ipad13-portrait",
		name: "App Store · iPad 13-inch · Portrait",
		store: "apple",
		category: "tablet",
		width: 2064,
		height: 2752,
		maxCount: 10,
		note: "An accepted size for the 13-inch iPad slot, required for apps that run on iPad.",
		source: APPLE_SCREENSHOTS
	},
	{
		id: "apple-ipad13-landscape",
		name: "App Store · iPad 13-inch · Landscape",
		store: "apple",
		category: "tablet",
		width: 2752,
		height: 2064,
		maxCount: 10,
		note: "An accepted size for the 13-inch iPad slot, required for apps that run on iPad.",
		source: APPLE_SCREENSHOTS
	},
	{
		id: "apple-mac",
		name: "App Store · Mac",
		store: "apple",
		category: "desktop",
		width: 2880,
		height: 1800,
		maxCount: 10,
		note: "An accepted 16:10 Mac size. Use screenshots of the actual macOS app.",
		source: APPLE_SCREENSHOTS
	},
	{
		id: "desktop-web",
		name: "Presentation · Desktop & web",
		store: "presentation",
		category: "desktop",
		width: 1920,
		height: 1080,
		maxCount: 20,
		note: "A widescreen composition for your website or portfolio. No store slot is selected."
	},
	{
		id: "portfolio-card",
		name: "Portfolio · Card",
		store: "presentation",
		category: "desktop",
		width: 1600,
		height: 1200,
		maxCount: 20,
		note: "A 4:3 project card for a portfolio grid or case study. Use any device or a simple screenshot card."
	},
	{
		id: "portfolio-square",
		name: "Portfolio · Square",
		store: "presentation",
		category: "desktop",
		width: 1600,
		height: 1600,
		maxCount: 20,
		note: "A square canvas for project covers and portfolio tiles."
	},
	{
		id: "portfolio-portrait",
		name: "Portfolio · Portrait",
		store: "presentation",
		category: "desktop",
		width: 1200,
		height: 1500,
		maxCount: 20,
		note: "A 4:5 canvas with room for your product and its story."
	},
	{
		id: "portfolio-custom",
		name: "Portfolio · Custom",
		store: "presentation",
		category: "desktop",
		...DEFAULT_CUSTOM_SIZE,
		maxCount: 20,
		note: "Your own canvas size for a portfolio, project card or website. No store slot is selected."
	},
	{
		id: "portfolio-card-portrait",
		name: "Portfolio · Card · Portrait",
		store: "presentation",
		category: "desktop",
		width: 1200,
		height: 1600,
		maxCount: 20,
		note: "A portrait project card for your portfolio or case study."
	},
	{
		id: "portfolio-landscape",
		name: "Portfolio · Editorial · Landscape",
		store: "presentation",
		category: "desktop",
		width: 1500,
		height: 1200,
		maxCount: 20,
		note: "A landscape editorial canvas with room for your product and its story."
	},
	{
		id: "desktop-web-portrait",
		name: "Portfolio · Wide · Portrait",
		store: "presentation",
		category: "desktop",
		width: 1080,
		height: 1920,
		maxCount: 20,
		note: "A tall composition for your website or portfolio."
	}
];
var DEFAULT_EXPORT_PROFILE = "play-phone-portrait";
function getExportProfile(id) {
	const profile = exportProfiles.find((item) => item.id === id);
	if (!profile) throw new Error("This export preset is not supported.");
	return profile;
}
/** Every project consumer resolves custom dimensions through this same boundary. */
function resolveExportProfile(project) {
	const profile = getExportProfile(project.exportProfile);
	if (profile.id !== "portfolio-custom") return profile;
	validateCustomSize(project.customSize);
	return {
		...profile,
		width: project.customSize.width,
		height: project.customSize.height
	};
}
function canonicalCanvas(project) {
	const profile = resolveExportProfile(project);
	return {
		width: 1080,
		height: 1080 * profile.height / profile.width
	};
}
/** Size rules are separate from the allowlisted preset values, so bad edits fail closed. */
function validateDimensions(profile, width, height) {
	if (width !== profile.width || height !== profile.height || !Number.isInteger(width) || !Number.isInteger(height)) throw new Error("The exported image does not match the selected preset dimensions.");
	const special = specialProfiles.find((item) => item.id === profile.id);
	if (special) {
		if (profile.store !== special.store || profile.category !== special.category || width !== special.width || height !== special.height) throw new Error("These dimensions do not match the selected store device slot.");
		return;
	}
	if (isBannerProfile(profile.id)) {
		const expected = profile.id === "play-feature-graphic" ? [1024, 500] : [1280, 720];
		if (profile.store !== "google" || profile.category !== "banner" || width !== expected[0] || height !== expected[1]) throw new Error("Google Play banners must use their exact required dimensions.");
		return;
	}
	if (profile.category === "banner") throw new Error("This banner format is not supported.");
	if (profile.store === "presentation") validateCustomSize({
		width,
		height
	});
	if (profile.store === "google") {
		const short = Math.min(width, height), long = Math.max(width, height);
		if (short < 320 || long > 3840 || long > short * 2) throw new Error("These dimensions do not satisfy Google Play screenshot rules.");
		if (profile.category !== "phone" && (short < 1080 || long * 9 !== short * 16)) throw new Error("Google Play large-screen presets require 16:9 or 9:16 and at least 1080 pixels.");
	} else if (profile.store === "apple") {
		if (!{
			phone: profile.id.includes("iphone65") ? [
				[1242, 2688],
				[2688, 1242],
				[1284, 2778],
				[2778, 1284]
			] : [
				[1320, 2868],
				[2868, 1320],
				[1290, 2796],
				[2796, 1290],
				[1260, 2736],
				[2736, 1260]
			],
			tablet: [
				[2064, 2752],
				[2752, 2064],
				[2048, 2732],
				[2732, 2048]
			],
			desktop: [
				[1280, 800],
				[1440, 900],
				[2560, 1600],
				[2880, 1800]
			]
		}[profile.category].some(([w, h]) => w === width && h === height)) throw new Error("These dimensions are not accepted in the selected App Store slot.");
	}
}
async function validateExportPng(blob, profile) {
	const bytes = new Uint8Array(await blob.slice(0, 33).arrayBuffer());
	if (blob.type !== "image/png" || bytes.length < 33 || ![
		137,
		80,
		78,
		71,
		13,
		10,
		26,
		10
	].every((value, index) => bytes[index] === value) || String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR") throw new Error("The browser did not create a valid PNG.");
	const header = new DataView(bytes.buffer);
	validateDimensions(profile, header.getUint32(16), header.getUint32(20));
	if (bytes[24] !== 8 || bytes[25] !== 2) throw new Error("The exported PNG must be 24-bit RGB without transparency. Please export in a browser that supports opaque PNGs.");
}
//#endregion
//#region src/core/brand-kit.ts
var brandFonts = ["Manrope", "Fraunces"];
function invalid$1() {
	throw new Error("This brand kit is invalid or unsupported.");
}
function record$1(value, keys, optional = []) {
	if (!value || typeof value !== "object" || Array.isArray(value)) invalid$1();
	const raw = value;
	if (Object.keys(raw).some((key) => !keys.includes(key) && !optional.includes(key)) || keys.some((key) => !Object.hasOwn(raw, key))) invalid$1();
	return raw;
}
/** Only bounded raster thumbnails can be embedded in portable brand snapshots. */
function validateBrandLogo(value) {
	if (typeof value !== "string" || value.length > 102400 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) invalid$1();
	let binary;
	try {
		binary = atob(value.slice(22));
	} catch {
		invalid$1();
	}
	if (binary.length < 33 || binary.slice(0, 8) !== "PNG\r\n\n" || binary.slice(12, 16) !== "IHDR") invalid$1();
	const bytes = Uint8Array.from(binary.slice(16, 24), (char) => char.charCodeAt(0));
	const view = new DataView(bytes.buffer);
	if ([view.getUint32(0), view.getUint32(4)].some((size) => size < 1 || size > 128)) invalid$1();
}
function validateBrandKit(value) {
	const raw = record$1(value, [
		"schemaVersion",
		"id",
		"revision",
		"name",
		"createdAt",
		"updatedAt",
		"colors",
		"fonts"
	], ["logo"]);
	if (raw.schemaVersion !== 1 || typeof raw.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(raw.id)) invalid$1();
	if (typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 80 || raw.name.includes("\0")) invalid$1();
	for (const key of [
		"revision",
		"createdAt",
		"updatedAt"
	]) if (!Number.isSafeInteger(raw[key]) || raw[key] < (key === "revision" ? 1 : 0)) invalid$1();
	const colors = record$1(raw.colors, [
		"background",
		"text",
		"accent",
		"secondary"
	]);
	if (Object.values(colors).some((color) => typeof color !== "string" || !/^#[\da-f]{6}$/i.test(color))) invalid$1();
	const fonts = record$1(raw.fonts, ["title", "body"]);
	if (Object.values(fonts).some((font) => !brandFonts.includes(font))) invalid$1();
	if (Object.hasOwn(raw, "logo")) validateBrandLogo(raw.logo);
}
function brandSnapshotKey(kit) {
	return `${kit.id}_r${kit.revision}`;
}
//#endregion
//#region src/core/localization.ts
var languages = [
	["en", "English"],
	["es", "Español"],
	["fr", "Français"],
	["de", "Deutsch"],
	["pt", "Português"],
	["pt-BR", "Português (Brasil)"],
	["it", "Italiano"],
	["nl", "Nederlands"],
	["da", "Dansk"],
	["sv", "Svenska"],
	["no", "Norsk"],
	["fi", "Suomi"],
	["pl", "Polski"],
	["cs", "Čeština"],
	["ro", "Română"],
	["hu", "Magyar"],
	["tr", "Türkçe"],
	["id", "Bahasa Indonesia"]
];
var isLanguage = (code) => languages.some(([id]) => id === code);
function localeStatus(shot, locale) {
	const content = shot.translations?.[locale];
	if (!content || content.status === "untranslated") return "untranslated";
	if (content.sourceTitle !== shot.title || content.sourceSubtitle !== shot.subtitle) return "outdated";
	return content.status;
}
/** Content copies are independent; absence of a placement override inherits the shared design. */
function localContent(shot, locale) {
	shot.translations ??= {};
	return shot.translations[locale] ??= {
		title: shot.title,
		subtitle: shot.subtitle,
		sourceTitle: shot.title,
		sourceSubtitle: shot.subtitle,
		status: "untranslated"
	};
}
function addLanguage(project, source, target) {
	if (!isLanguage(source) || !isLanguage(target) || source === target) throw new Error("Choose two different languages.");
	if (project.localization && project.localization.source !== source) throw new Error("Keep the original language while translations exist.");
	const targets = project.localization?.targets ?? [];
	if (targets.includes(target)) throw new Error("This language is already in the project.");
	if (targets.length >= 9) throw new Error(`A project supports up to 10 languages.`);
	project.localization = {
		source,
		targets: [...targets, target]
	};
	project.shots.forEach((shot) => localContent(shot, target));
}
function writeText(shot, locale, key, value) {
	if (!locale) {
		shot[key] = value;
		return;
	}
	const content = localContent(shot, locale);
	content[key] = value;
	content[key === "title" ? "sourceTitle" : "sourceSubtitle"] = shot[key];
	content.status = "draft";
}
/** A disposable view: never save it. Every renderer receives the same resolved language. */
function localizedProject(project, locale) {
	if (!locale || !project.localization?.targets.includes(locale)) return project;
	return {
		...project,
		shots: project.shots.map((shot) => {
			const content = shot.translations?.[locale];
			return content ? {
				...shot,
				title: content.title,
				subtitle: content.subtitle,
				assetId: content.assetId ?? shot.assetId,
				...shot.companions ? { companions: shot.companions.map((device) => ({
					...device,
					assetId: content.deviceAssets?.[device.id] ?? device.assetId
				})) } : {},
				textOffsets: {
					...shot.textOffsets,
					...content.textOffsets
				},
				style: {
					...shot.style,
					...content.titleSize === void 0 ? {} : { titleSize: content.titleSize }
				}
			} : shot;
		})
	};
}
function referencedAssetIds(project) {
	return [...new Set(project.shots.flatMap((shot) => [
		shot.assetId,
		...shot.backgroundImage ? [shot.backgroundImage.assetId] : [],
		...(shot.overlays ?? []).map((item) => item.assetId),
		...(shot.companions ?? []).map((device) => device.assetId),
		...Object.values(shot.translations ?? {}).flatMap((content) => [...content.assetId ? [content.assetId] : [], ...Object.values(content.deviceAssets ?? {})])
	]).filter((id) => id !== null))];
}
var DEVICE_ROTATION_LIMITS = {
	min: -180,
	max: 180
};
var PLACEMENT_LIMITS = {
	x: {
		min: -1080,
		max: 2160
	},
	y: {
		min: -2160,
		max: 4096
	},
	width: {
		min: 32,
		max: 2160
	}
};
var LIMITS = {
	shots: 20,
	overlays: 8,
	assetBytes: 52428800,
	totalBytes: 125829120,
	imagePixels: 24e6
};
var legacyTemplateIds = [
	"classic",
	"spotlight",
	"tilt",
	"editorial"
];
var templateIds = [
	...legacyTemplateIds,
	"studio",
	"split",
	"halo",
	"gallery",
	"panorama",
	"panorama-end",
	"daybreak",
	"daybreak-end",
	"tidal",
	"tidal-end",
	"atrium",
	"atrium-end",
	"obsidian",
	"obsidian-end",
	"offset",
	"offset-end",
	"signal",
	"signal-end",
	"mosaic",
	"mosaic-end",
	"folio",
	"folio-end",
	"bloom",
	"punch",
	"prism",
	"paper",
	"orbit",
	"orbit-end",
	"workbench",
	"nocturne",
	"carbon",
	"ember",
	"confetti",
	"zest",
	"cabana",
	"contour",
	"cherry",
	"terracotta",
	"blueprint",
	"stitch",
	"parade",
	"jack-o-lantern",
	"cobweb",
	"boo",
	"witching-hour",
	"candy-club",
	"moonlight",
	"moonlight-end",
	"sidekick",
	"handoff",
	"companion",
	"duet",
	"workspace",
	"desktop-suite",
	"ecosystem",
	"constellation",
	"evergreen",
	"snowfall",
	"gift-wrap",
	"gingerbread",
	"midnight",
	"firework",
	"countdown",
	"first-light",
	"banner-signal",
	"banner-orbit",
	"banner-editorial",
	"banner-ribbon",
	"banner-dusk",
	"banner-confetti"
];
var TEXT_OFFSET_LIMITS = {
	x: 2160,
	y: 4320
};
var defaultStyle = {
	background: "#E3E8DE",
	textColor: "#202725",
	device: "android",
	deviceOrientation: "portrait",
	frame: true,
	camera: false,
	fit: "contain",
	align: "center",
	template: "classic",
	backgroundMode: "solid",
	backgroundEnd: "#E3E8DE",
	accentColor: "#47755B",
	texture: "none",
	accentTitle: false,
	titleSize: 84
};
var v3ExportProfiles = [
	"play-phone-portrait",
	"play-phone-landscape",
	"play-tablet7-portrait",
	"play-tablet7-landscape",
	"play-tablet10-portrait",
	"play-tablet10-landscape",
	"play-chromebook",
	"apple-iphone69-portrait",
	"apple-iphone69-landscape",
	"apple-iphone65-portrait",
	"apple-iphone65-landscape",
	"apple-ipad13-portrait",
	"apple-ipad13-landscape",
	"apple-mac",
	"desktop-web"
];
/** Add presentation defaults without changing an existing project's content or identity. */
function migrateProject(project) {
	validateProject(project);
	if (project.schemaVersion === 11) return project;
	if (project.schemaVersion === 4 || project.schemaVersion === 5 || project.schemaVersion === 6 || project.schemaVersion === 7 || project.schemaVersion === 8 || project.schemaVersion === 9 || project.schemaVersion === 10) return {
		...structuredClone(project),
		schemaVersion: 11
	};
	return {
		...project,
		schemaVersion: 11,
		exportProfile: project.schemaVersion === 3 ? project.exportProfile : DEFAULT_EXPORT_PROFILE,
		customSize: { ...DEFAULT_CUSTOM_SIZE },
		style: {
			...defaultStyle,
			...project.style
		},
		shots: project.shots.map((shot) => ({
			...shot,
			style: { ...shot.style },
			phone: {
				...shot.phone,
				rotation: "rotation" in shot.phone ? shot.phone.rotation : 0
			}
		}))
	};
}
function createProject(name = "Untitled app") {
	const now = Date.now();
	return {
		schemaVersion: 11,
		exportProfile: DEFAULT_EXPORT_PROFILE,
		customSize: { ...DEFAULT_CUSTOM_SIZE },
		id: crypto.randomUUID(),
		name,
		createdAt: now,
		updatedAt: now,
		style: { ...defaultStyle },
		shots: []
	};
}
function createShot(assetId, index) {
	return {
		id: crypto.randomUUID(),
		assetId,
		title: index === 0 ? "Your app.\nBeautifully presented." : "Make every detail count.",
		subtitle: "A little more to love, every day.",
		style: {},
		phone: {
			x: 230,
			y: 485,
			width: 620,
			rotation: 0
		}
	};
}
function resolveStyle(project, shot) {
	const style = {
		...project.style,
		...shot.style
	};
	if (isBannerProfile(project.exportProfile)) {
		style.device = "card";
		style.deviceOrientation = "landscape";
		style.frame = false;
		style.camera = false;
		style.fit = "contain";
	}
	return style;
}
var legacyStyleKeys = [
	"background",
	"textColor",
	"device",
	"frame",
	"camera",
	"fit",
	"align"
];
var v2StyleKeys = [
	...legacyStyleKeys,
	"template",
	"backgroundMode",
	"backgroundEnd",
	"accentColor",
	"texture",
	"accentTitle",
	"titleSize"
];
var styleKeys = [...v2StyleKeys, "deviceOrientation"];
function invalid() {
	throw new Error("This project document is invalid or unsupported.");
}
function object$1(value, keys, partial = false) {
	if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
	const result = value;
	if (Object.keys(result).some((key) => !keys.includes(key)) || !partial && keys.some((key) => !Object.hasOwn(result, key))) invalid();
	return result;
}
function textValue(value, maximum, minimum = 0) {
	if (typeof value !== "string" || value.length < minimum || value.length > maximum || value.includes("\0")) invalid();
	return value;
}
function identifier(value) {
	const result = textValue(value, 100, 1);
	if (!/^[a-zA-Z0-9_-]+$/.test(result)) invalid();
	return result;
}
function numeric(value, minimum, maximum, integer = false) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum || integer && !Number.isSafeInteger(value)) invalid();
}
function validateStyle(value, version, partial = false) {
	const entries = object$1(value, version === 1 ? legacyStyleKeys : version === 2 ? v2StyleKeys : [...styleKeys, ...version >= 6 ? ["titleFont", "bodyFont"].filter((key) => value && typeof value === "object" && Object.hasOwn(value, key)) : []], partial);
	for (const [key, item] of Object.entries(entries)) if ([
		"background",
		"textColor",
		"backgroundEnd",
		"accentColor"
	].includes(key)) {
		if (typeof item !== "string" || !/^#[\da-f]{6}$/i.test(item)) invalid();
	} else if ([
		"frame",
		"camera",
		"accentTitle"
	].includes(key)) {
		if (typeof item !== "boolean") invalid();
	} else if (key === "titleSize") numeric(item, 48, 132);
	else {
		const allowed = {
			device: version >= 4 ? [
				"android",
				"ios",
				"ipad",
				"android-tablet",
				"monitor",
				"laptop",
				"card"
			] : version === 3 ? [
				"android",
				"ios",
				"ipad",
				"android-tablet",
				"monitor",
				"laptop"
			] : ["android", "ios"],
			deviceOrientation: ["portrait", "landscape"],
			fit: ["contain", "cover"],
			align: ["left", "center"],
			template: [...version >= 4 ? templateIds : legacyTemplateIds],
			backgroundMode: ["solid", "gradient"],
			texture: ["none", "dots"],
			titleFont: [...brandFonts],
			bodyFont: [...brandFonts]
		};
		if (typeof item !== "string" || !allowed[key]?.includes(item)) invalid();
	}
}
/** Validate the original schema before migration, including local database rows. */
function validateProject(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
	const version = value.schemaVersion;
	if (version !== 1 && version !== 2 && version !== 3 && version !== 4 && version !== 5 && version !== 6 && version !== 7 && version !== 8 && version !== 9 && version !== 10 && version !== 11) throw new Error("This project uses an unsupported project version.");
	const raw = object$1(value, [
		"schemaVersion",
		"id",
		"name",
		"createdAt",
		"updatedAt",
		"style",
		"shots",
		...version >= 3 ? ["exportProfile"] : [],
		...version >= 4 ? ["customSize"] : [],
		...version >= 7 && Object.hasOwn(value, "localization") ? ["localization"] : [],
		...version >= 6 ? ["brands", "brand"].filter((key) => Object.hasOwn(value, key)) : []
	]);
	identifier(raw.id);
	textValue(raw.name, 80, 1);
	numeric(raw.createdAt, 0, Number.MAX_SAFE_INTEGER, true);
	numeric(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER, true);
	if (version >= 3 && !(version === 3 ? v3ExportProfiles : exportProfiles.map((profile) => profile.id)).some((profile) => profile === raw.exportProfile)) invalid();
	if (version >= 4) {
		const size = object$1(raw.customSize, ["width", "height"]);
		validateCustomSize({
			width: size.width,
			height: size.height
		});
	}
	if (Object.hasOwn(raw, "localization")) {
		const locale = object$1(raw.localization, ["source", "targets"]);
		if (!isLanguage(locale.source) || !Array.isArray(locale.targets) || locale.targets.length >= 10 || new Set(locale.targets).size !== locale.targets.length || locale.targets.some((code) => !isLanguage(code) || code === locale.source)) invalid();
	}
	validateStyle(raw.style, version);
	if (Object.hasOwn(raw, "brands")) {
		if (!raw.brands || typeof raw.brands !== "object" || Array.isArray(raw.brands)) invalid();
		const entries = Object.entries(raw.brands);
		if (entries.length > LIMITS.shots + 1) invalid();
		for (const [key, kit] of entries) {
			validateBrandKit(kit);
			if (key !== brandSnapshotKey(kit)) invalid();
		}
	}
	const validateBrandReference = (key) => {
		if (typeof key !== "string" || !raw.brands || !Object.hasOwn(raw.brands, key)) invalid();
	};
	if (Object.hasOwn(raw, "brand")) validateBrandReference(raw.brand);
	if (!Array.isArray(raw.shots) || raw.shots.length > LIMITS.shots) invalid();
	const ids = /* @__PURE__ */ new Set();
	for (const value of raw.shots) {
		const shot = object$1(value, [
			"id",
			"assetId",
			"title",
			"subtitle",
			"style",
			"phone",
			...version >= 11 && value && typeof value === "object" && Object.hasOwn(value, "backgroundImage") ? ["backgroundImage"] : [],
			...version >= 9 && value && typeof value === "object" && Object.hasOwn(value, "overlays") ? ["overlays"] : [],
			...version >= 8 && value && typeof value === "object" && Object.hasOwn(value, "companions") ? ["companions"] : [],
			...version >= 7 && value && typeof value === "object" && Object.hasOwn(value, "translations") ? ["translations"] : [],
			...version >= 5 && value && typeof value === "object" && Object.hasOwn(value, "textOffsets") ? ["textOffsets"] : [],
			...version >= 6 && value && typeof value === "object" && Object.hasOwn(value, "brand") ? ["brand"] : []
		]);
		if (Object.hasOwn(shot, "backgroundImage")) {
			const background = object$1(shot.backgroundImage, [
				"assetId",
				"fit",
				"opacity"
			]);
			identifier(background.assetId);
			if (background.fit !== "cover" && background.fit !== "contain") invalid();
			numeric(background.opacity, 0, 1);
		}
		if (Object.hasOwn(shot, "overlays")) {
			if (!Array.isArray(shot.overlays) || !shot.overlays.length || shot.overlays.length > LIMITS.overlays) invalid();
			const overlayIds = /* @__PURE__ */ new Set();
			for (const entry of shot.overlays) {
				const overlay = object$1(entry, [
					"id",
					"assetId",
					"name",
					"x",
					"y",
					"width",
					"height",
					"rotation"
				]);
				const id = identifier(overlay.id);
				if (overlayIds.has(id)) invalid();
				overlayIds.add(id);
				identifier(overlay.assetId);
				textValue(overlay.name, 255);
				for (const key of ["x", "y"]) numeric(overlay[key], PLACEMENT_LIMITS[key].min, PLACEMENT_LIMITS[key].max);
				for (const key of ["width", "height"]) numeric(overlay[key], 1e-9, 8640);
				numeric(overlay.rotation, -180, 180);
			}
		}
		const composition = compositionId(shot.style.template ?? raw.style.template);
		if (composition) {
			if (version < 8 || !Array.isArray(shot.companions) || shot.companions.length !== deviceCompositions[composition].length - 1) invalid();
		} else if (Object.hasOwn(shot, "companions")) invalid();
		const companions = /* @__PURE__ */ new Set();
		if (Object.hasOwn(shot, "companions")) {
			if (!Array.isArray(shot.companions) || shot.companions.length < 1 || shot.companions.length > 2) invalid();
			for (const [index, value] of shot.companions.entries()) {
				const device = object$1(value, [
					"id",
					"assetId",
					"style",
					"phone"
				]);
				if (device.id !== (index === 0 ? "secondary" : "tertiary")) invalid();
				companions.add(device.id);
				if (version < 10 || device.assetId !== null) identifier(device.assetId);
				object$1(device.style, [
					"device",
					"deviceOrientation",
					"frame",
					"camera",
					"fit"
				]);
				validateStyle(device.style, version, true);
				const placement = object$1(device.phone, [
					"x",
					"y",
					"width",
					"rotation"
				]);
				for (const key of [
					"x",
					"y",
					"width"
				]) numeric(placement[key], PLACEMENT_LIMITS[key].min, PLACEMENT_LIMITS[key].max);
				numeric(placement.rotation, DEVICE_ROTATION_LIMITS.min, DEVICE_ROTATION_LIMITS.max);
			}
		}
		if (Object.hasOwn(shot, "translations")) {
			const targets = raw.localization?.targets ?? [];
			const entries = object$1(shot.translations, targets, true);
			for (const item of Object.values(entries)) {
				const content = object$1(item, [
					"title",
					"subtitle",
					"sourceTitle",
					"sourceSubtitle",
					"status",
					...[
						"textOffsets",
						"titleSize",
						"assetId",
						...version >= 8 ? ["deviceAssets"] : []
					].filter((key) => item && typeof item === "object" && Object.hasOwn(item, key))
				]);
				textValue(content.title, 300);
				textValue(content.subtitle, 450);
				textValue(content.sourceTitle, 100);
				textValue(content.sourceSubtitle, 150);
				if (![
					"untranslated",
					"draft",
					"reviewed"
				].includes(content.status)) invalid();
				if (Object.hasOwn(content, "titleSize")) numeric(content.titleSize, 48, 132);
				if (Object.hasOwn(content, "assetId")) identifier(content.assetId);
				if (Object.hasOwn(content, "deviceAssets")) {
					const assets = object$1(content.deviceAssets, [...companions], true);
					Object.values(assets).forEach(identifier);
				}
				if (Object.hasOwn(content, "textOffsets")) {
					const offsets = object$1(content.textOffsets, ["title", "subtitle"], true);
					for (const offset of Object.values(offsets)) {
						const position = object$1(offset, ["x", "y"]);
						for (const key of ["x", "y"]) numeric(position[key], -TEXT_OFFSET_LIMITS[key], TEXT_OFFSET_LIMITS[key]);
					}
				}
			}
		}
		if (Object.hasOwn(shot, "brand")) validateBrandReference(shot.brand);
		if (Object.hasOwn(shot, "textOffsets")) {
			const offsets = object$1(shot.textOffsets, ["title", "subtitle"], true);
			for (const offset of Object.values(offsets)) {
				const position = object$1(offset, ["x", "y"]);
				for (const key of ["x", "y"]) numeric(position[key], -TEXT_OFFSET_LIMITS[key], TEXT_OFFSET_LIMITS[key]);
			}
		}
		const shotId = identifier(shot.id);
		if (ids.has(shotId)) throw new Error("The project has duplicate screenshot IDs.");
		ids.add(shotId);
		if (version < 10 || shot.assetId !== null) identifier(shot.assetId);
		textValue(shot.title, 100);
		textValue(shot.subtitle, 150);
		validateStyle(shot.style, version, true);
		const phone = object$1(shot.phone, version === 1 ? [
			"x",
			"y",
			"width"
		] : [
			"x",
			"y",
			"width",
			"rotation"
		]);
		const bounds = version >= 4 ? PLACEMENT_LIMITS : version === 3 ? {
			...PLACEMENT_LIMITS,
			width: {
				min: 160,
				max: 2160
			}
		} : {
			x: {
				min: -200,
				max: 900
			},
			y: {
				min: 100,
				max: 1500
			},
			width: {
				min: 320,
				max: 900
			}
		};
		for (const key of [
			"x",
			"y",
			"width"
		]) numeric(phone[key], bounds[key].min, bounds[key].max);
		if (version !== 1) numeric(phone.rotation, DEVICE_ROTATION_LIMITS.min, DEVICE_ROTATION_LIMITS.max);
	}
	if (version >= 4) {
		const project = value;
		if (isPanoramaTemplate(project.style.template)) invalid();
		for (let index = 0; index < project.shots.length; index++) {
			const left = project.shots[index];
			const style = resolveStyle(project, left);
			if (isPanoramaEnd(style.template)) invalid();
			const start = panoramaStart(style.template);
			if (!start) continue;
			const right = project.shots[++index];
			if (!right) invalid();
			if (left.companions || right.companions) invalid();
			const other = resolveStyle(project, right);
			if (version >= 7 && project.localization?.targets.some((locale) => (left.translations?.[locale]?.assetId ?? left.assetId) !== (right.translations?.[locale]?.assetId ?? right.assetId))) invalid();
			if (other.template !== panoramaFamilies[start] || left.assetId !== right.assetId || [
				"assetId",
				"fit",
				"opacity"
			].some((key) => left.backgroundImage?.[key] !== right.backgroundImage?.[key]) || [
				...styleKeys,
				"titleFont",
				"bodyFont"
			].some((key) => key !== "template" && style[key] !== other[key]) || [
				"x",
				"y",
				"width",
				"rotation"
			].some((key) => left.phone[key] !== right.phone[key])) throw new Error("This panorama has disconnected slides. Restore a complete linked pair.");
		}
	}
}
//#endregion
//#region src/rendering/geometry.ts
function positive(value, name) {
	if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number.`);
}
function handheldGeometry(family, width, frame) {
	const tablet = family === "ipad" || family === "android-tablet";
	const inset = frame ? width * (tablet ? .035 : family === "ios" ? .027 : .024) : 0;
	const screenWidth = width - inset * 2;
	const screenHeight = screenWidth * (family === "ipad" ? 4 / 3 : family === "android-tablet" ? 16 / 10 : family === "ios" ? 19.5 / 9 : 20 / 9);
	const radius = tablet ? frame ? width * (family === "ipad" ? .058 : .043) : 0 : width * (family === "ios" ? frame ? .13 : .102 : .078);
	const screen = {
		x: inset,
		y: inset,
		width: screenWidth,
		height: screenHeight,
		radius: Math.max(0, radius - inset)
	};
	const cameraWidth = tablet ? width * .009 : family === "ios" ? screenWidth * .29 : screenWidth * .032;
	const cameraHeight = family === "ios" ? screenWidth * .081 : cameraWidth;
	const height = screenHeight + inset * 2;
	const edge = width * (family === "ios" ? .006 : .004);
	const sideButton = (right, y, length) => ({
		x: right ? width - edge * 1.5 : 0,
		y: height * y,
		width: edge * 1.5,
		height: height * length,
		radius: edge * .65
	});
	const buttons = tablet ? [
		{
			x: width * .79,
			y: 0,
			width: width * .075,
			height: edge * 1.5,
			radius: edge * .65
		},
		sideButton(true, .075, .045),
		sideButton(true, .132, .045)
	] : family === "ios" ? [
		sideButton(false, .135, .028),
		sideButton(false, .205, .052),
		sideButton(false, .272, .052),
		sideButton(true, .235, .085),
		sideButton(true, .65, .06)
	] : [sideButton(true, .15, .085), sideButton(true, .27, .05)];
	return {
		version: 1,
		family,
		frame,
		width,
		height,
		radius,
		screen,
		camera: {
			x: tablet && frame ? width - (inset + cameraWidth) / 2 : (width - cameraWidth) / 2,
			y: tablet ? frame ? (height - cameraHeight) / 2 : width * .012 : inset + screenWidth * (family === "ios" ? .026 : .022),
			width: cameraWidth,
			height: cameraHeight,
			radius: cameraHeight / 2
		},
		...frame ? { handheld: {
			shell: {
				x: edge,
				y: tablet ? edge : 0,
				width: width - edge * 2,
				height: height - (tablet ? edge : 0),
				radius
			},
			buttons,
			antennaBands: tablet ? [] : [.085, .88].flatMap((y) => [edge, width - edge * 2.5].map((x) => ({
				x,
				y: height * y,
				width: edge * 1.5,
				height: width * .0035,
				radius: 0
			}))),
			...!tablet ? { speaker: {
				x: width * .435,
				y: inset * .27,
				width: width * .13,
				height: width * .0035,
				radius: width * .00175
			} } : {}
		} } : {}
	};
}
/** Generic geometry. Width covers the entire device, including a laptop's base. */
function deviceGeometry(family, width, frame, orientation = "portrait") {
	positive(width, "Device width");
	if (family === "card") {
		const height = width * (orientation === "landscape" ? 3 / 4 : 4 / 3);
		const radius = frame ? Math.min(width, height) * .035 : 0;
		return {
			version: 1,
			family,
			frame,
			width,
			height,
			radius,
			screen: {
				x: 0,
				y: 0,
				width,
				height,
				radius
			},
			camera: {
				x: 0,
				y: 0,
				width: 0,
				height: 0,
				radius: 0
			}
		};
	}
	if (family === "monitor" || family === "laptop") {
		const ratio = family === "monitor" ? 16 / 9 : 16 / 10;
		if (!frame) {
			const height = width / ratio;
			return {
				version: 1,
				family,
				frame,
				width,
				height,
				radius: 0,
				screen: {
					x: 0,
					y: 0,
					width,
					height,
					radius: 0
				},
				camera: {
					x: width * .495,
					y: width * .006,
					width: width * .01,
					height: width * .01,
					radius: width * .005
				}
			};
		}
		if (family === "monitor") {
			const inset = width * .014;
			const screenWidth = width - inset * 2;
			const screenHeight = screenWidth / ratio;
			const bodyHeight = inset + screenHeight + width * .057;
			const baseY = bodyHeight + width * .118;
			return {
				version: 1,
				family,
				frame,
				width,
				height: baseY + width * .017,
				radius: width * .022,
				screen: {
					x: inset,
					y: inset,
					width: screenWidth,
					height: screenHeight,
					radius: width * .006
				},
				camera: {
					x: width * .497,
					y: width * .004,
					width: width * .006,
					height: width * .006,
					radius: width * .003
				},
				body: {
					x: 0,
					y: 0,
					width,
					height: bodyHeight,
					radius: width * .022
				},
				stand: {
					x: width * .438,
					y: bodyHeight - width * .008,
					width: width * .124,
					height: baseY - bodyHeight + width * .015
				},
				base: {
					x: width * .345,
					y: baseY,
					width: width * .31,
					height: width * .017
				}
			};
		}
		const bodyX = width * .05;
		const bodyWidth = width * .9;
		const inset = width * .014;
		const screenWidth = bodyWidth - inset * 2;
		const screenHeight = screenWidth / ratio;
		const bodyHeight = screenHeight + inset * 2;
		const baseY = bodyHeight - width * .003;
		return {
			version: 1,
			family,
			frame,
			width,
			height: baseY + width * .088,
			radius: width * .024,
			screen: {
				x: bodyX + inset,
				y: inset,
				width: screenWidth,
				height: screenHeight,
				radius: width * .007
			},
			camera: {
				x: width * .497,
				y: width * .004,
				width: width * .006,
				height: width * .006,
				radius: width * .003
			},
			body: {
				x: bodyX,
				y: 0,
				width: bodyWidth,
				height: bodyHeight,
				radius: width * .024
			},
			base: {
				x: 0,
				y: baseY,
				width,
				height: width * .088
			},
			keyboard: {
				x: width * .13,
				y: baseY + width * .009,
				width: width * .74,
				height: width * .028
			},
			trackpad: {
				x: width * .402,
				y: baseY + width * .044,
				width: width * .196,
				height: width * .018
			}
		};
	}
	if (![
		"android",
		"ios",
		"ipad",
		"android-tablet"
	].includes(family)) throw new Error("This device frame is not supported.");
	if (orientation === "portrait") return handheldGeometry(family, width, frame);
	const portrait = handheldGeometry(family, width / handheldGeometry(family, 1, frame).height, frame);
	const rotate = (rect) => ({
		x: rect.y,
		y: portrait.width - rect.x - rect.width,
		width: rect.height,
		height: rect.width,
		radius: rect.radius
	});
	return {
		...portrait,
		width,
		height: portrait.width,
		screen: rotate(portrait.screen),
		camera: rotate(portrait.camera),
		...portrait.handheld ? { handheld: {
			shell: rotate(portrait.handheld.shell),
			buttons: portrait.handheld.buttons.map(rotate),
			antennaBands: portrait.handheld.antennaBands.map(rotate),
			...portrait.handheld.speaker ? { speaker: rotate(portrait.handheld.speaker) } : {}
		} } : {}
	};
}
/** Destination is centered; cover extends beyond the screen and is clipped there. */
function fitImage(sourceWidth, sourceHeight, target, mode) {
	positive(sourceWidth, "Image width");
	positive(sourceHeight, "Image height");
	positive(target.width, "Screen width");
	positive(target.height, "Screen height");
	const scale = (mode === "contain" ? Math.min : Math.max)(target.width / sourceWidth, target.height / sourceHeight);
	const width = sourceWidth * scale;
	const height = sourceHeight * scale;
	return {
		x: target.x + (target.width - width) / 2,
		y: target.y + (target.height - height) / 2,
		width,
		height
	};
}
//#endregion
//#region src/core/panorama-collection.ts
var base = {
	backgroundMode: "solid",
	texture: "none",
	accentTitle: false,
	align: "left",
	titleSize: 112
};
var collectionPanoramaStyles = {
	atrium: {
		...base,
		template: "atrium",
		background: "#F3EDE2",
		backgroundEnd: "#C5D0BE",
		textColor: "#303D36",
		accentColor: "#738774"
	},
	obsidian: {
		...base,
		template: "obsidian",
		background: "#191B20",
		backgroundEnd: "#343A42",
		textColor: "#F4F0E7",
		accentColor: "#A7B5BF"
	},
	offset: {
		...base,
		template: "offset",
		background: "#EEE9F7",
		backgroundEnd: "#A799C7",
		textColor: "#352E47",
		accentColor: "#D8EB86"
	},
	signal: {
		...base,
		template: "signal",
		background: "#FAEBDD",
		backgroundEnd: "#EF744C",
		textColor: "#302620",
		accentColor: "#AD352B",
		titleSize: 126
	},
	mosaic: {
		...base,
		template: "mosaic",
		background: "#FCEEE9",
		backgroundEnd: "#EAA1A9",
		textColor: "#56273A",
		accentColor: "#BD4565"
	},
	folio: {
		...base,
		template: "folio",
		background: "#F1F2E9",
		backgroundEnd: "#CFDADC",
		textColor: "#244448",
		accentColor: "#769A9D",
		titleSize: 108
	}
};
function collectionPanoramaId(template) {
	const family = panoramaStart(template);
	return family && family in collectionPanoramaStyles ? family : void 0;
}
/** Pose is orthographic 3D: the live screenshot, bezel and camera share the projection. */
var panoramaPoses = {
	atrium: {
		yaw: -32,
		pitch: 22,
		depth: .027
	},
	obsidian: {
		yaw: 38,
		pitch: 24,
		depth: .032
	},
	offset: {
		yaw: -28,
		pitch: 32,
		depth: .026
	}
};
function panoramaPose(template) {
	const id = collectionPanoramaId(template);
	return id && id in panoramaPoses ? panoramaPoses[id] : void 0;
}
var collectionPanoramaLayouts = {
	atrium: {
		composition: "sides",
		rotation: -12,
		centerX: 1080
	},
	obsidian: {
		composition: "reverse",
		rotation: 18,
		centerX: 1080
	},
	offset: {
		composition: "top",
		rotation: -28,
		centerX: 1080
	},
	signal: {
		composition: "top",
		rotation: 26,
		centerX: 1180
	},
	mosaic: {
		composition: "bottom",
		rotation: -16,
		centerX: 1080
	},
	folio: {
		composition: "sides",
		rotation: 0,
		centerX: 1160
	}
};
var metadata = {
	atrium: {
		name: "Atrium",
		category: "Editorial",
		appearance: "light",
		titleFont: "Fraunces",
		titleWeight: "600",
		description: "Soft daylight. A sculpted stage for your app.",
		note: "An isometric device floats above a sage pedestal, with architectural shadows joining both slides.",
		surfaceLabel: "Architectural stage · 3D",
		keywords: [
			"3d",
			"isometric",
			"perspective",
			"architecture",
			"sage",
			"cream",
			"pedestal",
			"depth"
		]
	},
	obsidian: {
		name: "Obsidian",
		category: "Editorial",
		appearance: "dark",
		description: "Graphite, silver edges and a little drama.",
		note: "A device in isometric perspective crosses a dark stone stage. Opposite captions leave the center open.",
		surfaceLabel: "Graphite stage · 3D",
		keywords: [
			"3d",
			"isometric",
			"perspective",
			"graphite",
			"dark",
			"stone",
			"silver",
			"depth"
		]
	},
	offset: {
		name: "Offset",
		category: "Bold",
		appearance: "colorful",
		description: "Fresh angles. A playful sense of space.",
		note: "Lilac steps and a lime platform support an isometric device, with both headlines above the scene.",
		surfaceLabel: "Stacked steps · 3D",
		keywords: [
			"3d",
			"isometric",
			"perspective",
			"lilac",
			"lime",
			"stairs",
			"blocks",
			"colorful"
		]
	},
	signal: {
		name: "Signal",
		category: "Bold",
		appearance: "colorful",
		description: "A warm, bold announcement across two slides.",
		note: "Oversized coral bands run behind a diagonally placed device. Two clear headlines anchor the top.",
		surfaceLabel: "Coral bands · 2 slides",
		keywords: [
			"coral",
			"orange",
			"diagonal",
			"bands",
			"graphic",
			"bold",
			"launch"
		]
	},
	mosaic: {
		name: "Mosaic",
		category: "Bold",
		appearance: "colorful",
		description: "Rose-colored tiles. Your app in the spotlight.",
		note: "A raised device sits above two captions, while rose tiles and rounded insets connect the background.",
		surfaceLabel: "Rose tiles · 2 slides",
		keywords: [
			"pink",
			"rose",
			"tiles",
			"checkerboard",
			"pattern",
			"colorful",
			"rounded"
		]
	},
	folio: {
		name: "Folio",
		category: "Minimal",
		appearance: "light",
		titleFont: "Fraunces",
		titleWeight: "600",
		description: "Quiet typography. A composition worth keeping.",
		note: "An upright device sits slightly off-center on layered paper, framed by fine rules and generous margins.",
		surfaceLabel: "Layered paper · 2 slides",
		keywords: [
			"paper",
			"editorial",
			"minimal",
			"serif",
			"teal",
			"mint",
			"light",
			"asymmetric"
		]
	}
};
var collectionPanoramaTemplates = Object.keys(metadata).map((id) => ({
	id,
	...metadata[id],
	style: collectionPanoramaStyles[id],
	phone: {
		x: 700,
		y: 180,
		width: 740,
		rotation: collectionPanoramaLayouts[id].rotation
	},
	title: {
		x: 80,
		y: 120,
		width: 500,
		height: 480
	},
	subtitle: {
		x: 84,
		y: 640,
		width: 490,
		height: 150
	},
	lineHeight: 1.04
}));
//#endregion
//#region src/core/panorama.ts
/** A panorama is an adjacent left/right unit. Roles travel with the slides. */
function panoramaPair(project, shotId) {
	if (resolveExportProfile(project).sourceOnly) return null;
	let index = project.shots.findIndex((shot) => shot.id === shotId);
	if (index < 0) return null;
	if (isPanoramaEnd(resolveStyle(project, project.shots[index]).template)) index--;
	const left = project.shots[index], right = project.shots[index + 1];
	const start = left && panoramaStart(resolveStyle(project, left).template);
	return start && left && right && resolveStyle(project, left).template === start && resolveStyle(project, right).template === panoramaFamilies[start] ? [left, right] : null;
}
function linkedShots(project, shotId) {
	return panoramaPair(project, shotId) ?? project.shots.filter((shot) => shot.id === shotId);
}
function shotCapacity(project) {
	const profile = resolveExportProfile(project);
	return profile.category === "banner" ? LIMITS.shots : Math.min(LIMITS.shots, profile.maxCount);
}
var panoramaStyle = {
	template: "panorama",
	background: "#F3E9DC",
	backgroundEnd: "#D8AF91",
	backgroundMode: "solid",
	textColor: "#382F29",
	accentColor: "#94563D",
	texture: "none",
	accentTitle: false,
	align: "left",
	titleSize: 104
};
var panoramaStyles = {
	...collectionPanoramaStyles,
	panorama: panoramaStyle,
	daybreak: {
		...panoramaStyle,
		template: "daybreak",
		background: "#FFF3DF",
		backgroundEnd: "#F5B650",
		accentColor: "#C47AA0",
		textColor: "#322723",
		titleSize: 118
	},
	tidal: {
		...panoramaStyle,
		template: "tidal",
		background: "#113E52",
		backgroundEnd: "#32677B",
		accentColor: "#91C6C8",
		textColor: "#F1F5E9",
		titleSize: 116
	},
	orbit: {
		...panoramaStyle,
		template: "orbit",
		background: "#171D32",
		backgroundEnd: "#303D60",
		accentColor: "#B9C9F2",
		textColor: "#F1F0E9",
		titleSize: 116
	},
	moonlight: {
		...panoramaStyle,
		template: "moonlight",
		background: "#192236",
		backgroundEnd: "#30405A",
		textColor: "#F5EBD8",
		accentColor: "#C6B7A6",
		titleSize: 116
	}
};
function collectionLayout$1(h, style, id) {
	const { composition, rotation, centerX: preferredCenter } = collectionPanoramaLayouts[id];
	const right = isPanoramaEnd(style.template);
	const wide = h <= 1080;
	const stacked = !wide && (composition === "top" || composition === "bottom");
	const area = stacked ? {
		width: 1360,
		y: h * (composition === "top" ? .36 : .055),
		height: h * .61
	} : {
		width: id === "folio" ? 900 : 1e3,
		y: h * .08,
		height: h * .84
	};
	const unit = deviceGeometry(style.device, 1e3, style.frame, style.deviceOrientation);
	const angle = Math.abs(rotation) * Math.PI / 180;
	const scale = Math.min(area.width / (Math.cos(angle) * unit.width + Math.sin(angle) * unit.height), area.height / (Math.sin(angle) * unit.width + Math.cos(angle) * unit.height));
	const width = Math.max(32, Math.min(2160, Math.floor(unit.width * scale)));
	const height = deviceGeometry(style.device, width, style.frame, style.deviceOrientation).height;
	const boundWidth = Math.cos(angle) * width + Math.sin(angle) * height;
	const centerX = 1080 + Math.min(preferredCenter - 1080, boundWidth * .2);
	const low = composition === "reverse" ? !right : right;
	const titleY = stacked ? composition === "top" ? .065 : .765 : wide ? low ? .42 : .09 : low ? .625 : .07;
	const subtitleY = stacked ? composition === "top" ? .25 : .92 : wide ? low ? .81 : .48 : low ? .885 : .375;
	const textX = stacked ? right ? 120 : 80 : right ? id === "folio" ? 590 : 570 : 80;
	const textWidth = stacked ? 830 : right ? id === "folio" ? 410 : 430 : 490;
	return {
		phone: {
			x: Math.round(centerX - width / 2),
			y: Math.round(area.y + (area.height - height) / 2),
			width,
			rotation
		},
		title: {
			x: textX,
			y: h * titleY,
			width: textWidth,
			height: h * (stacked ? .145 : wide ? .29 : .255)
		},
		subtitle: {
			x: textX + 4,
			y: h * subtitleY,
			width: textWidth - 8,
			height: h * (stacked ? .055 : wide ? .1 : .075)
		},
		panel: {
			x: 0,
			y: 0,
			width: 2160,
			height: h
		},
		fontScale: wide ? .64 : 1,
		subtitleSize: wide ? 24 : 32
	};
}
/** Phone placement lives in one 2160-wide scene; each export crops one half. */
function panoramaLayout(project, style) {
	const { height: h } = canonicalCanvas(project);
	const collection = collectionPanoramaId(style.template);
	if (collection) return collectionLayout$1(h, style, collection);
	const right = isPanoramaEnd(style.template);
	const family = panoramaStart(style.template);
	const expressive = family !== "panorama";
	const wide = h <= 1080;
	const rotation = family === "daybreak" ? 16 : family === "tidal" ? -10 : family === "orbit" ? 12 : family === "moonlight" ? -12 : -8;
	const unit = deviceGeometry(style.device, 1e3, style.frame, style.deviceOrientation);
	const radians = Math.abs(rotation) * Math.PI / 180;
	const boundW = Math.cos(radians) * unit.width + Math.sin(radians) * unit.height;
	const boundH = Math.sin(radians) * unit.width + Math.cos(radians) * unit.height;
	const scale = Math.min((expressive ? 1100 : 980) / boundW, h * .85 / boundH);
	const width = Math.floor(unit.width * scale);
	const height = deviceGeometry(style.device, width, style.frame, style.deviceOrientation).height;
	if (expressive) return {
		phone: {
			x: Math.round(1080 - width / 2),
			y: Math.round((h - height) / 2),
			width,
			rotation
		},
		title: {
			x: right ? wide ? 650 : 620 : 80,
			y: h * (wide ? .1 : right ? .65 : .065),
			width: wide ? 420 : right ? 390 : family === "moonlight" ? 420 : 520,
			height: h * (wide ? .4 : .25)
		},
		subtitle: {
			x: right ? wide ? 654 : 624 : 84,
			y: h * (wide ? .66 : right ? .915 : .33),
			width: wide ? 412 : right ? 386 : family === "moonlight" ? 416 : 490,
			height: h * (wide ? .16 : .065)
		},
		panel: {
			x: 0,
			y: 0,
			width: 2160,
			height: h
		},
		fontScale: wide ? .62 : 1,
		subtitleSize: wide ? 22 : 30
	};
	return {
		phone: {
			x: Math.round(1080 - width / 2),
			y: Math.round((h - height) / 2),
			width,
			rotation
		},
		title: {
			x: right ? 560 : 70,
			y: h * (right ? .6 : .085),
			width: 450,
			height: h * .24
		},
		subtitle: {
			x: right ? 560 : 74,
			y: h * (right ? .865 : .35),
			width: 446,
			height: h * .085
		},
		panel: {
			x: 0,
			y: 0,
			width: 2160,
			height: h
		},
		fontScale: wide ? .6 : .98,
		subtitleSize: wide ? 23 : 31
	};
}
function panoramaPreview(project, shot, keepColors = false, family = "panorama") {
	const existing = panoramaPair(project, shot.id);
	const left = existing?.[0] ?? shot;
	const right = existing?.[1] ?? {
		...shot,
		id: `${shot.id}-panorama-preview`,
		title: "A closer look.",
		subtitle: "",
		...shot.translations ? { translations: {} } : {},
		overlays: void 0
	};
	const patch = { ...panoramaStyles[family] };
	if (keepColors) for (const key of [
		"background",
		"backgroundEnd",
		"textColor",
		"accentColor"
	]) delete patch[key];
	const shared = {
		...resolveStyle(project, left),
		...patch
	};
	const phone = panoramaLayout(project, shared).phone;
	return [left, right].map((source, index) => {
		const { textOffsets: _offsets, companions: _companions, overlays: _overlays, backgroundImage: _backgroundImage, ...content } = source;
		return {
			...content,
			...source.overlays ? { overlays: structuredClone(source.overlays) } : {},
			...source.translations || left.translations ? { translations: Object.fromEntries((project.localization?.targets ?? []).map((locale) => {
				const { assetId: _asset, deviceAssets: _deviceAssets, textOffsets: _translatedOffsets, titleSize: _translatedSize, ...words } = source.translations?.[locale] ?? {
					title: source.title,
					subtitle: source.subtitle,
					sourceTitle: source.title,
					sourceSubtitle: source.subtitle,
					status: "untranslated"
				};
				return [locale, {
					...structuredClone(words),
					...left.translations?.[locale]?.assetId ? { assetId: left.translations[locale].assetId } : {}
				}];
			})) } : {},
			...left.backgroundImage ? { backgroundImage: { ...left.backgroundImage } } : {},
			assetId: left.assetId,
			style: {
				...shared,
				template: index === 0 ? family : panoramaFamilies[family]
			},
			phone: { ...phone }
		};
	});
}
function applyPanorama(project, shotId, keepColors = false, family = "panorama") {
	const selected = project.shots.find((shot) => shot.id === shotId);
	if (!selected) return;
	const existing = panoramaPair(project, shotId);
	if (!existing && project.shots.length + 1 > shotCapacity(project)) throw new Error(`Panorama needs two slides. This format allows ${shotCapacity(project)}; remove a slide first.`);
	const previews = panoramaPreview(project, selected, keepColors, family);
	if (!existing) previews[1].id = crypto.randomUUID();
	const index = project.shots.findIndex((shot) => shot.id === previews[0].id);
	project.shots.splice(index, existing ? 2 : 1, ...previews);
}
//#endregion
//#region src/core/showcase-templates.ts
/** Only new IDs use these defaults; saved compositions keep their existing geometry. */
function defineTemplate(meta, colors, options = {}) {
	return {
		...meta,
		style: {
			template: meta.id,
			background: colors[0],
			backgroundEnd: colors[1],
			textColor: colors[2],
			accentColor: colors[3],
			backgroundMode: options.gradient ? "gradient" : "solid",
			texture: "none",
			accentTitle: false,
			align: options.align ?? "left",
			titleSize: options.size ?? 108
		},
		phone: {
			x: 250,
			y: 640,
			width: 580,
			rotation: options.rotation ?? 0
		},
		title: {
			x: 80,
			y: 120,
			width: 920,
			height: 300
		},
		subtitle: {
			x: 84,
			y: 480,
			width: 912,
			height: 110
		},
		lineHeight: meta.titleFont ? 1.06 : 1.04
	};
}
var showcaseTemplates = [
	defineTemplate({
		id: "prism",
		name: "Prism",
		category: "Bold",
		appearance: "colorful",
		composition: "angled",
		surfaceLabel: "Folded color",
		keywords: [
			"pastel",
			"mint",
			"blue",
			"angled",
			"fold",
			"colorful"
		],
		description: "Folded color. A fresh perspective.",
		note: "Translucent planes and an angled device bring depth to your app, with every color editable."
	}, [
		"#E5F0F1",
		"#B4C9E0",
		"#233C4B",
		"#708CA0"
	], {
		rotation: 9,
		size: 116,
		gradient: true
	}),
	defineTemplate({
		id: "nocturne",
		name: "Nocturne",
		category: "Editorial",
		appearance: "dark",
		composition: "caption",
		surfaceLabel: "Inset panel",
		keywords: [
			"dark",
			"plum",
			"serif",
			"quiet",
			"luxury",
			"portfolio"
		],
		titleFont: "Fraunces",
		titleWeight: "600",
		description: "Rich plum. A quiet, confident finish.",
		note: "An inset product panel and a serif caption turn your screenshot into an editorial feature."
	}, [
		"#241E2A",
		"#39303F",
		"#F5EBDF",
		"#C7A998"
	], { size: 108 }),
	{
		...defineTemplate({
			id: "orbit",
			name: "Orbit",
			category: "Bold",
			appearance: "dark",
			surfaceLabel: "Orbital arcs · 2 slides",
			keywords: [
				"dark",
				"midnight",
				"navy",
				"rings",
				"space"
			],
			description: "One device. A whole new orbit.",
			note: "A midnight panorama with elliptical arcs flowing across two slides and a shared tilted device."
		}, [
			"#171D32",
			"#303D60",
			"#F1F0E9",
			"#B9C9F2"
		]),
		style: panoramaStyles.orbit
	},
	defineTemplate({
		id: "paper",
		name: "Paper",
		category: "Editorial",
		appearance: "light",
		composition: "masthead",
		surfaceLabel: "Paper margin",
		keywords: [
			"light",
			"cream",
			"serif",
			"print",
			"journal",
			"portfolio"
		],
		titleFont: "Fraunces",
		titleWeight: "600",
		description: "A considered story, set on warm paper.",
		note: "A serif masthead, a fine rule and a separate caption give your work the feel of a printed feature."
	}, [
		"#F5EEE2",
		"#E5D9C5",
		"#3D362D",
		"#96714F"
	], { size: 116 }),
	defineTemplate({
		id: "carbon",
		name: "Carbon",
		category: "Minimal",
		appearance: "dark",
		composition: "technical",
		surfaceLabel: "Precision lines",
		keywords: [
			"dark",
			"graphite",
			"technical",
			"minimal",
			"desktop"
		],
		description: "Sharp detail. Nothing competing with your app.",
		note: "Graphite surfaces, precise corner marks and a restrained accent suit detailed interfaces and desktop tools."
	}, [
		"#202522",
		"#323B35",
		"#F0F2E8",
		"#B8CA9F"
	], { size: 106 }),
	defineTemplate({
		id: "workbench",
		name: "Workbench",
		category: "Minimal",
		appearance: "light",
		composition: "desk",
		surfaceLabel: "Drafting grid",
		keywords: [
			"light",
			"blue",
			"grid",
			"desktop",
			"laptop",
			"monitor",
			"portfolio",
			"case study"
		],
		description: "Give the work room to speak.",
		note: "An expansive product area on a subtle drafting grid, with a headline above and a caption below. Made for portfolio cards."
	}, [
		"#EAF0EE",
		"#CFDCD8",
		"#2F4844",
		"#71938A"
	], { size: 100 }),
	defineTemplate({
		id: "ember",
		name: "Ember",
		category: "Bold",
		appearance: "dark",
		composition: "pedestal",
		surfaceLabel: "Copper stage",
		keywords: [
			"dark",
			"warm",
			"copper",
			"espresso",
			"stage"
		],
		description: "A warm stage after dark.",
		note: "Copper planes and an elliptical stage frame the device against espresso, with clean, centered typography."
	}, [
		"#251D1A",
		"#674435",
		"#F9EAD9",
		"#D4A478"
	], {
		align: "center",
		size: 114
	}),
	defineTemplate({
		id: "confetti",
		name: "Confetti",
		category: "Bold",
		appearance: "colorful",
		composition: "collage",
		surfaceLabel: "Cut paper",
		keywords: [
			"colorful",
			"peach",
			"green",
			"playful",
			"collage",
			"cut paper"
		],
		description: "A little playful. Entirely yours.",
		note: "Layered paper shapes and a gentle tilt bring energy to a launch, without getting in the way of your words."
	}, [
		"#F6EADB",
		"#E8AA8E",
		"#34463D",
		"#628373"
	], {
		rotation: -7,
		size: 120
	})
];
/** Caption and product regions never overlap; the shared fitter handles every device family. */
function showcaseAreas(composition, h) {
	const rect = (x, y, width, height) => ({
		x,
		y: h * y,
		width,
		height: h * height
	});
	const wide = h <= 1080;
	if (composition === "desk") return {
		title: rect(76, .055, 928, .15),
		subtitle: rect(80, .885, 920, .07),
		area: rect(80, .27, 920, .54)
	};
	if (composition === "caption") return wide ? {
		title: rect(638, .2, 362, .36),
		subtitle: rect(642, .7, 358, .18),
		area: rect(68, .09, 494, .82)
	} : {
		title: rect(84, .77, 912, .13),
		subtitle: rect(88, .925, 904, .05),
		area: rect(100, .06, 880, .64)
	};
	if (composition === "masthead" && !wide) return {
		title: rect(80, .055, 920, .175),
		subtitle: rect(84, .905, 912, .055),
		area: rect(100, .3, 880, .535)
	};
	if (wide) return {
		title: rect(72, .13, 340, .39),
		subtitle: rect(76, .7, 332, .18),
		area: rect(470, .1, 538, .8)
	};
	return {
		title: rect(84, .065, 912, .185),
		subtitle: rect(88, .275, 904, .06),
		area: rect(90, .37, 900, .575)
	};
}
//#endregion
//#region src/core/banner-templates.ts
var bannerTemplates = [
	defineTemplate({
		id: "banner-signal",
		name: "Signal",
		category: "Minimal",
		appearance: "light",
		surfaceLabel: "Soft stage",
		description: "Your artwork, with room for a clear message.",
		note: "A calm sage stage holds your icon or illustration beside a generous headline.",
		keywords: [
			"banner",
			"green",
			"sage",
			"minimal",
			"icon"
		]
	}, [
		"#E6EDDF",
		"#CFDDBF",
		"#283E30",
		"#7F9766"
	], { size: 74 }),
	defineTemplate({
		id: "banner-orbit",
		name: "Brand Orbit",
		category: "Bold",
		appearance: "dark",
		surfaceLabel: "Orbital rings",
		description: "A small world built around your app.",
		note: "Fine orbital rings surround your artwork on deep blue, with a clear message alongside.",
		keywords: [
			"banner",
			"dark",
			"blue",
			"rings",
			"icon"
		]
	}, [
		"#223E59",
		"#305570",
		"#FAEEDA",
		"#9DBFBF"
	], { size: 78 }),
	defineTemplate({
		id: "banner-editorial",
		name: "Wordmark",
		category: "Editorial",
		appearance: "light",
		titleFont: "Fraunces",
		titleWeight: "600",
		surfaceLabel: "Editorial rule",
		description: "A considered headline. Your brand alongside.",
		note: "A serif headline and fine rules balance an image on a warm paper backdrop.",
		keywords: [
			"banner",
			"serif",
			"cream",
			"editorial",
			"logo"
		]
	}, [
		"#F5EBDB",
		"#E3D3B9",
		"#583D31",
		"#A67555"
	], { size: 78 }),
	defineTemplate({
		id: "banner-ribbon",
		name: "Coral Ribbon",
		category: "Bold",
		appearance: "colorful",
		surfaceLabel: "Color ribbon",
		description: "An open canvas with a confident sweep of color.",
		note: "A broad coral ribbon carries your artwork, with the text balanced on the opposite side.",
		keywords: [
			"banner",
			"coral",
			"orange",
			"ribbon"
		]
	}, [
		"#F8E1CE",
		"#E8AC91",
		"#713A32",
		"#C37159"
	], { size: 76 }),
	defineTemplate({
		id: "banner-dusk",
		name: "Dusk",
		category: "Editorial",
		appearance: "dark",
		titleFont: "Fraunces",
		titleWeight: "600",
		surfaceLabel: "Evening arch",
		description: "Rich plum, soft shapes, and your story.",
		note: "An evening arch highlights your illustration. A serif headline sits alongside on a deep plum backdrop.",
		keywords: [
			"banner",
			"dark",
			"plum",
			"arch",
			"serif"
		]
	}, [
		"#493344",
		"#72546C",
		"#F9ECDD",
		"#C7A98F"
	], { size: 78 }),
	defineTemplate({
		id: "banner-confetti",
		name: "Paper Parade",
		category: "Bold",
		appearance: "colorful",
		surfaceLabel: "Paper shapes",
		description: "A playful first impression, in paper and color.",
		note: "Large paper shapes add rhythm around your artwork while leaving the headline clear.",
		keywords: [
			"banner",
			"yellow",
			"paper",
			"shapes",
			"playful"
		]
	}, [
		"#F5EDBA",
		"#DED496",
		"#404C39",
		"#8E9C71"
	], { size: 76 })
];
function isBannerTemplate(id) {
	return bannerTemplates.some((template) => template.id === id);
}
/** Central margins are an editorial guide, not a promise about every Play placement. */
function bannerLayout(project, style) {
	const h = canonicalCanvas(project).height;
	const artworkLeft = style.template === "banner-ribbon" || style.template === "banner-dusk";
	const panel = {
		x: artworkLeft ? 110 : 600,
		y: h * .15,
		width: 370,
		height: h * .7
	};
	const width = Math.min(panel.width, panel.height / .75) * .82;
	const textX = artworkLeft ? 540 : 110;
	return {
		phone: {
			x: panel.x + (panel.width - width) / 2,
			y: panel.y + (panel.height - width * .75) / 2,
			width,
			rotation: 0
		},
		title: {
			x: textX,
			y: h * .23,
			width: 430,
			height: h * .34
		},
		subtitle: {
			x: textX + 2,
			y: h * .66,
			width: 408,
			height: h * .13
		},
		panel,
		fontScale: 1,
		subtitleSize: 24
	};
}
//#endregion
//#region src/core/device-composition.ts
function companionFor(shot, element) {
	return shot.companions?.find((device) => `device:${device.id}` === element);
}
function deviceShot(shot, element) {
	const device = companionFor(shot, element);
	return device ? {
		...shot,
		assetId: device.assetId,
		phone: device.phone,
		style: {
			...shot.style,
			...device.style
		}
	} : shot;
}
var kind = (device) => device === "monitor" || device === "laptop" ? "desktop" : device === "ipad" || device === "android-tablet" ? "tablet" : device === "card" ? "card" : "mobile";
function frameStyle(device) {
	return {
		device,
		deviceOrientation: kind(device) === "desktop" ? "landscape" : "portrait",
		frame: true,
		camera: device === "ios",
		fit: "contain"
	};
}
/** Reuse each platform's image when moving between compositions. New slots start with the current capture. */
function configureDevices(project, shot, templateId) {
	const id = compositionId(templateId);
	if (!id) {
		delete shot.companions;
		for (const content of Object.values(shot.translations ?? {})) delete content.deviceAssets;
		return;
	}
	const previous = [{
		id: "primary",
		assetId: shot.assetId,
		style: resolveStyle(project, shot)
	}, ...shot.companions ?? []];
	const slots = deviceCompositions[id].map((device) => previous.find((old) => kind(old.style.device) === kind(device)) ?? previous[0]);
	for (const content of Object.values(shot.translations ?? {})) {
		const images = slots.map((slot) => slot.id === "primary" ? content.assetId : content.deviceAssets?.[slot.id]);
		delete content.assetId;
		delete content.deviceAssets;
		images.forEach((asset, index) => {
			if (!asset) return;
			if (index === 0) content.assetId = asset;
			else (content.deviceAssets ??= {})[index === 1 ? "secondary" : "tertiary"] = asset;
		});
	}
	shot.assetId = slots[0].assetId;
	Object.assign(shot.style, frameStyle(deviceCompositions[id][0]));
	shot.companions = deviceCompositions[id].slice(1).map((device, index) => ({
		id: index === 0 ? "secondary" : "tertiary",
		assetId: slots[index + 1].assetId,
		style: frameStyle(device),
		phone: { ...shot.phone }
	}));
}
/** Fit one cluster as a unit; its slots remain independent after the initial layout. */
function compositionLayout(project, style, companions) {
	const id = compositionId(style.template);
	const h = canonicalCanvas(project).height;
	const wide = h <= 1080;
	const panel = wide ? {
		x: 350,
		y: h * .1,
		width: 665,
		height: h * .8
	} : {
		x: 60,
		y: h * .34,
		width: 960,
		height: h * .59
	};
	const families = deviceCompositions[id];
	const frames = [style, ...families.slice(1).map((device, index) => ({
		...style,
		...companions?.[index]?.style ?? frameStyle(device)
	}))];
	const poses = families.length === 3 ? [
		{
			x: 110,
			y: 10,
			width: 780,
			rotation: 0
		},
		{
			x: 0,
			y: 290,
			width: 390,
			rotation: -8
		},
		{
			x: 740,
			y: 280,
			width: 220,
			rotation: 7
		}
	] : kind(families[0]) === "tablet" ? [{
		x: 100,
		y: 10,
		width: 590,
		rotation: -5
	}, {
		x: 610,
		y: 350,
		width: 245,
		rotation: 7
	}] : kind(families[1]) === "tablet" ? [{
		x: 40,
		y: 20,
		width: 790,
		rotation: -2
	}, {
		x: 590,
		y: 250,
		width: 380,
		rotation: 6
	}] : [{
		x: 30,
		y: 30,
		width: 820,
		rotation: -2
	}, {
		x: 740,
		y: 170,
		width: 230,
		rotation: 6
	}];
	const mirrored = [
		"handoff",
		"duet",
		"desktop-suite",
		"constellation"
	].includes(id);
	const boxes = frames.map((frame, index) => {
		const pose = { ...poses[index] };
		const size = deviceGeometry(frame.device, pose.width, frame.frame, frame.deviceOrientation);
		if (mirrored) {
			pose.x = 1e3 - pose.x - size.width;
			pose.rotation *= -1;
		}
		const a = Math.abs(pose.rotation) * Math.PI / 180;
		const w = Math.cos(a) * size.width + Math.sin(a) * size.height;
		const h = Math.sin(a) * size.width + Math.cos(a) * size.height;
		return {
			...pose,
			height: size.height,
			left: pose.x + size.width / 2 - w / 2,
			top: pose.y + size.height / 2 - h / 2,
			w,
			h
		};
	});
	const left = Math.min(...boxes.map((box) => box.left));
	const top = Math.min(...boxes.map((box) => box.top));
	const clusterWidth = Math.max(...boxes.map((box) => box.left + box.w)) - left;
	const height = Math.max(...boxes.map((box) => box.top + box.h)) - top;
	const scale = Math.min((panel.width - 8) / clusterWidth, (panel.height - 8) / height);
	const devices = boxes.map((box, index) => {
		const width = Math.max(PLACEMENT_LIMITS.width.min, box.width * scale);
		const frame = frames[index];
		const geometry = deviceGeometry(frame.device, width, frame.frame, frame.deviceOrientation);
		const angle = Math.abs(box.rotation) * Math.PI / 180;
		const rotatedWidth = Math.cos(angle) * geometry.width + Math.sin(angle) * geometry.height;
		const rotatedHeight = Math.sin(angle) * geometry.width + Math.cos(angle) * geometry.height;
		const cx = panel.x + panel.width / 2 + (box.x + box.width / 2 - left - clusterWidth / 2) * scale;
		const cy = panel.y + panel.height / 2 + (box.y + box.height / 2 - top - height / 2) * scale;
		return {
			x: Math.max(panel.x + rotatedWidth / 2, Math.min(panel.x + panel.width - rotatedWidth / 2, cx)) - geometry.width / 2,
			y: Math.max(panel.y + rotatedHeight / 2, Math.min(panel.y + panel.height - rotatedHeight / 2, cy)) - geometry.height / 2,
			width,
			rotation: box.rotation
		};
	});
	return {
		phone: devices[0],
		devices,
		panel,
		title: wide ? {
			x: 70,
			y: h * .13,
			width: 260,
			height: h * .43
		} : {
			x: 90,
			y: h * .065,
			width: 900,
			height: h * .17
		},
		subtitle: wide ? {
			x: 74,
			y: h * .65,
			width: 252,
			height: h * .18
		} : {
			x: 94,
			y: h * .255,
			width: 860,
			height: h * .06
		},
		fontScale: wide ? .62 : .96,
		subtitleSize: wide ? 23 : 32
	};
}
var multiDeviceTemplates = [
	{
		id: "sidekick",
		name: "Sidekick",
		appearance: "light",
		colors: [
			"#F4EDDF",
			"#E1D1B4",
			"#302B24",
			"#987044"
		],
		description: "Your desktop app. Its pocket-sized companion.",
		category: "Minimal"
	},
	{
		id: "handoff",
		name: "Handoff",
		appearance: "dark",
		colors: [
			"#18283B",
			"#29475B",
			"#F0F4EC",
			"#8CBABD"
		],
		description: "From the big screen to the palm of your hand.",
		category: "Bold"
	},
	{
		id: "companion",
		name: "Companion",
		appearance: "light",
		colors: [
			"#EEE9F3",
			"#D8CEE5",
			"#3D304A",
			"#8B6DA1"
		],
		description: "Two ways to carry your best ideas.",
		category: "Minimal"
	},
	{
		id: "duet",
		name: "Duet",
		appearance: "colorful",
		colors: [
			"#FAE4DA",
			"#E9B1A0",
			"#4F2F30",
			"#B7594B"
		],
		description: "A phone and a tablet, perfectly in tune.",
		category: "Bold"
	},
	{
		id: "workspace",
		name: "Workspace",
		appearance: "light",
		colors: [
			"#E8EBDD",
			"#CDD6BF",
			"#303C2F",
			"#718565"
		],
		description: "Room to create. Space to explore.",
		category: "Editorial"
	},
	{
		id: "desktop-suite",
		name: "Desktop Suite",
		appearance: "dark",
		colors: [
			"#272B2B",
			"#3C4542",
			"#F1EFE3",
			"#B9BE99"
		],
		description: "A complete workspace, across two screens.",
		category: "Editorial"
	},
	{
		id: "ecosystem",
		name: "Ecosystem",
		appearance: "light",
		colors: [
			"#F6F0E5",
			"#E4D4BE",
			"#37312D",
			"#B08864"
		],
		description: "One app. Every screen. All together.",
		category: "Editorial"
	},
	{
		id: "constellation",
		name: "Constellation",
		appearance: "dark",
		colors: [
			"#222239",
			"#3D3B5C",
			"#F3EEF9",
			"#B5A5D1"
		],
		description: "Your whole product, in one connected scene.",
		category: "Bold"
	}
].map((design) => defineTemplate({
	id: design.id,
	name: design.name,
	appearance: design.appearance,
	category: design.category,
	description: design.description,
	note: "Each device has its own screenshot, frame, size, and position. Select a device to make it yours.",
	surfaceLabel: "Device stage",
	keywords: [
		"multiple devices",
		"responsive",
		"cross-platform",
		"combined",
		...deviceCompositions[design.id].flatMap((device) => device === "ios" || device === "android" ? ["mobile", "phone"] : device === "ipad" || device === "android-tablet" ? ["tablet"] : ["desktop", device]),
		...deviceCompositions[design.id].length === 3 ? ["trio", "three devices"] : ["duo", "two devices"]
	]
}, design.colors, { size: 112 }));
//#endregion
//#region src/core/holiday-templates.ts
/** Timeless seasonal designs: no fixed year, date, or baked-in caption. */
var holidayTemplates = [
	defineTemplate({
		id: "evergreen",
		name: "Evergreen",
		category: "Editorial",
		appearance: "dark",
		composition: "right-low",
		surfaceLabel: "Pine & ornaments",
		titleFont: "Fraunces",
		titleWeight: "600",
		keywords: [
			"christmas",
			"december",
			"pine",
			"ornaments",
			"green",
			"gold"
		],
		description: "Deep forest green. A little Christmas gold.",
		note: "Pine branches and hanging ornaments frame a tilted device, with generous space for a serif headline above."
	}, [
		"#173C32",
		"#2C5745",
		"#FAF0D8",
		"#D4B578"
	], {
		rotation: -7,
		size: 116
	}),
	defineTemplate({
		id: "snowfall",
		name: "Snowfall",
		category: "Minimal",
		appearance: "light",
		composition: "left-high",
		surfaceLabel: "Paper snowflakes",
		keywords: [
			"christmas",
			"december",
			"winter",
			"snow",
			"snowflakes",
			"blue"
		],
		description: "Fresh snow. A quieter kind of Christmas.",
		note: "Delicate snowflakes and soft snowdrifts surround a raised device, balanced by a clear headline below."
	}, [
		"#EDF4F5",
		"#CCDFE4",
		"#284C5B",
		"#739AAA"
	], {
		rotation: 5,
		size: 112
	}),
	defineTemplate({
		id: "gift-wrap",
		name: "Gift Wrap",
		category: "Bold",
		appearance: "colorful",
		composition: "diagonal-center",
		surfaceLabel: "Ribbon & plaid",
		keywords: [
			"christmas",
			"december",
			"gift",
			"ribbon",
			"plaid",
			"red"
		],
		description: "Your app, wrapped for the holidays.",
		note: "Cranberry checks and a generous ribbon bow wrap around a diagonal device. Captions sit above and below."
	}, [
		"#F6E8D7",
		"#DBBDB1",
		"#752D36",
		"#AB4350"
	], {
		rotation: 14,
		size: 116
	}),
	defineTemplate({
		id: "gingerbread",
		name: "Gingerbread",
		category: "Bold",
		appearance: "colorful",
		composition: "right-high",
		surfaceLabel: "Iced gingerbread",
		keywords: [
			"christmas",
			"december",
			"cookies",
			"gingerbread",
			"cinnamon",
			"cream"
		],
		description: "A warm welcome, with icing on top.",
		note: "Iced cookie houses, trees, and stars surround a raised device. A warm cinnamon palette leaves the lower headline in focus."
	}, [
		"#F8EBDD",
		"#E5C4A2",
		"#59382A",
		"#A76A45"
	], {
		rotation: -5,
		size: 114
	}),
	defineTemplate({
		id: "midnight",
		name: "Midnight",
		category: "Editorial",
		appearance: "dark",
		composition: "diagonal-center",
		surfaceLabel: "Art deco celebration",
		titleFont: "Fraunces",
		titleWeight: "600",
		keywords: [
			"new year",
			"january",
			"celebration",
			"art deco",
			"black",
			"gold"
		],
		description: "A golden entrance to the new year.",
		note: "Fine geometric fans and gold stars frame a diagonal device on charcoal, with elegant serif captions above and below."
	}, [
		"#242629",
		"#373B3F",
		"#F8EBD4",
		"#C5A66B"
	], {
		rotation: -12,
		size: 116
	}),
	defineTemplate({
		id: "firework",
		name: "Firework",
		category: "Bold",
		appearance: "dark",
		composition: "left-low",
		surfaceLabel: "Fireworks at night",
		keywords: [
			"new year",
			"january",
			"celebration",
			"fireworks",
			"navy",
			"copper"
		],
		description: "Start the year with a spark.",
		note: "Copper fireworks burst around a low device against a deep navy sky, leaving open space for your message."
	}, [
		"#202B43",
		"#34476A",
		"#FBEBD9",
		"#DF9673"
	], {
		rotation: 6,
		size: 118
	}),
	defineTemplate({
		id: "countdown",
		name: "Countdown",
		category: "Bold",
		appearance: "colorful",
		composition: "raised-center",
		surfaceLabel: "Clock & streamers",
		keywords: [
			"new year",
			"january",
			"celebration",
			"clock",
			"streamers",
			"pink"
		],
		description: "A little anticipation. A brand-new chapter.",
		note: "A celebration clock, curled streamers, and scattered confetti surround a centered device, with a bold headline below."
	}, [
		"#F9E8DC",
		"#E6BDB9",
		"#653341",
		"#AD5368"
	], {
		rotation: 0,
		size: 116
	}),
	defineTemplate({
		id: "first-light",
		name: "First Light",
		category: "Minimal",
		appearance: "light",
		composition: "left-middle",
		surfaceLabel: "New year sunrise",
		keywords: [
			"new year",
			"january",
			"sunrise",
			"sage",
			"fresh start",
			"cream"
		],
		description: "A fresh start, in softer light.",
		note: "A rising sun and fine rays trace an arch behind the device. Soft sage and cream keep the new-year message calm and clear."
	}, [
		"#F4F0DF",
		"#D9DFC5",
		"#374B3B",
		"#889467"
	], {
		rotation: -4,
		size: 112
	})
].map((template) => ({
	...template,
	deviceInset: .09
}));
//#endregion
//#region src/core/halloween-templates.ts
/** Seasonal artwork remains available year-round; every color stays editable. */
var halloweenTemplates = [
	defineTemplate({
		id: "jack-o-lantern",
		name: "Jack O’ Lantern",
		category: "Bold",
		appearance: "colorful",
		composition: "right-low",
		surfaceLabel: "Pumpkin patch",
		keywords: [
			"halloween",
			"october",
			"pumpkin",
			"orange",
			"autumn",
			"warm"
		],
		description: "A pumpkin patch for your next big launch.",
		note: "Carved pumpkins and warm orange shapes frame a device tilted toward the lower right, with a headline above and supporting text on the left."
	}, [
		"#F8E7CF",
		"#D97736",
		"#3D281F",
		"#94512E"
	], {
		rotation: -8,
		size: 116
	}),
	defineTemplate({
		id: "cobweb",
		name: "Cobweb",
		category: "Editorial",
		appearance: "dark",
		composition: "left-high",
		surfaceLabel: "Cobweb corners",
		keywords: [
			"halloween",
			"october",
			"spider",
			"web",
			"charcoal",
			"gothic"
		],
		titleFont: "Fraunces",
		titleWeight: "600",
		description: "Fine threads. A quietly spooky frame.",
		note: "Silver cobwebs and small hanging spiders surround a raised device. A serif headline anchors the lower right."
	}, [
		"#202129",
		"#31333F",
		"#F3EDE1",
		"#B7B0C8"
	], {
		rotation: 5,
		size: 112
	}),
	defineTemplate({
		id: "boo",
		name: "Boo",
		category: "Minimal",
		appearance: "light",
		composition: "right-high",
		surfaceLabel: "Friendly ghosts",
		keywords: [
			"halloween",
			"october",
			"ghost",
			"lavender",
			"cute",
			"playful"
		],
		description: "A friendly little fright, in soft lavender.",
		note: "Paper-colored ghosts float around a raised device on a lavender backdrop, with a generous headline below."
	}, [
		"#F2ECF5",
		"#D6C7E2",
		"#3E304B",
		"#9375AA"
	], {
		rotation: -5,
		size: 116
	}),
	defineTemplate({
		id: "witching-hour",
		name: "Witching Hour",
		category: "Editorial",
		appearance: "dark",
		composition: "diagonal-center",
		surfaceLabel: "Witch hat & stars",
		keywords: [
			"halloween",
			"october",
			"witch",
			"stars",
			"plum",
			"gold",
			"magic"
		],
		titleFont: "Fraunces",
		titleWeight: "600",
		description: "Plum, starlight, and a little magic.",
		note: "A tilted device rests inside a celestial circle, with a witch hat and gold stars. Serif captions sit above and below."
	}, [
		"#302237",
		"#594060",
		"#F9EBDC",
		"#D4B16C"
	], {
		rotation: 14,
		size: 116
	}),
	defineTemplate({
		id: "candy-club",
		name: "Candy Club",
		category: "Bold",
		appearance: "colorful",
		composition: "raised-center",
		surfaceLabel: "Wrapped candy",
		keywords: [
			"halloween",
			"october",
			"candy",
			"pink",
			"orange",
			"sweet",
			"playful"
		],
		description: "All treats. A sweeter way to show your app.",
		note: "Wrapped sweets and candy-colored ribbons border a centered device, with the headline and supporting text below."
	}, [
		"#F8DAB1",
		"#E8AAB6",
		"#492D40",
		"#AC729F"
	], {
		rotation: 0,
		size: 114
	}),
	{
		...defineTemplate({
			id: "moonlight",
			name: "Moonlight",
			category: "Editorial",
			appearance: "dark",
			surfaceLabel: "Moonlit night · 2 slides",
			keywords: [
				"halloween",
				"october",
				"moon",
				"bats",
				"night",
				"navy",
				"forest"
			],
			titleFont: "Fraunces",
			titleWeight: "600",
			description: "One moonlit night. A story across two slides.",
			note: "A large moon, flying bats, and rolling night hills connect two slides around one shared device. Each slide keeps its own text."
		}, [
			"#192236",
			"#30405A",
			"#F5EBD8",
			"#C6B7A6"
		]),
		style: panoramaStyles.moonlight
	}
].map((template) => ({
	...template,
	deviceInset: template.id === "witching-hour" ? .03 : .09
}));
//#endregion
//#region src/core/text-placement.ts
function textOffset(shot, element) {
	return shot.textOffsets?.[element] ?? {
		x: 0,
		y: 0
	};
}
function resetText(shot, element) {
	if (!element) delete shot.textOffsets;
	else if (shot.textOffsets) {
		delete shot.textOffsets[element];
		if (Object.keys(shot.textOffsets).length === 0) delete shot.textOffsets;
	}
}
/** A new canvas/template refits every language; ordinary resets stay local. */
function refitText(shot, resetSizes = false) {
	resetText(shot);
	for (const text of Object.values(shot.translations ?? {})) {
		delete text.textOffsets;
		if (resetSizes) delete text.titleSize;
	}
}
//#endregion
//#region src/core/pattern-templates.ts
var patternTemplates = [
	defineTemplate({
		id: "zest",
		name: "Zest",
		category: "Bold",
		appearance: "colorful",
		composition: "right-low",
		surfaceLabel: "Citrus stripes",
		keywords: [
			"yellow",
			"citrus",
			"green",
			"stripes",
			"right",
			"tilted",
			"pattern"
		],
		description: "Citrus color. An off-center point of view.",
		note: "Broad stripes carry a tilted device toward the lower right, with room for a headline and a separate side caption."
	}, [
		"#F5ECA9",
		"#DED36F",
		"#293F2C",
		"#778544"
	], {
		rotation: -12,
		size: 120
	}),
	defineTemplate({
		id: "cabana",
		name: "Cabana",
		category: "Minimal",
		appearance: "colorful",
		composition: "left-high",
		surfaceLabel: "Awning stripes",
		keywords: [
			"aqua",
			"teal",
			"cream",
			"stripes",
			"left",
			"upper",
			"pattern"
		],
		description: "A little coastal rhythm. Your app up front.",
		note: "A raised device sits to the left of a striped awning, with the headline tucked into the lower right."
	}, [
		"#E8F3E9",
		"#B4D5CA",
		"#234F4B",
		"#6F9D8E"
	], {
		rotation: 8,
		size: 108
	}),
	defineTemplate({
		id: "contour",
		name: "Contour",
		category: "Editorial",
		appearance: "dark",
		composition: "left-middle",
		surfaceLabel: "Topographic lines",
		keywords: [
			"dark",
			"petrol",
			"teal",
			"topographic",
			"contours",
			"left",
			"pattern"
		],
		titleFont: "Fraunces",
		titleWeight: "600",
		description: "Find a new angle in the details.",
		note: "Fine topographic curves follow a device on the left, balanced by an elevated serif headline and a side caption."
	}, [
		"#173E40",
		"#285858",
		"#F0ECD5",
		"#83ACA0"
	], {
		rotation: -9,
		size: 112
	}),
	defineTemplate({
		id: "cherry",
		name: "Cherry",
		category: "Bold",
		appearance: "colorful",
		composition: "right-high",
		surfaceLabel: "Cherry checkerboard",
		keywords: [
			"red",
			"pink",
			"checker",
			"checkerboard",
			"damier",
			"right",
			"upper",
			"pattern"
		],
		description: "A bright check. A confident entrance.",
		note: "Cherry checks border a high, right-aligned device. A generous caption below finishes the composition."
	}, [
		"#F9E0DE",
		"#E6ABA8",
		"#762F39",
		"#BE5964"
	], {
		rotation: -5,
		size: 120
	}),
	defineTemplate({
		id: "terracotta",
		name: "Terracotta",
		category: "Editorial",
		appearance: "light",
		composition: "diagonal-center",
		surfaceLabel: "Clay fans",
		keywords: [
			"clay",
			"orange",
			"sand",
			"fans",
			"arcs",
			"diagonal",
			"pattern"
		],
		titleFont: "Fraunces",
		titleWeight: "600",
		description: "Warm clay. A bolder angle.",
		note: "Sculpted fan patterns surround a diagonal device, framed by a serif headline above and supporting text below."
	}, [
		"#F2DDCA",
		"#D9A082",
		"#583A30",
		"#B27053"
	], {
		rotation: 20,
		size: 116
	}),
	defineTemplate({
		id: "blueprint",
		name: "Blueprint",
		category: "Bold",
		appearance: "dark",
		composition: "left-low",
		surfaceLabel: "Drafting marks",
		keywords: [
			"dark",
			"cobalt",
			"blue",
			"grid",
			"drafting",
			"technical",
			"left",
			"lower",
			"pattern"
		],
		description: "Make your next idea look ready.",
		note: "A low, left-aligned device sits on a cobalt drafting grid, with fine dimension marks and open space for your message."
	}, [
		"#203F82",
		"#2A5198",
		"#F3EEDA",
		"#9AB9E0"
	], { size: 112 }),
	defineTemplate({
		id: "stitch",
		name: "Stitch",
		category: "Minimal",
		appearance: "colorful",
		composition: "raised-center",
		surfaceLabel: "Woven zigzags",
		keywords: [
			"lilac",
			"lavender",
			"purple",
			"zigzag",
			"woven",
			"stitch",
			"upper",
			"pattern"
		],
		description: "Soft color, with a thread of character.",
		note: "A raised device floats between woven zigzag borders. A lower headline and separate supporting caption keep the story balanced."
	}, [
		"#ECE5F1",
		"#D4C3DD",
		"#483653",
		"#947AA7"
	], {
		rotation: 4,
		size: 110
	}),
	defineTemplate({
		id: "parade",
		name: "Parade",
		category: "Bold",
		appearance: "dark",
		composition: "diagonal-low",
		surfaceLabel: "Scalloped bands",
		keywords: [
			"dark",
			"burgundy",
			"rose",
			"pink",
			"scallops",
			"bands",
			"diagonal",
			"pattern"
		],
		description: "A little movement. A memorable launch.",
		note: "Rose-colored scalloped bands run behind a steeply tilted device, with a top headline and a caption in the opposite corner."
	}, [
		"#4A2439",
		"#773A56",
		"#FAE7D8",
		"#C48092"
	], {
		rotation: -19,
		size: 120
	})
];
/** Separate regions keep the asymmetry intentional at store and portfolio ratios. */
function patternAreas(composition, h) {
	const rect = (x, y, width, height) => ({
		x,
		y: h * y,
		width,
		height: h * height
	});
	const wide = h <= 1080;
	switch (composition) {
		case "right-low": return wide ? {
			title: rect(60, .07, 310, .39),
			subtitle: rect(64, .64, 306, .22),
			area: rect(430, .12, 590, .83)
		} : {
			title: rect(72, .055, 760, .23),
			subtitle: rect(76, .37, 270, .15),
			area: rect(390, .33, 640, .63)
		};
		case "left-high": return wide ? {
			title: rect(650, .2, 370, .33),
			subtitle: rect(654, .72, 366, .17),
			area: rect(52, .06, 535, .85)
		} : {
			title: rect(345, .755, 675, .155),
			subtitle: rect(349, .93, 671, .045),
			area: rect(48, .035, 780, .66)
		};
		case "left-middle": return wide ? {
			title: rect(725, .1, 295, .37),
			subtitle: rect(730, .67, 290, .2),
			area: rect(52, .08, 605, .85)
		} : {
			title: rect(310, .05, 710, .185),
			subtitle: rect(768, .47, 252, .16),
			area: rect(42, .29, 655, .665)
		};
		case "right-high": return wide ? {
			title: rect(64, .22, 330, .38),
			subtitle: rect(68, .76, 326, .16),
			area: rect(475, .045, 550, .84)
		} : {
			title: rect(64, .76, 952, .14),
			subtitle: rect(68, .93, 948, .045),
			area: rect(248, .025, 780, .68)
		};
		case "diagonal-center": return wide ? {
			title: rect(56, .12, 260, .39),
			subtitle: rect(60, .69, 256, .23),
			area: rect(365, .075, 660, .85)
		} : {
			title: rect(64, .055, 952, .155),
			subtitle: rect(68, .895, 944, .06),
			area: rect(48, .27, 984, .555)
		};
		case "left-low": return wide ? {
			title: rect(730, .09, 290, .36),
			subtitle: rect(734, .7, 286, .2),
			area: rect(48, .17, 615, .76)
		} : {
			title: rect(72, .055, 944, .16),
			subtitle: rect(710, .245, 306, .085),
			area: rect(48, .35, 790, .6)
		};
		case "raised-center": return wide ? {
			title: rect(60, .1, 320, .39),
			subtitle: rect(64, .85, 952, .1),
			area: rect(448, .045, 575, .75)
		} : {
			title: rect(64, .75, 652, .16),
			subtitle: rect(776, .765, 244, .145),
			area: rect(215, .065, 650, .605)
		};
		case "diagonal-low": return wide ? {
			title: rect(64, .035, 950, .14),
			subtitle: rect(625, .855, 395, .11),
			area: rect(58, .25, 958, .54)
		} : {
			title: rect(64, .045, 810, .18),
			subtitle: rect(625, .87, 391, .09),
			area: rect(48, .285, 960, .53)
		};
		default: return;
	}
}
//#endregion
//#region src/core/templates.ts
/** IDs and geometry are part of document v2. Add new IDs for incompatible designs. */
var templates = [
	...collectionPanoramaTemplates,
	...holidayTemplates,
	...multiDeviceTemplates,
	...halloweenTemplates,
	...patternTemplates,
	...showcaseTemplates,
	{
		id: "daybreak",
		name: "Daybreak",
		keywords: [
			"sunrise",
			"warm",
			"colorful",
			"waves",
			"yellow",
			"pink"
		],
		category: "Bold",
		surfaceLabel: "Color waves · 2 slides",
		description: "Warm light. Rolling color. One connected story.",
		note: "A tilted device bridges two slides over continuous, editable color waves.",
		style: panoramaStyles.daybreak,
		phone: {
			x: 700,
			y: 150,
			width: 760,
			rotation: 16
		},
		title: {
			x: 80,
			y: 125,
			width: 520,
			height: 480
		},
		subtitle: {
			x: 84,
			y: 634,
			width: 490,
			height: 125
		},
		lineHeight: 1.04
	},
	{
		id: "tidal",
		name: "Tidal",
		keywords: [
			"ocean",
			"blue",
			"waves",
			"serif",
			"dark"
		],
		category: "Editorial",
		surfaceLabel: "Flowing lines · 2 slides",
		description: "Deep blue, sculpted waves and expressive serif type.",
		note: "An editorial panorama with one shared device and flowing lines that meet at the seam.",
		style: panoramaStyles.tidal,
		titleFont: "Fraunces",
		titleWeight: "600",
		phone: {
			x: 700,
			y: 150,
			width: 760,
			rotation: -10
		},
		title: {
			x: 80,
			y: 125,
			width: 520,
			height: 480
		},
		subtitle: {
			x: 84,
			y: 634,
			width: 490,
			height: 125
		},
		lineHeight: 1.06
	},
	{
		id: "bloom",
		name: "Bloom",
		keywords: [
			"botanical",
			"nature",
			"green",
			"leaves",
			"serif",
			"light"
		],
		category: "Editorial",
		surfaceLabel: "Botanical",
		description: "Leaf silhouettes, soft paper and a little room to grow.",
		note: "An open arch frames your screenshot; a serif headline brings a quieter, editorial rhythm.",
		style: {
			template: "bloom",
			background: "#F2F0E3",
			backgroundEnd: "#D8E2C7",
			textColor: "#294638",
			accentColor: "#708763",
			backgroundMode: "solid",
			texture: "none",
			accentTitle: false,
			align: "center",
			titleSize: 112
		},
		titleFont: "Fraunces",
		titleWeight: "600",
		phone: {
			x: 250,
			y: 653,
			width: 580,
			rotation: 0
		},
		title: {
			x: 80,
			y: 115,
			width: 920,
			height: 300
		},
		subtitle: {
			x: 100,
			y: 460,
			width: 880,
			height: 100
		},
		lineHeight: 1.04
	},
	{
		id: "punch",
		name: "Punch",
		keywords: [
			"coral",
			"red",
			"poster",
			"arch",
			"colorful"
		],
		category: "Bold",
		surfaceLabel: "Coral poster",
		description: "Big words. A bold arch. Your app takes the stage.",
		note: "A coral poster with oversized typography and a tilted device on a contrasting stage.",
		style: {
			template: "punch",
			background: "#C34836",
			backgroundEnd: "#F6AE88",
			textColor: "#FFF6E8",
			accentColor: "#843628",
			backgroundMode: "solid",
			texture: "none",
			accentTitle: false,
			align: "left",
			titleSize: 132
		},
		phone: {
			x: 250,
			y: 653,
			width: 580,
			rotation: -6
		},
		title: {
			x: 80,
			y: 115,
			width: 920,
			height: 300
		},
		subtitle: {
			x: 84,
			y: 460,
			width: 900,
			height: 100
		},
		lineHeight: 1.01
	},
	{
		id: "classic",
		name: "Classic",
		keywords: [
			"clean",
			"simple",
			"sage",
			"green",
			"light"
		],
		category: "Minimal",
		description: "A little framing. Plenty of breathing room.",
		note: "The original Hen look, with your full screenshot in view.",
		style: {
			template: "classic",
			background: "#E3E8DE",
			backgroundEnd: "#E3E8DE",
			backgroundMode: "solid",
			textColor: "#202725",
			accentColor: "#47755B",
			texture: "none",
			accentTitle: false,
			align: "center",
			titleSize: 84
		},
		phone: {
			x: 230,
			y: 485,
			width: 620,
			rotation: 0
		},
		title: {
			x: 92,
			y: 126,
			width: 896,
			height: 226
		},
		subtitle: {
			x: 92,
			y: 375,
			width: 896,
			height: 80
		},
		lineHeight: 1.15
	},
	{
		id: "spotlight",
		name: "Spotlight",
		keywords: [
			"dark",
			"green",
			"dots",
			"close up"
		],
		category: "Bold",
		description: "Big words. A closer look at your app.",
		note: "A generous product view with a bold headline.",
		style: {
			template: "spotlight",
			background: "#142E29",
			backgroundEnd: "#366753",
			backgroundMode: "gradient",
			textColor: "#FAF6EB",
			accentColor: "#C5E9AD",
			texture: "dots",
			accentTitle: true,
			align: "center",
			titleSize: 106
		},
		phone: {
			x: 120,
			y: 622,
			width: 840,
			rotation: 0
		},
		title: {
			x: 82,
			y: 142,
			width: 916,
			height: 276
		},
		subtitle: {
			x: 110,
			y: 456,
			width: 860,
			height: 94
		},
		lineHeight: 1.06
	},
	{
		id: "tilt",
		name: "Tilt",
		keywords: [
			"angled",
			"diagonal",
			"warm",
			"cream"
		],
		category: "Bold",
		description: "An unexpected angle. A confident entrance.",
		note: "A considered angle and an oversized headline.",
		style: {
			template: "tilt",
			background: "#F4EADA",
			backgroundEnd: "#CDBFA4",
			backgroundMode: "gradient",
			textColor: "#29372F",
			accentColor: "#9B4D30",
			texture: "none",
			accentTitle: true,
			align: "left",
			titleSize: 116
		},
		phone: {
			x: 190,
			y: 680,
			width: 740,
			rotation: -9
		},
		title: {
			x: 86,
			y: 130,
			width: 908,
			height: 310
		},
		subtitle: {
			x: 90,
			y: 482,
			width: 820,
			height: 94
		},
		lineHeight: 1.04
	},
	{
		id: "editorial",
		name: "Editorial",
		keywords: [
			"warm",
			"paper",
			"panel",
			"peach"
		],
		surfaceLabel: "Panel",
		category: "Editorial",
		description: "Let your product lead. Then make your point.",
		note: "A framed product view and an editorial headline.",
		style: {
			template: "editorial",
			background: "#F1E2D6",
			backgroundEnd: "#DFBDA7",
			backgroundMode: "solid",
			textColor: "#3C2926",
			accentColor: "#975239",
			texture: "none",
			accentTitle: true,
			align: "left",
			titleSize: 102
		},
		phone: {
			x: 253,
			y: 114,
			width: 574,
			rotation: 0
		},
		title: {
			x: 84,
			y: 1446,
			width: 912,
			height: 246
		},
		subtitle: {
			x: 88,
			y: 1740,
			width: 904,
			height: 100
		},
		lineHeight: 1.05
	},
	{
		id: "studio",
		name: "Studio",
		keywords: [
			"clean",
			"simple",
			"cream",
			"border",
			"light"
		],
		surfaceLabel: "Stage",
		category: "Minimal",
		description: "Quiet space. A product worth looking at.",
		note: "A fine border and generous margins let your interface speak.",
		style: {
			template: "studio",
			background: "#F5F3EC",
			backgroundEnd: "#E6E9DF",
			backgroundMode: "solid",
			textColor: "#27382E",
			accentColor: "#687D64",
			texture: "none",
			accentTitle: false,
			align: "left",
			titleSize: 78
		},
		phone: {
			x: 250,
			y: 500,
			width: 580,
			rotation: 0
		},
		title: {
			x: 92,
			y: 126,
			width: 896,
			height: 226
		},
		subtitle: {
			x: 92,
			y: 375,
			width: 896,
			height: 80
		},
		lineHeight: 1.12
	},
	{
		id: "split",
		name: "Split",
		keywords: [
			"color block",
			"yellow",
			"terracotta",
			"warm"
		],
		surfaceLabel: "Color block",
		category: "Bold",
		description: "Two tones. One confident statement.",
		note: "A crisp color block puts a bold headline beside your product.",
		style: {
			template: "split",
			background: "#F3D879",
			backgroundEnd: "#B94E37",
			backgroundMode: "solid",
			textColor: "#342A22",
			accentColor: "#79422B",
			texture: "none",
			accentTitle: false,
			align: "left",
			titleSize: 118
		},
		phone: {
			x: 245,
			y: 660,
			width: 590,
			rotation: 0
		},
		title: {
			x: 80,
			y: 100,
			width: 920,
			height: 340
		},
		subtitle: {
			x: 84,
			y: 466,
			width: 900,
			height: 88
		},
		lineHeight: 1.02
	},
	{
		id: "halo",
		name: "Halo",
		keywords: [
			"circle",
			"dark",
			"orange",
			"stage"
		],
		surfaceLabel: "Halo",
		category: "Bold",
		description: "A circular stage. A moment in the spotlight.",
		note: "A warm halo frames your device against a deep ink background.",
		style: {
			template: "halo",
			background: "#202E35",
			backgroundEnd: "#B9684F",
			backgroundMode: "solid",
			textColor: "#F5EADD",
			accentColor: "#F4C99B",
			texture: "none",
			accentTitle: true,
			align: "center",
			titleSize: 104
		},
		phone: {
			x: 240,
			y: 620,
			width: 600,
			rotation: 0
		},
		title: {
			x: 84,
			y: 120,
			width: 912,
			height: 290
		},
		subtitle: {
			x: 90,
			y: 460,
			width: 900,
			height: 90
		},
		lineHeight: 1.06
	},
	{
		id: "gallery",
		name: "Gallery",
		keywords: [
			"minimal",
			"caption",
			"paper",
			"light"
		],
		surfaceLabel: "Mat",
		category: "Editorial",
		description: "The work comes first. The story follows.",
		note: "An image-led composition with a caption beneath, made for a closer look.",
		style: {
			template: "gallery",
			background: "#E9E4DA",
			backgroundEnd: "#D5D9D0",
			backgroundMode: "solid",
			textColor: "#333C35",
			accentColor: "#8E4D35",
			texture: "none",
			accentTitle: false,
			align: "left",
			titleSize: 82
		},
		phone: {
			x: 250,
			y: 120,
			width: 580,
			rotation: 0
		},
		title: {
			x: 84,
			y: 1500,
			width: 912,
			height: 220
		},
		subtitle: {
			x: 88,
			y: 1750,
			width: 904,
			height: 90
		},
		lineHeight: 1.1
	},
	{
		id: "panorama",
		name: "Panorama",
		keywords: [
			"ribbon",
			"warm",
			"cream",
			"diagonal"
		],
		category: "Editorial",
		surfaceLabel: "Ribbon",
		description: "One scene. A story across two slides.",
		note: "A continuous backdrop and one shared device, split into two consecutive slides.",
		style: panoramaStyle,
		phone: {
			x: 700,
			y: 150,
			width: 760,
			rotation: -8
		},
		title: {
			x: 70,
			y: 160,
			width: 450,
			height: 450
		},
		subtitle: {
			x: 74,
			y: 670,
			width: 446,
			height: 160
		},
		lineHeight: 1.07
	}
];
function getTemplate(id) {
	const template = [...templates, ...bannerTemplates].find((item) => item.id === (panoramaStart(id) ?? id));
	if (!template) throw new Error("This template is not supported.");
	return template;
}
/** Existing portrait phone compositions retain their original coordinates. */
function templateLayout(project, style) {
	const template = getTemplate(style.template);
	const canvas = canonicalCanvas(project);
	if (isBannerTemplate(style.template)) return {
		...template,
		...bannerLayout(project, style)
	};
	if (compositionId(style.template)) return {
		...template,
		...compositionLayout(project, style)
	};
	if (isPanoramaTemplate(style.template)) return {
		...template,
		...panoramaLayout(project, style)
	};
	if (!legacyTemplateIds.some((id) => id === style.template)) return collectionLayout(project, style, template);
	if (canvas.height === 1920 && (style.device === "android" || style.device === "ios") && style.deviceOrientation === "portrait") return {
		...template,
		fontScale: 1,
		subtitleSize: 34,
		panel: {
			x: 48,
			y: 52,
			width: 984,
			height: 1332
		}
	};
	const h = canvas.height;
	const wide = h <= 1080;
	const editorial = style.template === "editorial";
	const spotlight = style.template === "spotlight";
	let title, subtitle, area;
	if (wide && (!spotlight || (style.device === "ios" || style.device === "android") && style.deviceOrientation === "portrait")) {
		const textX = editorial ? 700 : 60;
		title = {
			x: textX,
			y: h * .21,
			width: 320,
			height: h * .4
		};
		subtitle = {
			x: textX,
			y: h * .67,
			width: 320,
			height: h * .19
		};
		area = {
			x: editorial ? 48 : 430,
			y: h * .1,
			width: 602,
			height: h * .8
		};
	} else if (wide) {
		title = {
			x: 90,
			y: h * .065,
			width: 900,
			height: h * .2
		};
		subtitle = {
			x: 150,
			y: h * .28,
			width: 780,
			height: h * .08
		};
		area = {
			x: 100,
			y: h * .4,
			width: 880,
			height: h * .55
		};
	} else {
		title = {
			x: 84,
			y: editorial ? h * .76 : h * .055,
			width: 912,
			height: h * .16
		};
		subtitle = {
			x: 88,
			y: editorial ? h * .93 : h * .235,
			width: 904,
			height: h * .06
		};
		area = {
			x: 80,
			y: editorial ? h * .05 : h * .335,
			width: 920,
			height: h * (editorial ? .65 : .61)
		};
	}
	const rotation = style.template === "tilt" ? -6 : 0;
	const unit = deviceGeometry(style.device, 1e3, style.frame, style.deviceOrientation);
	const radians = Math.abs(rotation) * Math.PI / 180;
	const boundW = Math.cos(radians) * unit.width + Math.sin(radians) * unit.height;
	const boundH = Math.sin(radians) * unit.width + Math.cos(radians) * unit.height;
	const scale = Math.min(area.width / boundW, area.height / boundH);
	const width = Math.round(unit.width * scale);
	const height = deviceGeometry(style.device, width, style.frame, style.deviceOrientation).height;
	const phone = {
		width,
		x: Math.round(area.x + (area.width - width) / 2),
		y: Math.round(area.y + (area.height - height) / 2),
		rotation
	};
	return {
		...template,
		title,
		subtitle,
		phone,
		fontScale: wide ? .6 : .92,
		subtitleSize: wide ? 23 : 30,
		panel: {
			x: area.x - 16,
			y: area.y - 20,
			width: area.width + 32,
			height: area.height + 40
		}
	};
}
/** New catalog entries use their own geometry, leaving the original four untouched. */
function collectionLayout(project, style, template) {
	const { height: h } = canonicalCanvas(project);
	const wide = h <= 1080;
	let title, subtitle, area;
	const patterned = patternAreas(template.composition, h);
	if (patterned) ({title, subtitle, area} = patterned);
	else if (template.composition) ({title, subtitle, area} = showcaseAreas(template.composition, h));
	else if ((style.template === "bloom" || style.template === "punch") && !wide) {
		title = {
			x: 80,
			y: h * .06,
			width: 920,
			height: h * .155
		};
		subtitle = {
			x: 84,
			y: h * .24,
			width: 912,
			height: h * .06
		};
		area = {
			x: 70,
			y: h * .34,
			width: 940,
			height: h * .62
		};
	} else if (style.template === "gallery") {
		area = {
			x: 76,
			y: h * .065,
			width: 928,
			height: h * .63
		};
		title = {
			x: 80,
			y: h * .765,
			width: wide ? 526 : 920,
			height: h * (wide ? .18 : .12)
		};
		subtitle = {
			x: wide ? 650 : 84,
			y: h * (wide ? .78 : .905),
			width: wide ? 350 : 912,
			height: h * (wide ? .15 : .06)
		};
	} else if (wide) {
		const reverse = style.template === "halo";
		title = {
			x: reverse ? 690 : 72,
			y: h * .18,
			width: 320,
			height: h * .4
		};
		subtitle = {
			x: title.x,
			y: h * .67,
			width: 320,
			height: h * .19
		};
		area = {
			x: reverse ? 64 : 444,
			y: h * .1,
			width: 570,
			height: h * .8
		};
	} else {
		title = {
			x: 84,
			y: h * .07,
			width: 912,
			height: h * .16
		};
		subtitle = {
			x: 88,
			y: h * .25,
			width: 904,
			height: h * .065
		};
		area = {
			x: 100,
			y: h * .355,
			width: 880,
			height: h * .575
		};
	}
	const panel = { ...area };
	if (template.deviceInset) {
		const inset = template.deviceInset;
		area = {
			x: area.x + area.width * inset,
			y: area.y + area.height * inset,
			width: area.width * (1 - inset * 2),
			height: area.height * (1 - inset * 2)
		};
	}
	const unit = deviceGeometry(style.device, 1e3, style.frame, style.deviceOrientation);
	const rotation = template.composition ? template.phone.rotation : style.template === "punch" ? -6 : 0;
	const radians = Math.abs(rotation) * Math.PI / 180;
	const boundW = Math.cos(radians) * unit.width + Math.sin(radians) * unit.height;
	const boundH = Math.sin(radians) * unit.width + Math.cos(radians) * unit.height;
	const width = Math.floor(rotation === 0 ? Math.min(area.width, area.height / unit.height * 1e3) : 1e3 * Math.min(area.width / boundW, area.height / boundH));
	const height = deviceGeometry(style.device, width, style.frame, style.deviceOrientation).height;
	return {
		...template,
		title,
		subtitle,
		phone: {
			x: Math.round(area.x + (area.width - width) / 2),
			y: Math.round(area.y + (area.height - height) / 2),
			width,
			rotation
		},
		fontScale: wide ? .62 : .96,
		subtitleSize: wide ? 23 : 32,
		panel
	};
}
function resetComposition(project, shot) {
	const id = resolveStyle(project, shot).template;
	if (compositionId(id)) {
		if (!shot.companions) configureDevices(project, shot, id);
		const layout = compositionLayout(project, resolveStyle(project, shot), shot.companions);
		shot.phone = { ...layout.phone };
		shot.companions?.forEach((device, index) => {
			device.phone = { ...layout.devices[index + 1] };
		});
	} else shot.phone = { ...templateLayout(project, resolveStyle(project, shot)).phone };
}
var colorKeys = [
	"background",
	"backgroundEnd",
	"textColor",
	"accentColor"
];
function templateStyle(id, keepColors = false) {
	const patch = { ...getTemplate(id).style };
	if (keepColors) for (const key of colorKeys) delete patch[key];
	return patch;
}
/** One store edit wraps a complete application, including every phone position. */
function applyTemplate(project, shotId, id, all = false, keepColors = false) {
	if (!project.shots.some((shot) => shot.id === shotId)) return;
	const family = panoramaStart(id);
	if (family) {
		if (all) throw new Error("Apply Panorama to one screenshot at a time.");
		applyPanorama(project, shotId, keepColors, family);
		return;
	}
	const targets = new Set(linkedShots(project, shotId).map((shot) => shot.id));
	const patch = templateStyle(id, keepColors);
	if (all) Object.assign(project.style, patch);
	for (const shot of project.shots) {
		if (!all && !targets.has(shot.id)) continue;
		configureDevices(project, shot, id);
		if (all) for (const key of Object.keys(patch)) delete shot.style[key];
		else Object.assign(shot.style, patch);
		resetComposition(project, shot);
		refitText(shot, true);
	}
}
//#endregion
//#region src/assets/image-header.ts
/** EXIF orientations 5–8 swap the displayed axes. Ignore invalid optional metadata. */
function jpegOrientation(bytes) {
	try {
		if (String.fromCharCode(...bytes.subarray(0, 6)) !== "Exif\0\0") return 1;
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const little = view.getUint16(6) === 18761;
		if (view.getUint16(8, little) !== 42) return 1;
		const offset = 6 + view.getUint32(10, little), count = view.getUint16(offset, little);
		for (let i = 0; i < count; i++) {
			const at = offset + 2 + i * 12;
			if (view.getUint16(at, little) === 274 && view.getUint16(at + 2, little) === 3 && view.getUint32(at + 4, little) === 1) {
				const value = view.getUint16(at + 8, little);
				return value >= 1 && value <= 8 ? value : 1;
			}
		}
	} catch {}
	return 1;
}
function imageHeader(bytes) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const text = (start, end) => String.fromCharCode(...bytes.subarray(start, end));
	if (bytes.length >= 24 && bytes[0] === 137 && text(1, 8) === "PNG\r\n\n" && text(12, 16) === "IHDR") {
		for (let at = 8; at + 12 <= bytes.length;) {
			const length = view.getUint32(at);
			const chunk = text(at + 4, at + 8);
			if (chunk === "acTL") throw new Error("Animated PNG is not supported. Export a still PNG, JPEG, or WebP.");
			if (chunk === "IDAT") break;
			at += length + 12;
		}
		return {
			mime: "image/png",
			width: view.getUint32(16),
			height: view.getUint32(20)
		};
	}
	if (bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
		let position = 2;
		let orientation = 1;
		while (position + 3 < bytes.length) {
			if (bytes[position++] !== 255) break;
			while (bytes[position] === 255) position++;
			const marker = bytes[position++];
			if (marker === 217 || marker === 218 || position + 2 > bytes.length) break;
			if (marker === 1 || marker >= 208 && marker <= 215) continue;
			const length = view.getUint16(position);
			if (length < 2 || position + length > bytes.length) break;
			if (marker === 225 && text(position + 2, position + 8) === "Exif\0\0") orientation = jpegOrientation(bytes.subarray(position + 2, position + length));
			if (marker >= 192 && marker <= 207 && ![
				196,
				200,
				204
			].includes(marker) && length >= 8) return {
				mime: "image/jpeg",
				width: view.getUint16(position + (orientation >= 5 ? 3 : 5)),
				height: view.getUint16(position + (orientation >= 5 ? 5 : 3))
			};
			position += length;
		}
	}
	if (bytes.length >= 25 && text(0, 4) === "RIFF" && text(8, 12) === "WEBP") {
		const kind = text(12, 16);
		const uint24 = (at) => bytes[at] | bytes[at + 1] << 8 | bytes[at + 2] << 16;
		if (kind === "VP8X" && bytes.length >= 30) {
			if (bytes[20] & 2) throw new Error("Animated WebP is not supported. Choose a still screenshot.");
			return {
				mime: "image/webp",
				width: uint24(24) + 1,
				height: uint24(27) + 1
			};
		}
		if (kind === "VP8L" && bytes[20] === 47) return {
			mime: "image/webp",
			width: 1 + (bytes[21] | (bytes[22] & 63) << 8),
			height: 1 + (bytes[22] >> 6 | bytes[23] << 2 | (bytes[24] & 15) << 10)
		};
		if (kind === "VP8 " && bytes.length >= 30 && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) return {
			mime: "image/webp",
			width: view.getUint16(26, true) & 16383,
			height: view.getUint16(28, true) & 16383
		};
	}
	if (text(4, 8) === "ftyp") {
		const brands = text(8, Math.min(bytes.length, 64));
		if (/avif|avis/.test(brands)) throw new Error("AVIF is not supported. Export this image as JPEG, PNG, or still WebP.");
		if (/heic|heix|hevc|hevx|mif1/.test(brands)) throw new Error("This is a HEIC/HEIF image. Export it as JPEG or PNG; renaming the file is not enough.");
	}
	if (text(0, 3) === "GIF") throw new Error("GIF is not supported. Export a still PNG, JPEG, or WebP.");
	throw new Error("Choose a valid PNG, JPEG, or still WebP image. The file signature or image metadata is missing or invalid.");
}
/** Read common headers cheaply; bounded JPEG metadata may put SOF beyond the prefix. */
async function readImageHeader(file) {
	const prefix = new Uint8Array(await file.slice(0, 1048576).arrayBuffer());
	try {
		const header = imageHeader(prefix);
		if (header.mime === "image/png") {
			let window = prefix, start = 0;
			for (let at = 8; at + 8 <= file.size;) {
				if (at + 8 > start + window.length) {
					start = at;
					window = new Uint8Array(await file.slice(at, at + 1048576).arrayBuffer());
				}
				const local = at - start;
				const length = new DataView(window.buffer, window.byteOffset + local, 4).getUint32(0);
				const chunk = String.fromCharCode(...window.subarray(local + 4, local + 8));
				if (chunk === "acTL") throw new Error("Animated PNG is not supported. Export a still PNG, JPEG, or WebP.");
				if (chunk === "IDAT" || chunk === "IEND") break;
				at += length + 12;
			}
		}
		return header;
	} catch (error) {
		if (prefix[0] === 255 && prefix[1] === 216 && prefix[2] === 255 && file.size > prefix.length && file.size <= 83886080) return imageHeader(new Uint8Array(await file.arrayBuffer()));
		throw error;
	}
}
//#endregion
//#region src/assets/import.ts
function checkPixels(width, height) {
	if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > LIMITS.imagePixels) throw new Error("Each image must be no larger than 24 megapixels.");
}
/** Decode an image and release its temporary URL even when decoding fails. */
function loadImage(asset) {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(asset.blob.slice(0, asset.blob.size, asset.mime));
		const image = new Image();
		image.decoding = "async";
		const timer = setTimeout(() => {
			finish();
			image.src = "";
			reject(/* @__PURE__ */ new Error(`Reading “${asset.name}” took too long. Try a smaller copy or save it again as JPEG or PNG.`));
		}, 25e3);
		const finish = () => {
			clearTimeout(timer);
			image.onload = null;
			image.onerror = null;
			URL.revokeObjectURL(url);
		};
		image.onload = () => {
			finish();
			try {
				checkPixels(image.naturalWidth, image.naturalHeight);
				resolve(image);
			} catch (error) {
				reject(error);
			}
		};
		image.onerror = () => {
			finish();
			reject(/* @__PURE__ */ new Error(`Could not decode “${asset.name}”. The file may be damaged or use an encoding this browser cannot read. Try an optimized copy, save it again as JPEG or PNG, or open the editor in your browser.`));
		};
		image.src = url;
	});
}
/** Validate the whole batch before returning any assets; the caller owns persistence. */
async function importImages(files) {
	if (files.length > LIMITS.shots) throw new Error("Choose up to 20 images at a time.");
	for (const file of files) {
		if (!file.size) throw new Error(`“${file.name}” is empty (0 bytes). Choose the original image or download it again.`);
		if (file.size > LIMITS.assetBytes) throw new Error(`“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 50 MB per image. Compress a copy or choose a smaller image.`);
	}
	if (files.reduce((total, file) => total + file.size, 0) > LIMITS.totalBytes) throw new Error("The selected images exceed 120 MB.");
	const assets = [];
	for (const file of files) {
		const header = await readImageHeader(file);
		checkPixels(header.width, header.height);
		const asset = {
			id: crypto.randomUUID(),
			name: file.name.slice(0, 255),
			...header,
			blob: file
		};
		const image = await loadImage(asset);
		assets.push({
			...asset,
			width: image.naturalWidth,
			height: image.naturalHeight
		});
	}
	return assets;
}
//#endregion
//#region src/storage/backup.ts
var MANIFEST_LIMIT = 3145728;
var ARCHIVE_LIMIT = LIMITS.totalBytes + MANIFEST_LIMIT + 1048576;
var extensions = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp"
};
function fail(message = "This project backup is invalid or unsupported.") {
	throw new Error(message);
}
function record(value, keys, required = keys) {
	if (!value || typeof value !== "object" || Array.isArray(value)) fail();
	const result = value;
	if (Object.keys(result).some((key) => !keys.includes(key)) || required.some((key) => !Object.hasOwn(result, key))) fail();
	return result;
}
function string$1(value, maximum, minimum = 0) {
	if (typeof value !== "string" || value.length < minimum || value.length > maximum || value.includes("\0")) fail();
	return value;
}
function id(value) {
	const result = string$1(value, 100, 1);
	if (!/^[a-zA-Z0-9_-]+$/.test(result)) fail();
	return result;
}
function number(value, minimum, maximum, integer = false) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum || integer && !Number.isSafeInteger(value)) fail();
	return value;
}
function manifest(value, format) {
	const raw = record(value, [
		"format",
		"schemaVersion",
		"project",
		"assets"
	]);
	if (raw.format !== format) fail(format === "hen-screenshots-template" ? "This file is not a reusable template. Export it from My templates." : "This is not a project backup. Open template files from My templates.");
	if (raw.schemaVersion !== 1 && raw.schemaVersion !== 2 && raw.schemaVersion !== 3 && raw.schemaVersion !== 4 && raw.schemaVersion !== 5 && raw.schemaVersion !== 6 && raw.schemaVersion !== 7 && raw.schemaVersion !== 8 && raw.schemaVersion !== 9 && raw.schemaVersion !== 10 && raw.schemaVersion !== 11) fail("This backup uses an unsupported project version.");
	validateProject(raw.project);
	if (raw.project.schemaVersion !== raw.schemaVersion) fail("The backup and project versions do not match.");
	const document = migrateProject(raw.project);
	if (!Array.isArray(raw.assets) || raw.assets.length > LIMITS.shots * (30 + LIMITS.overlays + 1)) fail();
	const assets = raw.assets.map((value) => {
		const entry = record(value, [
			"id",
			"name",
			"mime",
			"width",
			"height",
			"size",
			"path"
		]);
		const assetId = id(entry.id);
		if (typeof entry.mime !== "string" || !Object.hasOwn(extensions, entry.mime)) fail();
		const mime = entry.mime;
		const width = number(entry.width, 1, LIMITS.imagePixels, true);
		const height = number(entry.height, 1, LIMITS.imagePixels, true);
		if (width * height > LIMITS.imagePixels) fail("An image exceeds 24 megapixels.");
		const path = string$1(entry.path, 130, 1);
		if (path !== `assets/${assetId}.${extensions[mime]}`) fail();
		return {
			id: assetId,
			name: string$1(entry.name, 255, 1),
			mime,
			width,
			height,
			path,
			size: number(entry.size, 1, LIMITS.assetBytes, true)
		};
	});
	if (new Set(assets.map((asset) => asset.id)).size !== assets.length || assets.reduce((sum, asset) => sum + asset.size, 0) > LIMITS.totalBytes) fail();
	const references = new Set(referencedAssetIds(document));
	if (assets.length !== references.size || assets.some((asset) => !references.has(asset.id))) fail("The backup is missing screenshot images or contains unused images.");
	return {
		format,
		schemaVersion: 11,
		project: document,
		assets
	};
}
/** Original image bytes are stored without additional ZIP compression. */
async function exportProject(document, sourceAssets, format = "hen-screenshots") {
	const assetsById = new Map(sourceAssets.map((asset) => [asset.id, asset]));
	const referenced = [...new Set(referencedAssetIds(document))].map((assetId) => {
		const asset = assetsById.get(assetId);
		if (!asset) fail("A screenshot image is missing. Re-import it before exporting.");
		return asset;
	});
	const metadata = manifest({
		format,
		schemaVersion: 11,
		project: document,
		assets: referenced.map((asset) => ({
			id: asset.id,
			name: asset.name,
			mime: asset.mime,
			width: asset.width,
			height: asset.height,
			size: asset.blob.size,
			path: `assets/${asset.id}.${extensions[asset.mime]}`
		}))
	}, format);
	const encoded = strToU8(JSON.stringify(metadata));
	if (encoded.byteLength > MANIFEST_LIMIT) fail("The project document is too large to export.");
	const files = { "project.json": encoded };
	for (let index = 0; index < referenced.length; index++) files[metadata.assets[index].path] = new Uint8Array(await referenced[index].blob.arrayBuffer());
	return new Blob([new Uint8Array(zipSync(files, { level: 0 }))], { type: "application/zip" });
}
/** Read a bounded app backup, validate its real images, and return a new unsaved project. */
async function importProject(file, decodeImages = importImages, format = "hen-screenshots") {
	if (file.size < 22 || file.size > ARCHIVE_LIMIT) fail("Choose a valid project backup no larger than 124 MB.");
	const bytes = new Uint8Array(await file.arrayBuffer());
	const entries = /* @__PURE__ */ new Map();
	let total = 0;
	try {
		unzipSync(bytes, { filter: (entry) => {
			if (entries.size >= LIMITS.shots * (30 + LIMITS.overlays + 1) + 1 || entries.has(entry.name)) fail("The backup contains too many files or duplicate filenames.");
			if (entry.name !== "project.json" && !/^assets\/[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(entry.name)) fail("The backup contains an unsupported file path.");
			if (entry.compression !== 0 || entry.size !== entry.originalSize) fail("This backup uses unsupported compression. Use an original Hen Screenshots backup.");
			const maximum = entry.name === "project.json" ? MANIFEST_LIMIT : LIMITS.assetBytes;
			if (entry.originalSize < 1 || entry.originalSize > maximum) fail("A file in the backup exceeds its size limit.");
			total += entry.originalSize;
			if (total > LIMITS.totalBytes + MANIFEST_LIMIT) fail("The backup exceeds the image size limit.");
			entries.set(entry.name, entry);
			return false;
		} });
	} catch (error) {
		if (error instanceof Error) throw error;
		fail();
	}
	if (!entries.has("project.json")) fail("The backup is missing project.json.");
	const extracted = unzipSync(bytes);
	for (const [name, entry] of entries) if (extracted[name]?.byteLength !== entry.originalSize) fail("The backup is truncated.");
	let metadata;
	try {
		metadata = manifest(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(extracted["project.json"])), format);
	} catch (error) {
		if (error instanceof SyntaxError || error instanceof TypeError) fail("The backup document is invalid.");
		throw error;
	}
	if (entries.size !== metadata.assets.length + 1) fail("The backup contains unexpected files.");
	const imported = [];
	for (let start = 0; start < metadata.assets.length; start += LIMITS.shots) {
		const files = metadata.assets.slice(start, start + LIMITS.shots).map((asset) => {
			const data = extracted[asset.path];
			if (!data || data.byteLength !== asset.size) fail("A screenshot image is missing or truncated.");
			return new File([new Uint8Array(data)], asset.name, { type: asset.mime });
		});
		imported.push(...await decodeImages(files));
	}
	const ids = /* @__PURE__ */ new Map();
	imported.forEach((asset, index) => {
		const original = metadata.assets[index];
		if (asset.mime !== original.mime || asset.width !== original.width || asset.height !== original.height) fail("Image contents do not match the project metadata.");
		ids.set(original.id, asset.id);
	});
	const now = Date.now();
	return {
		revision: 0,
		assets: imported,
		project: {
			...metadata.project,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now,
			shots: metadata.project.shots.map((shot) => ({
				...shot,
				id: crypto.randomUUID(),
				assetId: shot.assetId === null ? null : ids.get(shot.assetId),
				...shot.backgroundImage ? { backgroundImage: {
					...shot.backgroundImage,
					assetId: ids.get(shot.backgroundImage.assetId)
				} } : {},
				...shot.overlays ? { overlays: shot.overlays.map((item) => ({
					...item,
					id: crypto.randomUUID(),
					assetId: ids.get(item.assetId)
				})) } : {},
				...shot.companions ? { companions: shot.companions.map((device) => ({
					...device,
					assetId: device.assetId === null ? null : ids.get(device.assetId)
				})) } : {},
				...shot.translations ? { translations: Object.fromEntries(Object.entries(shot.translations).map(([locale, content]) => [locale, {
					...content,
					...content.deviceAssets ? { deviceAssets: Object.fromEntries(Object.entries(content.deviceAssets).map(([id, asset]) => [id, ids.get(asset)])) } : {},
					...content.assetId ? { assetId: ids.get(content.assetId) } : {}
				}])) } : {}
			}))
		}
	};
}
//#endregion
//#region src/storage/brand-backup.ts
/** Import as a new library entry so a file cannot silently replace an existing brand. */
async function importBrandKit(file) {
	if (!file.size || file.size > 131072) throw new Error("Choose a .henbrand file no larger than 128 KB.");
	let raw;
	try {
		raw = JSON.parse(await file.text());
	} catch {
		throw new Error("This brand kit file is not valid JSON.");
	}
	if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).length !== 2 || !("format" in raw) || raw.format !== "hen-brand-kit" || !("kit" in raw)) throw new Error("Choose a valid Hen Screenshots brand kit file.");
	validateBrandKit(raw.kit);
	const now = Date.now();
	return {
		...raw.kit,
		id: crypto.randomUUID(),
		revision: 1,
		createdAt: now,
		updatedAt: now
	};
}
//#endregion
//#region src/core/brand-application.ts
function brandStyle(kit) {
	return {
		background: kit.colors.background,
		textColor: kit.colors.text,
		accentColor: kit.colors.accent,
		backgroundEnd: kit.colors.secondary,
		titleFont: kit.fonts.title,
		bodyFont: kit.fonts.body
	};
}
/** Apply only visual identity. Geometry, words, templates and export settings remain authored. */
function applyBrandKit(project, kit, shotId, all = false) {
	validateBrandKit(kit);
	if (!all && !project.shots.some((shot) => shot.id === shotId)) return;
	const key = brandSnapshotKey(kit);
	project.brands ??= {};
	project.brands[key] = structuredClone(kit);
	const patch = brandStyle(kit);
	if (all) {
		Object.assign(project.style, patch);
		project.brand = key;
	}
	const targets = all ? project.shots : linkedShots(project, shotId);
	for (const shot of targets) {
		Object.assign(shot.style, patch);
		shot.brand = key;
	}
	const used = /* @__PURE__ */ new Set([project.brand, ...project.shots.map((shot) => shot.brand)]);
	for (const existing of Object.keys(project.brands)) if (!used.has(existing)) delete project.brands[existing];
}
//#endregion
//#region src/agent/spec.ts
function object(value, keys, at) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${at} must be an object.`);
	for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`Unknown field ${at}.${key}. Check the plugin's design-spec reference.`);
	return value;
}
function string(value, max, at, allowEmpty = false) {
	if (typeof value !== "string" || !allowEmpty && !value.trim() || value.length > max || value.includes("\0")) throw new Error(`${at} must be ${allowEmpty ? "0" : "1"}–${max} characters.`);
}
function choices(raw, at) {
	if (raw.template !== void 0 && ![...templates, ...bannerTemplates].some((t) => t.id === raw.template)) throw new Error(`Unknown template at ${at}.template. Run hen templates.`);
	if (raw.device !== void 0 && ![
		"android",
		"ios",
		"ipad",
		"android-tablet",
		"monitor",
		"laptop",
		"card"
	].includes(raw.device)) throw new Error(`Unknown device at ${at}.device.`);
}
function captions(raw, at) {
	string(raw.title, 100, `${at}.title`, true);
	if (raw.subtitle !== void 0) string(raw.subtitle, 180, `${at}.subtitle`, true);
	if (raw.translations !== void 0) {
		if (!raw.translations || typeof raw.translations !== "object" || Array.isArray(raw.translations)) throw new Error(`${at}.translations must map language codes to captions.`);
		for (const [language, value] of Object.entries(raw.translations)) {
			if (!isLanguage(language)) throw new Error(`Unsupported language: ${language}. Run hen languages.`);
			captions(object(value, ["title", "subtitle"], `${at}.translations.${language}`), `${at}.translations.${language}`);
		}
	}
}
/** A small authoring contract, separate from the versioned full project document. */
function parseDesignSpec(value) {
	const raw = object(value, [
		"version",
		"name",
		"profile",
		"template",
		"device",
		"sourceLanguage",
		"customSize",
		"brandKit",
		"slides"
	], "design");
	if (raw.version !== 1) throw new Error("Use design spec version 1.");
	string(raw.name, 80, "name");
	choices(raw, "design");
	if (raw.customSize !== void 0) {
		object(raw.customSize, ["width", "height"], "customSize");
		validateCustomSize(raw.customSize);
		if (raw.profile !== "portfolio-custom") throw new Error("customSize requires the portfolio-custom profile.");
	}
	if (!exportProfiles.some((p) => p.id === raw.profile)) throw new Error("Unknown export profile. Run hen profiles for supported IDs.");
	if (raw.sourceLanguage !== void 0 && !isLanguage(raw.sourceLanguage)) throw new Error("Unsupported sourceLanguage. Run hen languages.");
	if (raw.brandKit !== void 0) string(raw.brandKit, 4096, "brandKit");
	if (!Array.isArray(raw.slides) || !raw.slides.length || raw.slides.length > LIMITS.shots) throw new Error("Provide 1–20 slides.");
	raw.slides.forEach((value, index) => {
		const at = `slides[${index}]`;
		const slide = object(value, [
			"image",
			"title",
			"subtitle",
			"template",
			"device",
			"companions",
			"placement",
			"textOffsets",
			"style",
			"translations",
			"continuation"
		], at);
		string(slide.image, 4096, `${at}.image`);
		choices(slide, at);
		if (slide.placement !== void 0) object(slide.placement, [
			"x",
			"y",
			"width",
			"rotation"
		], `${at}.placement`);
		if (slide.textOffsets !== void 0) object(slide.textOffsets, ["title", "subtitle"], `${at}.textOffsets`);
		captions(slide, at);
		if (slide.companions !== void 0) {
			if (!Array.isArray(slide.companions) || slide.companions.length > 2) throw new Error(`${at}.companions accepts up to two image paths.`);
			slide.companions.forEach((path) => string(path, 4096, `${at}.companions`));
		}
		if (slide.continuation !== void 0) captions(object(slide.continuation, [
			"title",
			"subtitle",
			"translations"
		], `${at}.continuation`), `${at}.continuation`);
		if (slide.style !== void 0) object(slide.style, [
			"background",
			"backgroundEnd",
			"backgroundMode",
			"textColor",
			"accentColor",
			"titleFont",
			"bodyFont",
			"titleSize",
			"align",
			"texture",
			"accentTitle",
			"fit",
			"frame",
			"camera",
			"deviceOrientation"
		], `${at}.style`);
	});
	return raw;
}
function specImagePaths(spec) {
	return [...new Set(spec.slides.flatMap((s) => [s.image, ...s.companions ?? []]))];
}
function buildDesign(spec, assets, brand) {
	const project = createProject(spec.name);
	project.exportProfile = spec.profile;
	if (spec.customSize) project.customSize = { ...spec.customSize };
	const profile = resolveExportProfile(project);
	if (profile.sourceOnly) throw new Error("Source-only Wear OS exports are not supported by the plugin. Use the web studio.");
	if (spec.customSize) {
		validateCustomSize(spec.customSize);
		project.customSize = { ...spec.customSize };
	}
	const words = [];
	const asset = (path) => {
		const found = assets.get(path);
		if (!found) throw new Error(`Missing image: ${path}`);
		return found;
	};
	for (const slide of spec.slides) {
		const id = slide.template ?? spec.template ?? (isBannerProfile(spec.profile) ? "banner-signal" : "studio");
		if (![...templates, ...bannerTemplates].some((t) => t.id === id)) throw new Error(`Unknown template: ${id}. Run hen templates.`);
		const template = getTemplate(id);
		if (isBannerProfile(spec.profile) !== template.id.startsWith("banner-")) throw new Error("Banner profiles need a banner template; screenshot profiles need a screenshot template.");
		const shot = createShot(asset(slide.image).id, project.shots.length);
		shot.style.device = slide.device ?? spec.device ?? (profile.category === "tablet" ? profile.store === "apple" ? "ipad" : "android-tablet" : profile.category === "desktop" ? "monitor" : profile.store === "apple" ? "ios" : "android");
		project.shots.push(shot);
		applyTemplate(project, shot.id, template.id);
		const targets = panoramaPair(project, shot.id) ?? [project.shots.find((s) => s.id === shot.id)];
		if (isPanoramaTemplate(template.id) !== Boolean(slide.continuation)) throw new Error("A panorama needs continuation captions for its second slide. Use continuation only with panorama templates.");
		const companions = targets[0].companions ?? [];
		if (companions.length !== (slide.companions?.length ?? 0)) throw new Error(`Template ${id} needs ${companions.length} companion image(s).`);
		companions.forEach((device, i) => {
			device.assetId = asset(slide.companions[i]).id;
		});
		targets.forEach((target, index) => {
			const text = index ? slide.continuation : slide;
			target.title = text.title;
			target.subtitle = text.subtitle ?? "";
			Object.assign(target.style, slide.style);
			resetComposition(project, target);
			if (slide.placement) target.phone = { ...slide.placement };
			if (slide.textOffsets) target.textOffsets = structuredClone(slide.textOffsets);
			words.push([target, text]);
		});
	}
	if (brand) applyBrandKit(project, brand, void 0, true);
	const source = spec.sourceLanguage ?? "en";
	const targets = [...new Set(words.flatMap(([, text]) => Object.keys(text.translations ?? {})))];
	for (const language of targets) {
		addLanguage(project, source, language);
		for (const [shot, text] of words) {
			const translated = text.translations?.[language];
			if (!translated) throw new Error(`Provide ${language} captions for every slide, including panorama continuations.`);
			writeText(shot, language, "title", translated.title);
			writeText(shot, language, "subtitle", translated.subtitle ?? "");
		}
	}
	if (!project.localization) project.localization = {
		source,
		targets: []
	};
	if (project.shots.length > profile.maxCount) throw new Error(`This profile allows ${profile.maxCount} slides per language; the design contains ${project.shots.length}.`);
	validateProject(project);
	return project;
}
//#endregion
//#region src/agent/files.ts
function localPath(path, directory) {
	if (/^[a-z][a-z\d+.-]*:/i.test(path) && !/^[a-z]:[\\/]/i.test(path)) throw new Error("Use local image files, not URLs or data URIs.");
	return resolve(directory, path);
}
/** Bound reads on the opened descriptor, including files changed during a read. */
async function readLocalFile(path, limit) {
	const handle = await open(path, "r");
	try {
		const info = await handle.stat();
		if (!info.isFile() || !info.size) throw new Error(`“${basename(path)}” is not a non-empty file.`);
		if (info.size > limit) throw new Error(`“${basename(path)}” exceeds the ${Math.round(limit / 1024 / 1024)} MB limit.`);
		const data = Buffer.alloc(info.size);
		let offset = 0;
		while (offset < data.length) {
			const { bytesRead } = await handle.read(data, offset, data.length - offset, offset);
			if (!bytesRead) throw new Error(`“${basename(path)}” changed while being read. Try again.`);
			offset += bytesRead;
		}
		if ((await handle.stat()).size !== info.size) throw new Error(`“${basename(path)}” changed while being read. Try again.`);
		return new File([new Uint8Array(data)], basename(path));
	} finally {
		await handle.close();
	}
}
async function decodeNativeImages(files) {
	if (files.reduce((total, f) => total + f.size, 0) > LIMITS.totalBytes) throw new Error("The selected images exceed 120 MB.");
	const assets = [];
	for (const file of files) {
		if (!file.size || file.size > LIMITS.assetBytes) throw new Error(`“${file.name}” must be non-empty and no larger than 50 MB.`);
		try {
			const header = await readImageHeader(file);
			const data = Buffer.from(await file.arrayBuffer());
			const { info } = await sharp(data, {
				limitInputPixels: LIMITS.imagePixels,
				failOn: "warning"
			}).rotate().png().toBuffer({ resolveWithObject: true });
			assets.push({
				id: crypto.randomUUID(),
				name: file.name.slice(0, 255),
				mime: header.mime,
				width: info.width,
				height: info.height,
				blob: file
			});
		} catch (cause) {
			throw new Error(`Could not read “${file.name}”: ${cause instanceof Error ? cause.message : "invalid image"}. The plugin accepts PNG, JPEG and still WebP up to 24 megapixels. Use the web studio to convert other formats.`, { cause });
		}
	}
	return assets;
}
async function readAssets(paths, directory) {
	const assets = /* @__PURE__ */ new Map();
	const byPath = /* @__PURE__ */ new Map();
	let total = 0;
	for (const path of paths) {
		const absolute = await realpath(localPath(path, directory));
		let asset = byPath.get(absolute);
		if (!asset) {
			const file = await readLocalFile(absolute, LIMITS.assetBytes);
			total += file.size;
			if (total > LIMITS.totalBytes) throw new Error("The selected images exceed 120 MB.");
			[asset] = await decodeNativeImages([file]);
			byPath.set(absolute, asset);
		}
		assets.set(path, asset);
	}
	return assets;
}
LIMITS.overlays;
/** Both panorama crops render the same extra images across the seam. */
function sceneAssetIds(project, shot) {
	if (resolveExportProfile(project).sourceOnly) return shot.assetId === null ? [] : [shot.assetId];
	return [...new Set([
		shot.assetId,
		...shot.backgroundImage ? [shot.backgroundImage.assetId] : [],
		...(shot.companions ?? []).map((item) => item.assetId),
		...linkedShots(project, shot.id).flatMap((owner) => (owner.overlays ?? []).map((item) => item.assetId)),
		...(shot.overlays ?? []).map((item) => item.assetId)
	].filter((id) => id !== null))];
}
//#endregion
//#region src/rendering/device-frame.ts
function drawHandheld(group, device) {
	const { shell, buttons, antennaBands, speaker } = device.handheld;
	const scale = Math.min(device.width, device.height);
	const apple = device.family === "ios" || device.family === "ipad";
	const metal = apple ? [
		0,
		"#77736D",
		.18,
		"#D6D2C9",
		.44,
		"#99958E",
		.72,
		"#E1DED7",
		1,
		"#7C7872"
	] : [
		0,
		"#454950",
		.2,
		"#A4A9B0",
		.5,
		"#60666F",
		.8,
		"#C1C5CB",
		1,
		"#4A5058"
	];
	for (const button of buttons) group.add(new Konva.Rect({
		...button,
		cornerRadius: button.radius,
		fillLinearGradientStartPoint: {
			x: 0,
			y: 0
		},
		fillLinearGradientEndPoint: {
			x: button.width,
			y: button.height
		},
		fillLinearGradientColorStops: metal,
		stroke: "#55565A",
		strokeWidth: scale * 7e-4,
		listening: false
	}));
	group.add(new Konva.Rect({
		...shell,
		cornerRadius: shell.radius,
		fillLinearGradientStartPoint: {
			x: 0,
			y: 0
		},
		fillLinearGradientEndPoint: {
			x: shell.width,
			y: shell.height * .55
		},
		fillLinearGradientColorStops: metal,
		stroke: "#464749",
		strokeWidth: scale * .0014,
		shadowColor: "#0D1118",
		shadowBlur: scale * .06,
		shadowOffsetY: scale * .035,
		shadowOpacity: .24
	}));
	const rim = scale * (device.family === "ios" ? .007 : apple ? .006 : .0045);
	group.add(new Konva.Rect({
		x: shell.x + rim,
		y: shell.y + rim,
		width: shell.width - rim * 2,
		height: shell.height - rim * 2,
		cornerRadius: shell.radius - rim,
		fill: "#101114",
		stroke: "#08090B",
		strokeWidth: scale * .0015,
		listening: false
	}));
	group.add(new Konva.Rect({
		x: shell.x + rim * .35,
		y: shell.y + rim * .35,
		width: shell.width - rim * .7,
		height: shell.height - rim * .7,
		cornerRadius: shell.radius - rim * .35,
		stroke: "#F4F0E9",
		strokeWidth: scale * 9e-4,
		opacity: .55,
		listening: false
	}));
	for (const band of antennaBands) group.add(new Konva.Rect({
		...band,
		fill: "#5B5A58",
		listening: false
	}));
	if (speaker) group.add(new Konva.Rect({
		...speaker,
		cornerRadius: speaker.radius,
		fill: "#050608",
		listening: false
	}));
}
/** Glass lip and optional camera sit above the screenshot, using the same rotated geometry. */
function drawDeviceDetails(group, device, camera) {
	if (device.frame && device.family !== "card") group.add(new Konva.Rect({
		...device.screen,
		cornerRadius: device.screen.radius,
		stroke: "#050608",
		strokeWidth: Math.min(device.width, device.height) * .0015,
		listening: false
	}));
	if (!camera || device.family === "card") return;
	const cutout = device.camera;
	const diameter = Math.min(cutout.width, cutout.height);
	const island = device.family === "ios";
	group.add(new Konva.Rect({
		...cutout,
		cornerRadius: cutout.radius,
		fill: "#050608",
		stroke: "#24262B",
		strokeWidth: diameter * .035,
		listening: false
	}));
	const horizontal = cutout.width > cutout.height;
	const x = island && horizontal ? cutout.x + cutout.width - diameter * .65 : cutout.x + cutout.width / 2;
	const y = island && !horizontal ? cutout.y + diameter * .65 : cutout.y + cutout.height / 2;
	const radius = diameter * (island ? .235 : .32);
	group.add(new Konva.Circle({
		x,
		y,
		radius,
		fill: "#111925",
		stroke: "#202938",
		strokeWidth: diameter * .04,
		listening: false
	}));
	group.add(new Konva.Circle({
		x: x - radius * .22,
		y: y - radius * .23,
		radius: radius * .43,
		fill: "#314157",
		opacity: .75,
		listening: false
	}));
}
/** Paint the hardware behind the screenshot. Shared by the preview and PNG renderer. */
function drawDeviceFrame(group, device) {
	if (device.handheld && device.frame) {
		drawHandheld(group, device);
		return;
	}
	if (!device.body || !device.frame) {
		group.add(new Konva.Rect({
			width: device.width,
			height: device.height,
			cornerRadius: device.radius,
			fill: device.frame && device.family !== "card" ? "#252A29" : "#FFFFFF",
			stroke: device.frame && device.family !== "card" ? "#626967" : void 0,
			strokeWidth: device.frame ? 1.5 : 0,
			shadowColor: "#18251F",
			shadowBlur: device.width * .065,
			shadowOffsetX: 0,
			shadowOffsetY: device.width * .042,
			shadowOpacity: .2
		}));
		if (device.frame) group.add(new Konva.Rect({
			x: 3,
			y: 3,
			width: device.width - 6,
			height: device.height - 6,
			cornerRadius: Math.max(0, device.radius - 3),
			stroke: "#FFFFFF",
			strokeWidth: 1,
			opacity: .13,
			listening: false
		}));
		return;
	}
	const { width, body, stand, base, keyboard, trackpad } = device;
	if (stand) group.add(new Konva.Rect({
		...stand,
		cornerRadius: width * .007,
		fillLinearGradientStartPoint: {
			x: 0,
			y: 0
		},
		fillLinearGradientEndPoint: {
			x: stand.width,
			y: 0
		},
		fillLinearGradientColorStops: [
			0,
			"#929B9C",
			.25,
			"#CBD0CF",
			.55,
			"#DFE2DF",
			1,
			"#A7AEAC"
		],
		listening: false
	}));
	if (base && device.family === "monitor") group.add(new Konva.Rect({
		...base,
		cornerRadius: [
			width * .012,
			width * .012,
			width * .006,
			width * .006
		],
		fillLinearGradientStartPoint: {
			x: 0,
			y: 0
		},
		fillLinearGradientEndPoint: {
			x: 0,
			y: base.height
		},
		fillLinearGradientColorStops: [
			0,
			"#E8EAE6",
			.65,
			"#AEB6B2",
			1,
			"#858F8C"
		],
		shadowColor: "#18251F",
		shadowBlur: width * .026,
		shadowOffsetY: width * .011,
		shadowOpacity: .23,
		listening: false
	}));
	group.add(new Konva.Rect({
		...body,
		cornerRadius: body.radius,
		fill: "#232A29",
		stroke: "#7E8883",
		strokeWidth: width * .0014,
		shadowColor: "#18251F",
		shadowBlur: width * .042,
		shadowOffsetY: width * .026,
		shadowOpacity: .19,
		listening: false
	}));
	group.add(new Konva.Rect({
		x: body.x + width * .002,
		y: width * .002,
		width: body.width - width * .004,
		height: body.height - width * .004,
		cornerRadius: Math.max(0, body.radius - width * .002),
		stroke: "#F7F8F0",
		strokeWidth: width * .001,
		opacity: .22,
		listening: false
	}));
	if (device.family === "monitor") {
		const chinY = device.screen.y + device.screen.height + width * .009;
		group.add(new Konva.Rect({
			x: width * .002,
			y: chinY,
			width: width * .996,
			height: body.height - chinY - width * .002,
			cornerRadius: [
				0,
				0,
				width * .02,
				width * .02
			],
			fillLinearGradientStartPoint: {
				x: 0,
				y: 0
			},
			fillLinearGradientEndPoint: {
				x: width,
				y: 0
			},
			fillLinearGradientColorStops: [
				0,
				"#BDC4BF",
				.5,
				"#D7DCD5",
				1,
				"#BAC2BC"
			],
			listening: false
		}));
	}
	if (base && device.family === "laptop") {
		const frontY = base.y + base.height * .83;
		group.add(new Konva.Line({
			points: [
				width * .05,
				base.y,
				width * .95,
				base.y,
				width,
				frontY,
				width * .985,
				base.y + base.height,
				width * .015,
				base.y + base.height,
				0,
				frontY
			],
			closed: true,
			lineJoin: "round",
			fillLinearGradientStartPoint: {
				x: 0,
				y: base.y
			},
			fillLinearGradientEndPoint: {
				x: 0,
				y: base.y + base.height
			},
			fillLinearGradientColorStops: [
				0,
				"#A5AFAB",
				.25,
				"#DDE1D9",
				.82,
				"#C0C9C1",
				.84,
				"#9CA9A0",
				1,
				"#718177"
			],
			stroke: "#86948B",
			strokeWidth: width * 9e-4,
			shadowColor: "#18251F",
			shadowBlur: width * .038,
			shadowOffsetY: width * .015,
			shadowOpacity: .23,
			listening: false
		}));
		if (keyboard) {
			group.add(new Konva.Rect({
				...keyboard,
				cornerRadius: width * .004,
				fill: "#68756C",
				opacity: .65,
				listening: false
			}));
			const gap = width * .003;
			const keyWidth = (keyboard.width - gap * 16) / 15;
			const keyHeight = (keyboard.height - gap * 4) / 3;
			for (let row = 0; row < 3; row++) for (let column = 0; column < 15; column++) group.add(new Konva.Rect({
				x: keyboard.x + gap + column * (keyWidth + gap),
				y: keyboard.y + gap + row * (keyHeight + gap),
				width: keyWidth,
				height: keyHeight,
				cornerRadius: width * .0013,
				fill: "#303D34",
				opacity: .73,
				listening: false
			}));
		}
		if (trackpad) group.add(new Konva.Rect({
			...trackpad,
			cornerRadius: width * .003,
			stroke: "#8E9C92",
			strokeWidth: width * .001,
			fill: "#CBD3C9",
			listening: false
		}));
		group.add(new Konva.Line({
			points: [
				width * .44,
				frontY,
				width * .56,
				frontY
			],
			stroke: "#697A6D",
			strokeWidth: width * .005,
			lineCap: "round",
			listening: false
		}));
	}
}
//#endregion
//#region src/rendering/device-perspective.ts
/** Fits an orthographic yaw/pitch projection inside the existing editable footprint. */
function deviceProjection(device, pose) {
	const yaw = pose.yaw * Math.PI / 180, pitch = pose.pitch * Math.PI / 180;
	const a = Math.cos(yaw), b = Math.sin(yaw) * Math.sin(pitch), d = Math.cos(pitch);
	const depth = device.frame ? device.width * pose.depth : 0;
	const dx = depth * (yaw < 0 ? 1 : -1), dy = depth * .6;
	const scale = Math.min(device.width / (a * device.width + Math.abs(dx)), device.height / (Math.abs(b) * device.width + d * device.height + dy));
	return {
		x: (device.width - (a * device.width + Math.abs(dx)) * scale) / 2 - Math.min(0, dx) * scale,
		y: (device.height - (Math.abs(b) * device.width + d * device.height + dy) * scale) / 2 - Math.min(0, b * device.width) * scale,
		scaleX: a * scale,
		scaleY: d * scale,
		skewY: b / a,
		dx: dx * scale,
		dy: dy * scale
	};
}
/** Only collection templates opt in. Handles and document placement remain on the outer group. */
function deviceFace(parent, device, template) {
	const pose = panoramaPose(template);
	if (!pose) return parent;
	const { dx, dy, ...transform } = deviceProjection(device, pose);
	if (device.frame) {
		const shell = device.handheld?.shell ?? device.body ?? {
			x: 0,
			y: 0,
			width: device.width,
			height: device.height,
			radius: device.radius
		};
		for (let i = 10; i >= 1; i--) {
			const slice = new Konva.Group({
				...transform,
				x: transform.x + dx * i / 10,
				y: transform.y + dy * i / 10,
				listening: false
			});
			slice.add(new Konva.Rect({
				...shell,
				cornerRadius: shell.radius,
				fill: i === 10 ? "#2A3035" : i % 3 === 0 ? "#97A2A9" : "#55616A",
				...i === 10 ? {
					shadowColor: "#151B24",
					shadowBlur: device.width * .08,
					shadowOpacity: .25,
					shadowOffsetX: device.width * .025,
					shadowOffsetY: device.width * .055
				} : {}
			}));
			parent.add(slice);
		}
	}
	const face = new Konva.Group({
		...transform,
		name: "projected-device-face"
	});
	parent.add(face);
	return face;
}
//#endregion
//#region src/rendering/banner-decoration.ts
/** Vector artwork stays crisp in both Play banner sizes. */
function drawBannerDecoration(layer, style, panel) {
	if (!style.template.startsWith("banner-")) return;
	const group = new Konva.Group({
		listening: false,
		name: "banner-decoration"
	});
	const { x, y, width: w, height: h } = panel;
	const center = {
		x: x + w / 2,
		y: y + h / 2
	};
	switch (style.template) {
		case "banner-signal":
			group.add(new Konva.Rect({
				...panel,
				fill: style.backgroundEnd,
				cornerRadius: 56
			}));
			group.add(new Konva.Circle({
				x: x + w - 12,
				y: y + 12,
				radius: 16,
				fill: style.accentColor
			}));
			group.add(new Konva.Line({
				points: [
					x - 24,
					y + h - 26,
					x - 24,
					y + h + 8,
					x + 10,
					y + h + 8
				],
				stroke: style.accentColor,
				strokeWidth: 2
			}));
			break;
		case "banner-orbit":
			group.add(new Konva.Circle({
				...center,
				radius: Math.min(w, h) * .46,
				fill: style.backgroundEnd
			}));
			for (const scale of [.55, .63]) group.add(new Konva.Ellipse({
				...center,
				radiusX: w * scale,
				radiusY: h * .43,
				rotation: -28,
				stroke: style.accentColor,
				strokeWidth: 1,
				opacity: .65
			}));
			group.add(new Konva.Circle({
				x: x + w - 10,
				y: y + 46,
				radius: 8,
				fill: style.textColor
			}));
			break;
		case "banner-editorial":
			group.add(new Konva.Rect({
				...panel,
				fill: style.backgroundEnd,
				cornerRadius: [
					w / 2,
					w / 2,
					12,
					12
				]
			}));
			for (const lineY of [y - 18, y + h + 18]) group.add(new Konva.Line({
				points: [
					110,
					lineY,
					970,
					lineY
				],
				stroke: style.accentColor,
				strokeWidth: 1,
				opacity: .55
			}));
			break;
		case "banner-ribbon":
			group.add(new Konva.Rect({
				x: x - 28,
				y: y + 8,
				width: w + 36,
				height: h - 10,
				cornerRadius: 36,
				fill: style.backgroundEnd,
				rotation: -5
			}));
			group.add(new Konva.Line({
				points: [
					x - 150,
					y + h * .76,
					x + w + 30,
					y + h * .33,
					x + w + 30,
					y + h * .64,
					x - 150,
					y + h * 1.07
				],
				closed: true,
				fill: style.accentColor,
				opacity: .48
			}));
			break;
		case "banner-dusk":
			group.add(new Konva.Rect({
				...panel,
				cornerRadius: [
					w / 2,
					w / 2,
					12,
					12
				],
				fill: style.backgroundEnd
			}));
			group.add(new Konva.Rect({
				x: x - 16,
				y: y - 16,
				width: w + 32,
				height: h + 32,
				cornerRadius: [
					w / 2 + 16,
					w / 2 + 16,
					16,
					16
				],
				stroke: style.accentColor,
				strokeWidth: 1,
				opacity: .7
			}));
			group.add(new Konva.Circle({
				x: x + w - 12,
				y: y + 26,
				radius: 20,
				fill: style.accentColor
			}));
			break;
		case "banner-confetti":
			group.add(new Konva.Rect({
				...panel,
				fill: style.backgroundEnd,
				cornerRadius: 40,
				rotation: 4
			}));
			group.add(new Konva.Circle({
				x: x + w - 14,
				y: y + h - 20,
				radius: 48,
				fill: style.accentColor
			}));
			group.add(new Konva.Wedge({
				x: x + 20,
				y: y + 18,
				radius: 65,
				angle: 180,
				rotation: -35,
				fill: style.accentColor
			}));
			group.add(new Konva.Rect({
				x: x + w - 32,
				y: y + 6,
				width: 18,
				height: 42,
				rotation: 28,
				fill: style.textColor,
				opacity: .6
			}));
	}
	layer.add(group);
}
//#endregion
//#region src/rendering/composition-decoration.ts
/** A quiet stage keeps mixed screen sizes readable, with a distinct motif per pairing. */
function drawCompositionDecoration(layer, style, panel) {
	const id = compositionId(style.template);
	if (!id) return;
	const group = new Konva.Group({
		name: "composition-decoration",
		listening: false,
		clip: panel
	});
	group.add(new Konva.Rect({
		...panel,
		cornerRadius: 32,
		fill: style.backgroundEnd,
		opacity: .55
	}));
	const cx = panel.x + panel.width / 2, cy = panel.y + panel.height / 2;
	if (id === "sidekick" || id === "workspace") for (let i = 0; i < 5; i++) group.add(new Konva.Line({
		points: [
			panel.x,
			panel.y + panel.height * (.6 + i * .12),
			panel.x + panel.width,
			panel.y + panel.height * (.25 + i * .12)
		],
		stroke: style.accentColor,
		strokeWidth: i === 0 ? 36 : 1.5,
		opacity: i === 0 ? .12 : .2
	}));
	else if (id === "handoff" || id === "desktop-suite") for (let i = 1; i < 12; i++) {
		group.add(new Konva.Line({
			points: [
				panel.x + panel.width * i / 12,
				panel.y,
				panel.x + panel.width * i / 12,
				panel.y + panel.height
			],
			stroke: style.accentColor,
			strokeWidth: 1,
			opacity: .14
		}));
		group.add(new Konva.Line({
			points: [
				panel.x,
				panel.y + panel.height * i / 12,
				panel.x + panel.width,
				panel.y + panel.height * i / 12
			],
			stroke: style.accentColor,
			strokeWidth: 1,
			opacity: .14
		}));
	}
	else if (id === "companion" || id === "duet") for (let i = 0; i < 3; i++) group.add(new Konva.Circle({
		x: cx + (i - 1) * panel.width * .35,
		y: cy + (i - 1) * panel.height * .18,
		radius: Math.min(panel.width, panel.height) * .42,
		fill: style.accentColor,
		opacity: .09
	}));
	else {
		for (let i = 0; i < 4; i++) group.add(new Konva.Ellipse({
			x: cx,
			y: cy,
			radiusX: panel.width * (.2 + i * .12),
			radiusY: panel.height * (.18 + i * .11),
			stroke: style.accentColor,
			strokeWidth: 1.5,
			opacity: .3,
			rotation: -12
		}));
		for (const [x, y] of [
			[.12, .22],
			[.84, .16],
			[.91, .68],
			[.23, .91]
		]) group.add(new Konva.Circle({
			x: panel.x + panel.width * x,
			y: panel.y + panel.height * y,
			radius: 4,
			fill: style.accentColor,
			opacity: .65
		}));
	}
	layer.add(group);
}
//#endregion
//#region src/rendering/holiday-decoration.ts
function motif$1(x, y, size, rotation = 0) {
	return new Konva.Group({
		x,
		y,
		scaleX: size / 100,
		scaleY: size / 100,
		rotation
	});
}
function line(group, points, color, width = 1.5, opacity = 1) {
	group.add(new Konva.Line({
		points,
		stroke: color,
		strokeWidth: width,
		opacity,
		lineCap: "round",
		lineJoin: "round"
	}));
}
function sparkle(group, x, y, r, color) {
	group.add(new Konva.Star({
		x,
		y,
		numPoints: 4,
		innerRadius: r * .18,
		outerRadius: r,
		fill: color
	}));
}
function pine(group, x, y, size, rotation, color) {
	const branch = motif$1(x, y, size, rotation);
	line(branch, [
		0,
		100,
		0,
		0
	], color, 1.4);
	for (let i = 1; i <= 9; i++) {
		const y = i * 10;
		const spread = 8 + i * 2.4;
		for (const d of [-1, 1]) {
			line(branch, [
				0,
				y + 5,
				d * spread,
				y - 14
			], color, 1.2, .8);
			line(branch, [
				0,
				y,
				d * spread * .66,
				y - 22
			], color, .9, .65);
		}
	}
	group.add(branch);
}
function ornament(group, x, y, r, style) {
	line(group, [
		x,
		0,
		x,
		y - r
	], style.accentColor, 1.3);
	group.add(new Konva.Rect({
		x: x - r * .2,
		y: y - r * 1.12,
		width: r * .4,
		height: r * .24,
		cornerRadius: 3,
		fill: style.accentColor
	}));
	group.add(new Konva.Circle({
		x,
		y,
		radius: r,
		fill: style.backgroundEnd,
		stroke: style.accentColor,
		strokeWidth: 2
	}));
	group.add(new Konva.Ellipse({
		x,
		y,
		radiusX: r * .48,
		radiusY: r * .96,
		stroke: style.accentColor,
		strokeWidth: 1.2
	}));
	line(group, [
		x - r * .95,
		y,
		x + r * .95,
		y
	], style.accentColor, 1.2);
	sparkle(group, x, y, r * .32, style.accentColor);
}
function snowflake(group, x, y, size, color, rotation) {
	const flake = motif$1(x, y, size, rotation);
	for (let i = 0; i < 6; i++) {
		const arm = new Konva.Group({ rotation: i * 60 });
		line(arm, [
			0,
			0,
			0,
			-48
		], color, 2);
		for (const y of [-23, -36]) line(arm, [
			-10,
			y - 8,
			0,
			y,
			10,
			y - 8
		], color, 2);
		flake.add(arm);
	}
	group.add(flake);
}
function cookie(group, x, y, size, style, kind, rotation) {
	const shape = motif$1(x, y, size, rotation);
	const icing = style.background;
	if (kind === "star") {
		shape.add(new Konva.Star({
			numPoints: 5,
			innerRadius: 24,
			outerRadius: 49,
			fill: style.accentColor,
			stroke: icing,
			strokeWidth: 3
		}));
		shape.add(new Konva.Star({
			numPoints: 5,
			innerRadius: 15,
			outerRadius: 32,
			stroke: icing,
			strokeWidth: 1.7
		}));
	} else if (kind === "house") {
		shape.add(new Konva.Path({
			data: "M -43 -5 L 0 -47 L 43 -5 L 36 1 L 36 44 L -36 44 L -36 1 Z",
			fill: style.accentColor,
			stroke: icing,
			strokeWidth: 3,
			lineJoin: "round"
		}));
		line(shape, [
			-39,
			-4,
			0,
			-41,
			39,
			-4
		], icing, 3);
		shape.add(new Konva.Rect({
			x: -10,
			y: 14,
			width: 20,
			height: 29,
			cornerRadius: [
				10,
				10,
				0,
				0
			],
			stroke: icing,
			strokeWidth: 2.5
		}));
		for (const x of [-25, 13]) {
			shape.add(new Konva.Rect({
				x,
				y: -4,
				width: 12,
				height: 12,
				cornerRadius: 2,
				stroke: icing,
				strokeWidth: 2
			}));
			line(shape, [
				x + 6,
				-4,
				x + 6,
				8
			], icing, 1);
		}
		shape.add(new Konva.Circle({
			y: -22,
			radius: 5,
			stroke: icing,
			strokeWidth: 2
		}));
		for (let i = 0; i < 7; i++) shape.add(new Konva.Circle({
			x: -28 + i * 9.4,
			y: 37,
			radius: 1.6,
			fill: icing
		}));
	} else {
		shape.add(new Konva.Path({
			data: "M 0 -51 L 25 -17 L 15 -17 L 36 13 L 23 13 L 45 43 L 9 43 L 9 51 L -9 51 L -9 43 L -45 43 L -23 13 L -36 13 L -15 -17 L -25 -17 Z",
			fill: style.accentColor,
			stroke: icing,
			strokeWidth: 3,
			lineJoin: "round"
		}));
		for (const y of [
			-10,
			13,
			34
		]) line(shape, [
			-((y + 55) * .34),
			y - 5,
			0,
			y + 1,
			(y + 55) * .34,
			y - 5
		], icing, 2.4);
	}
	group.add(shape);
}
function firework(group, x, y, r, color) {
	for (let i = 0; i < 24; i++) {
		const a = i * Math.PI / 12;
		const length = r * (i % 2 ? .8 : 1);
		const dx = Math.cos(a), dy = Math.sin(a);
		line(group, [
			x + dx * r * .22,
			y + dy * r * .22,
			x + dx * length,
			y + dy * length
		], color, i % 2 ? 1.7 : 2.7, .85);
		group.add(new Konva.Circle({
			x: x + dx * length * 1.14,
			y: y + dy * length * 1.14,
			radius: r * .018,
			fill: color
		}));
	}
	sparkle(group, x, y, r * .09, color);
}
/** Clip artwork to the device region so every export ratio keeps its captions clear. */
function drawHolidayDecoration(layer, style, h, panel) {
	if (![
		"evergreen",
		"snowfall",
		"gift-wrap",
		"gingerbread",
		"midnight",
		"firework",
		"countdown",
		"first-light"
	].includes(style.template)) return;
	const pad = Math.min(30, h * .02);
	const x = Math.max(0, panel.x - pad), y = Math.max(0, panel.y - pad);
	const w = Math.min(1080 - x, panel.width + 2 * pad), height = Math.min(h - y, panel.height + 2 * pad);
	const u = Math.min(w, height);
	const group = new Konva.Group({
		x,
		y,
		listening: false,
		name: "template-decoration",
		clipX: 0,
		clipY: 0,
		clipWidth: w,
		clipHeight: height
	});
	switch (style.template) {
		case "evergreen":
			group.add(new Konva.Rect({
				x: w * .08,
				y: height * .035,
				width: w * .84,
				height: height * .94,
				cornerRadius: [
					u * .4,
					u * .4,
					12,
					12
				],
				fill: style.backgroundEnd,
				opacity: .5
			}));
			pine(group, w * .13, height * .53, u * .59, -22, style.accentColor);
			pine(group, w * .87, height * .95, u * .5, 156, style.accentColor);
			ornament(group, w * .82, height * .17, u * .09, style);
			ornament(group, w * .13, height * .19, u * .062, style);
			ornament(group, w * .91, height * .39, u * .065, style);
			break;
		case "snowfall":
			group.add(new Konva.Rect({
				x: 10,
				y: 10,
				width: w - 20,
				height: height - 20,
				cornerRadius: u * .15,
				fill: style.backgroundEnd,
				opacity: .6
			}));
			for (const [cx, cy, r] of [
				[
					.09,
					.24,
					.26
				],
				[
					.89,
					.72,
					.32
				],
				[
					.81,
					.08,
					.19
				],
				[
					.16,
					.91,
					.2
				]
			]) snowflake(group, w * cx, height * cy, u * r, style.accentColor, cx * 100);
			for (let i = 0; i < 22; i++) group.add(new Konva.Circle({
				x: w * ((i * .381 + .07) % 1),
				y: height * ((i * .617 + .12) % 1),
				radius: u * (i % 3 ? .004 : .007),
				fill: style.background
			}));
			group.add(new Konva.Ellipse({
				x: w * .25,
				y: height,
				radiusX: w * .65,
				radiusY: u * .16,
				fill: style.background,
				opacity: .75
			}));
			break;
		case "gift-wrap": {
			const plaid = new Konva.Group({
				clipX: w * .05,
				clipY: height * .04,
				clipWidth: w * .9,
				clipHeight: height * .92
			});
			plaid.add(new Konva.Rect({
				width: w,
				height,
				fill: style.backgroundEnd,
				opacity: .5
			}));
			const step = u * .14;
			for (let x = 0; x < w; x += step) {
				line(plaid, [
					x,
					0,
					x,
					height
				], style.accentColor, step * .32, .22);
				line(plaid, [
					x + step * .35,
					0,
					x + step * .35,
					height
				], style.accentColor, 1.3, .35);
			}
			for (let y = 0; y < height; y += step) {
				line(plaid, [
					0,
					y,
					w,
					y
				], style.accentColor, step * .32, .22);
				line(plaid, [
					0,
					y + step * .35,
					w,
					y + step * .35
				], style.accentColor, 1.3, .35);
			}
			group.add(plaid);
			line(group, [
				w * .16,
				height * .04,
				w * .16,
				height * .96
			], style.accentColor, u * .042);
			line(group, [
				w * .05,
				height * .8,
				w * .95,
				height * .8
			], style.accentColor, u * .045);
			const bow = motif$1(w * .17, height * .8, u * .32, -12);
			bow.add(new Konva.Path({
				data: "M 0 0 C -80 -85 -68 41 0 0 C 78 -81 73 39 0 0 Z M -7 3 L -36 60 L -15 53 L -5 65 L 6 5 M 7 3 L 35 60 L 16 53 L 6 64 L -5 5",
				fill: style.accentColor,
				stroke: style.background,
				strokeWidth: 1.2
			}));
			bow.add(new Konva.Rect({
				x: -7,
				y: -8,
				width: 14,
				height: 18,
				cornerRadius: 5,
				fill: style.textColor
			}));
			group.add(bow);
			break;
		}
		case "gingerbread":
			group.add(new Konva.Rect({
				x: 10,
				y: 10,
				width: w - 20,
				height: height - 20,
				cornerRadius: u * .12,
				fill: style.backgroundEnd,
				opacity: .6
			}));
			cookie(group, w * .15, height * .22, u * .32, style, "house", -12);
			cookie(group, w * .85, height * .77, u * .32, style, "tree", 12);
			cookie(group, w * .84, height * .09, u * .18, style, "star", 10);
			cookie(group, w * .13, height * .9, u * .2, style, "star", -15);
			for (const [cx, cy] of [
				[.9, .4],
				[.12, .62],
				[.47, .95]
			]) sparkle(group, w * cx, height * cy, u * .02, style.accentColor);
			break;
		case "midnight":
			group.add(new Konva.Rect({
				x: w * .07,
				y: height * .04,
				width: w * .86,
				height: height * .92,
				cornerRadius: u * .42,
				fill: style.backgroundEnd,
				opacity: .48
			}));
			for (const mirror of [false, true]) {
				const fan = new Konva.Group({
					x: mirror ? w * .97 : w * .03,
					y: mirror ? height * .96 : height * .04,
					rotation: mirror ? 180 : 0
				});
				const radius = u * .42;
				for (let i = 0; i <= 12; i++) {
					const a = i * Math.PI / 24;
					line(fan, [
						0,
						0,
						Math.cos(a) * radius,
						Math.sin(a) * radius
					], style.accentColor, i % 3 ? 1 : 2, .85);
				}
				for (const r of [
					.6,
					.84,
					1
				]) fan.add(new Konva.Arc({
					innerRadius: radius * r,
					outerRadius: radius * r + 1.5,
					angle: 90,
					fill: style.accentColor
				}));
				group.add(fan);
			}
			for (const [cx, cy, r] of [
				[
					.88,
					.17,
					.03
				],
				[
					.12,
					.79,
					.038
				],
				[
					.81,
					.48,
					.018
				]
			]) sparkle(group, w * cx, height * cy, u * r, style.accentColor);
			break;
		case "firework":
			group.add(new Konva.Ellipse({
				x: w * .5,
				y: height * .62,
				radiusX: w * .47,
				radiusY: height * .43,
				fill: style.backgroundEnd,
				opacity: .55
			}));
			firework(group, w * .83, height * .18, u * .22, style.accentColor);
			firework(group, w * .12, height * .69, u * .2, style.textColor);
			firework(group, w * .86, height * .88, u * .15, style.accentColor);
			for (const [cx, cy] of [
				[.09, .25],
				[.68, .05],
				[.92, .52],
				[.45, .96]
			]) sparkle(group, w * cx, height * cy, u * .012, style.textColor);
			break;
		case "countdown": {
			const cx = w * .22, cy = height * .2, r = u * .21;
			group.add(new Konva.Circle({
				x: cx,
				y: cy,
				radius: r,
				fill: style.backgroundEnd,
				opacity: .6
			}));
			group.add(new Konva.Circle({
				x: cx,
				y: cy,
				radius: r * .94,
				stroke: style.accentColor,
				strokeWidth: 2
			}));
			for (let i = 0; i < 60; i++) {
				const a = i * Math.PI / 30;
				const inner = i % 5 ? .87 : .8;
				line(group, [
					cx + Math.sin(a) * r * inner,
					cy - Math.cos(a) * r * inner,
					cx + Math.sin(a) * r * .9,
					cy - Math.cos(a) * r * .9
				], style.accentColor, i % 5 ? 1 : 3);
			}
			line(group, [
				cx - r * .13,
				cy - r * .59,
				cx,
				cy,
				cx - r * .38,
				cy - r * .63
			], style.textColor, 4);
			for (const [x, y, rotation] of [[
				w * .12,
				height * .78,
				-20
			], [
				w * .86,
				height * .81,
				160
			]]) {
				const ribbon = motif$1(x, y, u * .3, rotation);
				ribbon.add(new Konva.Path({
					data: "M 10 -60 C -45 -45 46 -20 1 -1 C -40 16 37 38 -7 60",
					stroke: style.accentColor,
					strokeWidth: 7,
					lineCap: "round"
				}));
				group.add(ribbon);
			}
			for (let i = 0; i < 16; i++) group.add(new Konva.Rect({
				x: w * ((i * .618 + .03) % 1),
				y: height * ((i * .382 + .08) % 1),
				width: u * .011,
				height: u * .026,
				rotation: i * 37,
				fill: style.accentColor,
				opacity: .75
			}));
			break;
		}
		case "first-light": {
			group.add(new Konva.Rect({
				x: w * .08,
				y: height * .04,
				width: w * .84,
				height: height * .94,
				cornerRadius: [
					u * .42,
					u * .42,
					8,
					8
				],
				fill: style.backgroundEnd,
				opacity: .7
			}));
			const cx = w * .74, cy = height * .16, r = u * .145;
			group.add(new Konva.Circle({
				x: cx,
				y: cy,
				radius: r,
				fill: style.background
			}));
			for (let i = 0; i <= 20; i++) {
				const a = Math.PI * (1 + i / 20);
				line(group, [
					cx + Math.cos(a) * r * 1.18,
					cy + Math.sin(a) * r * 1.18,
					cx + Math.cos(a) * r * 1.68,
					cy + Math.sin(a) * r * 1.68
				], style.accentColor, 1.4, .7);
			}
			for (let i = 0; i < 5; i++) line(group, [
				w * .02,
				height * (.77 + i * .045),
				w * .98,
				height * (.77 + i * .045)
			], style.accentColor, 1.2, .42);
			break;
		}
	}
	layer.add(group);
}
//#endregion
//#region src/rendering/halloween-decoration.ts
function motif(x, y, size, rotation = 0) {
	return new Konva.Group({
		x,
		y,
		scaleX: size / 100,
		scaleY: size / 100,
		rotation
	});
}
function star(group, x, y, size, fill) {
	group.add(new Konva.Star({
		x,
		y,
		numPoints: 4,
		innerRadius: size * .2,
		outerRadius: size,
		fill
	}));
}
function pumpkin(group, x, y, size, style, rotation = 0) {
	const shape = motif(x, y, size, rotation);
	shape.add(new Konva.Path({
		data: "M -7 -36 Q -11 -55 6 -64 L 14 -58 Q 0 -49 3 -34 Z",
		fill: style.accentColor
	}));
	for (const [cx, rx] of [
		[-21, 30],
		[21, 30],
		[0, 29]
	]) shape.add(new Konva.Ellipse({
		x: cx,
		y: 0,
		radiusX: rx,
		radiusY: 40,
		fill: style.backgroundEnd,
		stroke: style.accentColor,
		strokeWidth: 1.8
	}));
	shape.add(new Konva.Path({
		data: "M -30 -5 L -16 -20 L -8 -3 Z M 8 -3 L 16 -20 L 30 -5 Z M -28 10 L -12 16 L -8 10 L 1 18 L 8 11 L 13 17 L 28 10 Q 20 34 0 31 Q -20 32 -28 10 Z",
		fill: style.textColor
	}));
	group.add(shape);
}
function ghost(group, x, y, size, style, rotation) {
	const shape = motif(x, y, size, rotation);
	shape.add(new Konva.Path({
		data: "M -38 43 L -36 -10 C -35 -54 34 -58 38 -12 L 46 43 Q 30 22 17 43 Q 3 22 -10 43 Q -24 23 -38 43 Z",
		fill: style.background,
		stroke: style.accentColor,
		strokeWidth: 1.5
	}));
	for (const x of [-13, 14]) shape.add(new Konva.Ellipse({
		x,
		y: -8,
		radiusX: 4,
		radiusY: 7,
		fill: style.textColor
	}));
	shape.add(new Konva.Ellipse({
		x: 2,
		y: 11,
		radiusX: 4,
		radiusY: 5,
		fill: style.accentColor
	}));
	group.add(shape);
}
function bat(group, x, y, size, color, rotation) {
	const shape = motif(x, y, size, rotation);
	shape.add(new Konva.Path({
		data: "M 0 7 C -8 -12 -32 -10 -50 -27 Q -42 -2 -38 5 Q -24 -3 -20 17 Q -7 9 0 29 Q 7 9 20 17 Q 24 -3 38 5 Q 42 -2 50 -27 C 32 -10 8 -12 0 7 Z M -7 9 L -8 -10 L -2 -5 L 3 -10 L 8 -6 L 7 12 Z",
		fill: color
	}));
	group.add(shape);
}
function web(group, x, y, size, rotation, color) {
	const shape = motif(x, y, size, rotation);
	const spokes = 6;
	for (let i = 0; i <= spokes; i++) {
		const angle = i / spokes * Math.PI / 2;
		shape.add(new Konva.Line({
			points: [
				0,
				0,
				Math.cos(angle) * 100,
				Math.sin(angle) * 100
			],
			stroke: color,
			strokeWidth: .7,
			opacity: .7
		}));
	}
	for (let ring = 1; ring <= 5; ring++) {
		const r = ring * 19;
		shape.add(new Konva.Shape({
			stroke: color,
			strokeWidth: .6,
			opacity: .6,
			sceneFunc(ctx, node) {
				ctx.beginPath();
				ctx.moveTo(r, 0);
				for (let i = 1; i <= spokes; i++) {
					const end = i / spokes * Math.PI / 2;
					const mid = (i - .5) / spokes * Math.PI / 2;
					ctx.quadraticCurveTo(Math.cos(mid) * r * .89, Math.sin(mid) * r * .89, Math.cos(end) * r, Math.sin(end) * r);
				}
				ctx.strokeShape(node);
			}
		}));
	}
	group.add(shape);
}
function candy(group, x, y, size, style, rotation) {
	const shape = motif(x, y, size, rotation);
	for (const direction of [-1, 1]) shape.add(new Konva.Line({
		points: [
			direction * 22,
			0,
			direction * 48,
			-23,
			direction * 44,
			0,
			direction * 48,
			23
		],
		closed: true,
		fill: style.accentColor
	}));
	shape.add(new Konva.Rect({
		x: -28,
		y: -23,
		width: 56,
		height: 46,
		cornerRadius: 15,
		fill: style.background,
		stroke: style.textColor,
		strokeWidth: 1.2
	}));
	const bands = new Konva.Group({
		clipX: -22,
		clipY: -20,
		clipWidth: 44,
		clipHeight: 40
	});
	for (let i = -2; i <= 2; i++) bands.add(new Konva.Line({
		points: [
			i * 21 - 15,
			-30,
			i * 21 + 20,
			30
		],
		stroke: style.backgroundEnd,
		strokeWidth: 8
	}));
	shape.add(bands);
	group.add(shape);
}
function drawMoonlight(layer, style, h) {
	const group = new Konva.Group({
		x: isPanoramaEnd(style.template) ? -1080 : 0,
		listening: false,
		name: "template-decoration"
	});
	const radius = Math.min(205, h * .2);
	group.add(new Konva.Circle({
		x: 1480,
		y: h * .24,
		radius,
		fill: style.textColor
	}));
	for (const [dx, dy, r] of [
		[
			-.3,
			-.22,
			.18
		],
		[
			.32,
			.17,
			.23
		],
		[
			-.12,
			.44,
			.09
		]
	]) group.add(new Konva.Circle({
		x: 1480 + dx * radius,
		y: h * .24 + dy * radius,
		radius: radius * r,
		fill: style.accentColor,
		opacity: .2
	}));
	for (let i = 0; i < 3; i++) group.add(new Konva.Shape({
		fill: i === 1 ? style.accentColor : style.backgroundEnd,
		opacity: i === 1 ? .12 : .7,
		sceneFunc(ctx, shape) {
			const y = h * (.76 + i * .085);
			ctx.beginPath();
			ctx.moveTo(-20, y);
			ctx.bezierCurveTo(450, y - h * .13, 730, y + h * .2, 1130, y - h * .015);
			ctx.bezierCurveTo(1640, y - h * .22, 1770, y + h * .1, 2180, y - h * .05);
			ctx.lineTo(2180, h + 10);
			ctx.lineTo(-20, h + 10);
			ctx.closePath();
			ctx.fillStrokeShape(shape);
		}
	}));
	bat(group, 1450, h * .24, radius * .7, style.background, -12);
	bat(group, 1600, h * .46, Math.min(130, h * .1), style.accentColor, 8);
	bat(group, 620, h * .52, Math.min(110, h * .085), style.accentColor, -18);
	for (const [x, y] of [
		[800, .05],
		[1210, .08],
		[1610, .075],
		[1350, .51],
		[210, .59],
		[490, .69]
	]) star(group, x, y * h, Math.min(9, h * .012), style.accentColor);
	const branch = new Konva.Group({
		x: 110,
		y: h,
		scaleY: h / 1920
	});
	branch.add(new Konva.Path({
		data: "M 0 80 Q 80 -190 40 -520 M 52 -300 L -28 -390 M 47 -375 L 129 -474 M 70 -188 L 162 -315 M 115 -250 L 168 -241 M 13 -343 L 17 -427",
		stroke: style.background,
		strokeWidth: 16,
		lineCap: "round",
		lineJoin: "round"
	}));
	group.add(branch);
	layer.add(group);
}
/** Original, bounded vector motifs use only the four editable template colors. */
function drawHalloweenDecoration(layer, style, h, panel) {
	if (panoramaStart(style.template) === "moonlight") {
		drawMoonlight(layer, style, h);
		return;
	}
	if (![
		"jack-o-lantern",
		"cobweb",
		"boo",
		"witching-hour",
		"candy-club"
	].includes(style.template)) return;
	const pad = Math.min(36, h * .025);
	const x = Math.max(0, panel.x - pad), y = Math.max(0, panel.y - pad);
	const w = Math.min(1080 - x, panel.width + pad * 2), height = Math.min(h - y, panel.height + pad * 2);
	const group = new Konva.Group({
		x,
		y,
		listening: false,
		name: "template-decoration",
		clipX: 0,
		clipY: 0,
		clipWidth: w,
		clipHeight: height
	});
	const unit = Math.min(w, height);
	switch (style.template) {
		case "jack-o-lantern":
			group.add(new Konva.Rect({
				x: w * .08,
				y: height * .06,
				width: w * .88,
				height: height * .9,
				cornerRadius: [
					unit * .43,
					unit * .43,
					24,
					24
				],
				fill: style.backgroundEnd,
				opacity: .2
			}));
			pumpkin(group, w * .2, height * .78, unit * .38, style, -14);
			pumpkin(group, w * .81, height * .91, unit * .29, style, 12);
			pumpkin(group, w * .87, height * .16, unit * .22, style, 18);
			for (const [cx, cy] of [
				[.1, .32],
				[.86, .54],
				[.38, .97]
			]) star(group, w * cx, height * cy, unit * .023, style.accentColor);
			break;
		case "cobweb": {
			group.add(new Konva.Rect({
				x: 20,
				y: 20,
				width: w - 40,
				height: height - 40,
				cornerRadius: 18,
				fill: style.backgroundEnd,
				opacity: .45
			}));
			web(group, w - 10, 10, unit * .62, 90, style.accentColor);
			web(group, 10, height - 10, unit * .5, -90, style.accentColor);
			group.add(new Konva.Line({
				points: [
					w * .9,
					0,
					w * .9,
					height * .55
				],
				stroke: style.accentColor,
				opacity: .65,
				strokeWidth: 1.5
			}));
			const spider = motif(w * .9, height * .57, unit * .13);
			for (const d of [-1, 1]) for (let i = 0; i < 4; i++) spider.add(new Konva.Line({
				points: [
					0,
					i * 8 - 12,
					d * 24,
					i * 12 - 30,
					d * 35,
					i * 15 - 28
				],
				stroke: style.accentColor,
				strokeWidth: 3,
				lineCap: "round"
			}));
			spider.add(new Konva.Ellipse({
				radiusX: 12,
				radiusY: 18,
				fill: style.accentColor
			}));
			spider.add(new Konva.Circle({
				y: -18,
				radius: 8,
				fill: style.accentColor
			}));
			group.add(spider);
			break;
		}
		case "boo":
			group.add(new Konva.Rect({
				x: 12,
				y: 12,
				width: w - 24,
				height: height - 24,
				cornerRadius: unit * .16,
				fill: style.backgroundEnd
			}));
			ghost(group, w * .13, height * .24, unit * .29, style, -12);
			ghost(group, w * .8, height * .84, unit * .28, style, 12);
			ghost(group, w * .82, height * .11, unit * .2, style, 8);
			for (const [cx, cy] of [
				[.1, .63],
				[.85, .46],
				[.38, .07]
			]) star(group, w * cx, height * cy, unit * .021, style.accentColor);
			break;
		case "witching-hour": {
			const r = unit * .44;
			for (const offset of [0, 12]) group.add(new Konva.Circle({
				x: w / 2,
				y: height / 2,
				radius: r + offset,
				stroke: style.accentColor,
				strokeWidth: offset ? 1 : 2.5,
				opacity: offset ? .4 : .85
			}));
			group.add(new Konva.Circle({
				x: w * .16,
				y: height * .16,
				radius: unit * .085,
				fill: style.accentColor
			}));
			group.add(new Konva.Circle({
				x: w * .18,
				y: height * .14,
				radius: unit * .081,
				fill: style.background
			}));
			const hat = motif(w * .16, height * .84, unit * .32, -15);
			hat.add(new Konva.Path({
				data: "M -35 25 Q -18 -14 -8 -58 Q 0 -41 29 -38 L 11 -30 Q 19 1 34 25 Z",
				fill: style.backgroundEnd,
				stroke: style.accentColor,
				strokeWidth: 1.7
			}));
			hat.add(new Konva.Ellipse({
				y: 26,
				radiusX: 50,
				radiusY: 12,
				fill: style.backgroundEnd,
				stroke: style.accentColor,
				strokeWidth: 1.7
			}));
			hat.add(new Konva.Path({
				data: "M -23 7 L 24 7 L 29 19 L -29 19 Z",
				fill: style.accentColor
			}));
			group.add(hat);
			for (const [cx, cy, size] of [
				[
					.86,
					.19,
					.035
				],
				[
					.88,
					.76,
					.04
				],
				[
					.31,
					.1,
					.018
				],
				[
					.66,
					.92,
					.024
				]
			]) star(group, w * cx, height * cy, unit * size, style.accentColor);
			break;
		}
		case "candy-club":
			group.add(new Konva.Rect({
				x: w * .05,
				width: w * .9,
				height,
				cornerRadius: unit * .12,
				fill: style.backgroundEnd,
				opacity: .7
			}));
			for (const cx of [w * .07, w * .91]) group.add(new Konva.Rect({
				x: cx - 8,
				width: 16,
				height,
				fill: style.accentColor,
				opacity: .35
			}));
			candy(group, w * .17, height * .2, unit * .29, style, -30);
			candy(group, w * .82, height * .79, unit * .31, style, 32);
			candy(group, w * .86, height * .06, unit * .22, style, -22);
			candy(group, w * .14, height * .94, unit * .23, style, 24);
	}
	layer.add(group);
}
//#endregion
//#region src/rendering/showcase-decoration.ts
/** Original vector artwork: no remote assets, filters, or export-only effects. */
function drawShowcaseDecoration(layer, style, h, panel) {
	const { x, y, width: w, height: ph } = panel;
	const group = new Konva.Group({
		x: isPanoramaEnd(style.template) ? -1080 : 0,
		listening: false,
		name: "template-decoration"
	});
	const rect = (attrs) => group.add(new Konva.Rect(attrs));
	const line = (points, opacity = .65, strokeWidth = 2) => group.add(new Konva.Line({
		points,
		stroke: style.accentColor,
		strokeWidth,
		opacity
	}));
	const polygon = (points, fill, opacity = 1) => group.add(new Konva.Line({
		points,
		closed: true,
		fill,
		opacity
	}));
	if (style.template === "prism") {
		polygon([
			x - 30,
			y + ph * .15,
			x + w * .82,
			y - ph * .04,
			x + w + 40,
			y + ph * .9,
			x + w * .22,
			y + ph * 1.06
		], style.backgroundEnd, .8);
		polygon([
			x + w * .3,
			y - ph * .08,
			x + w * .97,
			y + ph * .1,
			x + w * .68,
			y + ph * 1.06,
			x - 40,
			y + ph * .76
		], style.background, .65);
		line([
			x - 30,
			y + ph * .15,
			x + w * .82,
			y - ph * .04,
			x + w + 40,
			y + ph * .9
		], .5);
		line([
			x + w * .3,
			y - ph * .08,
			x + w * .68,
			y + ph * 1.06
		], .35);
	}
	if (style.template === "nocturne") {
		rect({
			x: x - 20,
			y: y - 20,
			width: w + 40,
			height: ph + 40,
			fill: style.backgroundEnd,
			cornerRadius: 6
		});
		rect({
			x: x - 6,
			y: y - 6,
			width: w + 12,
			height: ph + 12,
			stroke: style.accentColor,
			strokeWidth: 1,
			opacity: .35,
			cornerRadius: 3
		});
		if (h > 1080) line([
			84,
			h * .735,
			996,
			h * .735
		], .65);
		else line([
			608,
			h * .1,
			608,
			h * .9
		], .4);
	}
	if (style.template === "paper") {
		rect({
			x: x - 16,
			y: y - 18,
			width: w + 32,
			height: ph + 36,
			fill: style.backgroundEnd,
			opacity: .6
		});
		line([
			80,
			h * .035,
			1e3,
			h * .035
		], .85, 3);
		line([
			80,
			h * .975,
			1e3,
			h * .975
		], .7, 1.5);
		if (h > 1080) {
			line([
				80,
				h * .26,
				1e3,
				h * .26
			], .8, 1.5);
			line([
				84,
				h * .875,
				200,
				h * .875
			], .85, 4);
		}
	}
	if (style.template === "carbon") {
		rect({
			x: x - 12,
			y: y - 12,
			width: w + 24,
			height: ph + 24,
			fill: style.backgroundEnd,
			cornerRadius: 5
		});
		for (const [cx, cy, sx, sy] of [
			[
				x - 22,
				y - 22,
				1,
				1
			],
			[
				x + w + 22,
				y - 22,
				-1,
				1
			],
			[
				x - 22,
				y + ph + 22,
				1,
				-1
			],
			[
				x + w + 22,
				y + ph + 22,
				-1,
				-1
			]
		]) line([
			cx,
			cy + 36 * sy,
			cx,
			cy,
			cx + 36 * sx,
			cy
		], .8, 3);
		for (let i = 0; i < 12; i++) line([
			x + w - 110 + i * 9,
			y + ph + 37,
			x + w - 103 + i * 9,
			y + ph + 28
		], .4, 1.5);
	}
	if (style.template === "workbench") {
		rect({
			x: x - 24,
			y: y - 24,
			width: w + 48,
			height: ph + 48,
			fill: style.backgroundEnd,
			opacity: .6,
			cornerRadius: 8
		});
		for (let i = 0; i <= 18; i++) line([
			x + w * i / 18,
			y - 24,
			x + w * i / 18,
			y + ph + 24
		], .15, 1);
		for (let i = 0; i <= 10; i++) line([
			x - 24,
			y + ph * i / 10,
			x + w + 24,
			y + ph * i / 10
		], .15, 1);
		line([
			76,
			h * .235,
			1004,
			h * .235
		], .55, 1.5);
		line([
			80,
			h * .85,
			1e3,
			h * .85
		], .55, 1.5);
	}
	if (style.template === "ember") {
		const cx = x + w / 2;
		group.add(new Konva.Ellipse({
			x: cx,
			y: y + ph * .53,
			radiusX: w * .48,
			radiusY: ph * .54,
			fill: style.backgroundEnd,
			opacity: .6
		}));
		group.add(new Konva.Ellipse({
			x: cx,
			y: y + ph * .94,
			radiusX: w * .57,
			radiusY: ph * .075,
			fill: style.accentColor,
			opacity: .75
		}));
		polygon([
			x - w * .07,
			y + ph * .94,
			x + w * 1.07,
			y + ph * .94,
			x + w * 1.18,
			y + ph * 1.09,
			x - w * .18,
			y + ph * 1.09
		], style.backgroundEnd);
		line([
			x - w * .07,
			y + ph * .94,
			x + w * 1.07,
			y + ph * .94
		], .8, 2);
	}
	if (style.template === "confetti") {
		rect({
			x: x + w * .5,
			y: y + ph * .5,
			offsetX: w * .48,
			offsetY: ph * .5,
			width: w * .96,
			height: ph,
			rotation: 6,
			cornerRadius: 24,
			fill: style.backgroundEnd
		});
		group.add(new Konva.Circle({
			x: x + w * .12,
			y: y + ph * .56,
			radius: Math.min(w * .27, ph * .3),
			fill: style.accentColor
		}));
		rect({
			x: x + w * .78,
			y: y + ph * .01,
			width: 62,
			height: 62,
			rotation: 18,
			fill: style.accentColor,
			cornerRadius: 8
		});
		group.add(new Konva.Arc({
			x: x + w * .84,
			y: y + ph * .86,
			innerRadius: 34,
			outerRadius: 50,
			angle: 260,
			rotation: 15,
			fill: style.textColor,
			opacity: .7
		}));
	}
	if (panoramaStart(style.template) === "orbit") {
		group.add(new Konva.Ellipse({
			x: 1080,
			y: h * .52,
			radiusX: 650,
			radiusY: h * .36,
			fill: style.backgroundEnd,
			opacity: .65
		}));
		for (let i = 0; i < 4; i++) group.add(new Konva.Ellipse({
			x: 1080,
			y: h * .53,
			radiusX: 780 + i * 75,
			radiusY: h * (.23 + i * .045),
			rotation: -24,
			stroke: style.accentColor,
			strokeWidth: i === 2 ? 3 : 1.4,
			opacity: i === 2 ? .6 : .28
		}));
		group.add(new Konva.Circle({
			x: 350,
			y: h * .62,
			radius: Math.min(28, h * .025),
			fill: style.accentColor
		}));
		group.add(new Konva.Circle({
			x: 1820,
			y: h * .32,
			radius: Math.min(16, h * .015),
			fill: style.accentColor,
			opacity: .65
		}));
	}
	if (group.hasChildren()) layer.add(group);
	else group.destroy();
}
//#endregion
//#region src/rendering/pattern-decoration.ts
var patternIds = /* @__PURE__ */ new Set([
	"zest",
	"cabana",
	"contour",
	"cherry",
	"terracotta",
	"blueprint",
	"stitch",
	"parade"
]);
/** Bounded, deterministic vector patterns stay behind the product, clear of captions. */
function drawPatternDecoration(layer, style, h, panel) {
	if (!patternIds.has(style.template)) return;
	const verticalPadding = Math.min(28, h * .02);
	const x = Math.max(0, panel.x - 28), y = Math.max(0, panel.y - verticalPadding);
	const w = Math.min(1080 - x, panel.width + 56), ph = Math.min(h - y, panel.height + verticalPadding * 2);
	const group = new Konva.Group({
		x,
		y,
		listening: false,
		name: "template-decoration",
		clipX: 0,
		clipY: 0,
		clipWidth: w,
		clipHeight: ph
	});
	const rect = (attrs) => group.add(new Konva.Rect(attrs));
	const line = (points, opacity = .7, strokeWidth = 2) => group.add(new Konva.Line({
		points,
		stroke: style.accentColor,
		opacity,
		strokeWidth
	}));
	switch (style.template) {
		case "zest":
			rect({
				width: w,
				height: ph,
				fill: style.backgroundEnd,
				cornerRadius: [
					80,
					0,
					0,
					0
				]
			});
			for (let i = -5; i <= 10; i++) {
				const sx = i * w / 5;
				group.add(new Konva.Line({
					points: [
						sx,
						0,
						sx + w * .1,
						0,
						sx - w * .7,
						ph,
						sx - w * .8,
						ph
					],
					closed: true,
					fill: style.background,
					opacity: .72
				}));
			}
			break;
		case "cabana":
			rect({
				width: w,
				height: ph,
				fill: style.backgroundEnd,
				cornerRadius: 12
			});
			for (let i = 0; i < 7; i++) rect({
				x: i * w / 7,
				width: w / 14,
				height: ph,
				fill: style.background,
				opacity: .8
			});
			line([
				0,
				ph - 10,
				w,
				ph - 10
			], .6, 3);
			break;
		case "contour":
			rect({
				width: w,
				height: ph,
				fill: style.backgroundEnd,
				cornerRadius: [
					90,
					12,
					90,
					12
				]
			});
			for (let i = 0; i < 21; i++) {
				const t = .15 + i * .055;
				group.add(new Konva.Shape({
					stroke: style.accentColor,
					strokeWidth: i % 4 === 0 ? 2.5 : 1.5,
					opacity: .42,
					sceneFunc(ctx, shape) {
						ctx.beginPath();
						ctx.moveTo(w * (.5 - .42 * t), ph * .55);
						ctx.bezierCurveTo(w * (.5 - .7 * t), ph * (.55 - .3 * t), w * (.5 + .1 * t), ph * (.55 - .65 * t), w * (.5 + .38 * t), ph * (.55 - .3 * t));
						ctx.bezierCurveTo(w * (.5 + .7 * t), ph * (.55 - .08 * t), w * (.5 + .25 * t), ph * (.55 + .52 * t), w * (.5 - .08 * t), ph * (.55 + .43 * t));
						ctx.bezierCurveTo(w * (.5 - .55 * t), ph * (.55 + .45 * t), w * (.5 - .25 * t), ph * (.55 + .12 * t), w * (.5 - .42 * t), ph * .55);
						ctx.closePath();
						ctx.strokeShape(shape);
					}
				}));
			}
			break;
		case "cherry": {
			rect({
				width: w,
				height: ph,
				fill: style.backgroundEnd
			});
			const tile = Math.max(w / 7, ph / 14);
			for (let row = 0; row < Math.ceil(ph / tile); row++) for (let column = 0; column < Math.ceil(w / tile); column++) if ((row + column) % 2 === 0) rect({
				x: column * tile,
				y: row * tile,
				width: tile,
				height: tile,
				fill: style.background
			});
			break;
		}
		case "terracotta":
			for (const [cx, cy, rotation] of [[
				w * .16,
				ph * .95,
				-160
			], [
				w * .86,
				ph * .05,
				20
			]]) {
				const radius = Math.min(w * .95, ph * .7);
				group.add(new Konva.Wedge({
					x: cx,
					y: cy,
					radius,
					angle: 160,
					rotation,
					fill: style.backgroundEnd
				}));
				for (let i = 0; i < 16; i++) group.add(new Konva.Wedge({
					x: cx,
					y: cy,
					radius,
					angle: 4,
					rotation: rotation + i * 10,
					fill: style.accentColor,
					opacity: .75
				}));
			}
			break;
		case "blueprint": {
			rect({
				width: w,
				height: ph,
				fill: style.backgroundEnd
			});
			const grid = Math.max(40, Math.min(w, ph) / 10);
			for (let i = 0; i <= Math.ceil(w / grid); i++) line([
				i * grid,
				0,
				i * grid,
				ph
			], i % 5 === 0 ? .45 : .2, 1.5);
			for (let i = 0; i <= Math.ceil(ph / grid); i++) line([
				0,
				i * grid,
				w,
				i * grid
			], i % 5 === 0 ? .45 : .2, 1.5);
			line([
				18,
				34,
				w - 18,
				34
			], .85);
			line([
				w - 34,
				18,
				w - 34,
				ph - 18
			], .85);
			for (const cx of [22, w - 22]) line([
				cx - 8,
				46,
				cx + 8,
				22
			], .9, 3);
			for (const cy of [22, ph - 22]) line([
				w - 46,
				cy + 8,
				w - 22,
				cy - 8
			], .9, 3);
			break;
		}
		case "stitch": {
			rect({
				width: w,
				height: ph,
				fill: style.backgroundEnd,
				cornerRadius: 28,
				opacity: .55
			});
			const step = Math.max(22, ph / 28);
			for (const center of [w * .08, w * .92]) {
				for (const direction of [-1, 1]) {
					const points = [];
					for (let i = -1; i <= Math.ceil(ph / step); i++) points.push(center + (i % 2 ? 1 : -1) * 13 * direction, i * step);
					line(points, .85, 3);
				}
				line([
					center,
					0,
					center,
					ph
				], .25, 1);
			}
			break;
		}
		case "parade": for (let row = 0; row < 6; row++) {
			const top = ph * (.03 + row * .17);
			group.add(new Konva.Shape({
				fill: row % 2 ? style.accentColor : style.backgroundEnd,
				opacity: row % 2 ? .78 : 1,
				sceneFunc(ctx, shape) {
					ctx.beginPath();
					ctx.moveTo(-w * .3, top);
					for (let column = -1; column < 4; column++) {
						const sx = column * w / 3;
						ctx.bezierCurveTo(sx + w / 12, top + ph * .11, sx + w / 4, top + ph * .11, sx + w / 3, top);
					}
					ctx.lineTo(w * 1.3, ph + 10);
					ctx.lineTo(-w * .3, ph + 10);
					ctx.closePath();
					ctx.fillStrokeShape(shape);
				}
			}));
		}
	}
	layer.add(group);
}
//#endregion
//#region src/rendering/panorama-decoration.ts
function polygon(group, points, fill, opacity = 1) {
	group.add(new Konva.Line({
		points,
		closed: true,
		fill,
		opacity,
		listening: false
	}));
}
/** A shallow solid with a lit top, shaded front and darker side. */
function block(group, x, y, w, depth, rise, color) {
	polygon(group, [
		x,
		y,
		x + w,
		y,
		x + w + depth,
		y - depth * .45,
		x + depth,
		y - depth * .45
	], color);
	polygon(group, [
		x,
		y,
		x + w,
		y,
		x + w,
		y + rise,
		x,
		y + rise
	], color);
	polygon(group, [
		x,
		y,
		x + w,
		y,
		x + w,
		y + rise,
		x,
		y + rise
	], "#101820", .17);
	polygon(group, [
		x + w,
		y,
		x + w + depth,
		y - depth * .45,
		x + w + depth,
		y + rise - depth * .45,
		x + w,
		y + rise
	], color);
	polygon(group, [
		x + w,
		y,
		x + w + depth,
		y - depth * .45,
		x + w + depth,
		y + rise - depth * .45,
		x + w,
		y + rise
	], "#101820", .32);
	group.add(new Konva.Line({
		points: [
			x,
			y,
			x + w,
			y,
			x + w + depth,
			y - depth * .45
		],
		stroke: "#FFFFFF",
		opacity: .35,
		strokeWidth: 2
	}));
}
/** Deterministic spread coordinates keep decorative edges continuous across exports. */
function drawPanoramaDecoration(layer, style, h) {
	const id = collectionPanoramaId(style.template);
	if (!id) return;
	const group = new Konva.Group({
		x: isPanoramaEnd(style.template) ? -1080 : 0,
		listening: false,
		name: "panorama-collection-decoration"
	});
	const wide = h <= 1080;
	if (id === "atrium") {
		group.add(new Konva.Rect({
			x: 0,
			y: h * .58,
			width: 2160,
			height: h * .42,
			fill: style.backgroundEnd,
			opacity: .3
		}));
		polygon(group, [
			800,
			0,
			1450,
			0,
			1050,
			h,
			220,
			h
		], "#FFFFFF", .24);
		polygon(group, [
			1430,
			h * .63,
			1970,
			h,
			790,
			h,
			660,
			h * .85
		], style.accentColor, .14);
		const x = 1100, y = h * .86, rx = 470, ry = h * .07, rise = h * .07;
		group.add(new Konva.Ellipse({
			x,
			y: y + rise,
			radiusX: rx,
			radiusY: ry,
			fill: style.accentColor
		}));
		group.add(new Konva.Rect({
			x: 630,
			y,
			width: rx * 2,
			height: rise,
			fillLinearGradientStartPoint: {
				x: 0,
				y: 0
			},
			fillLinearGradientEndPoint: {
				x: rx * 2,
				y: 0
			},
			fillLinearGradientColorStops: [
				0,
				style.backgroundEnd,
				.6,
				style.accentColor,
				1,
				style.backgroundEnd
			]
		}));
		group.add(new Konva.Ellipse({
			x,
			y,
			radiusX: rx,
			radiusY: ry,
			fill: style.backgroundEnd,
			stroke: "#FFFFFF",
			strokeWidth: 2
		}));
		group.add(new Konva.Ellipse({
			x: 1115,
			y: y - 10,
			radiusX: 270,
			radiusY: ry * .4,
			fill: style.textColor,
			opacity: .1
		}));
		group.add(new Konva.Line({
			points: [
				0,
				h * .58,
				2160,
				h * .58
			],
			stroke: style.accentColor,
			opacity: .2,
			strokeWidth: 2
		}));
	} else if (id === "obsidian") {
		polygon(group, [
			450,
			0,
			1600,
			0,
			1340,
			h,
			740,
			h
		], style.backgroundEnd, .22);
		polygon(group, [
			980,
			h * .72,
			1910,
			h,
			910,
			h,
			520,
			h * .93
		], "#000000", .35);
		block(group, 620, h * .86, 720, Math.min(280, h * .25), h * .065, style.backgroundEnd);
		for (let i = 0; i < 6; i++) group.add(new Konva.Line({
			points: [
				720 + i * 180,
				h * .67,
				250 + i * 330,
				h
			],
			stroke: style.accentColor,
			opacity: .08,
			strokeWidth: 1.5
		}));
		group.add(new Konva.Line({
			points: [
				80,
				h * .52,
				420,
				h * .52
			],
			stroke: style.accentColor,
			opacity: .65,
			strokeWidth: 3
		}));
	} else if (id === "offset") {
		const start = wide ? .64 : .75;
		for (let i = 0; i < 3; i++) block(group, 220 + i * 130, h * (start + i * .07), (wide ? 1200 : 1270) - i * 160, Math.min(240, h * .22), h * .09, i === 0 ? style.accentColor : style.backgroundEnd);
		group.add(new Konva.Circle({
			x: 1870,
			y: h * (wide ? .2 : .52),
			radius: Math.min(88, h * .065),
			fill: style.accentColor
		}));
		group.add(new Konva.Circle({
			x: 1870,
			y: h * (wide ? .2 : .52),
			radius: Math.min(88, h * .065),
			fillRadialGradientStartPoint: {
				x: -30,
				y: -30
			},
			fillRadialGradientStartRadius: 0,
			fillRadialGradientEndPoint: {
				x: 12,
				y: 12
			},
			fillRadialGradientEndRadius: 120,
			fillRadialGradientColorStops: [
				0,
				"#FFFFFF80",
				.4,
				"#FFFFFF00",
				1,
				"#10182050"
			]
		}));
	} else if (id === "signal") {
		polygon(group, [
			-100,
			h * .78,
			2260,
			h * .37,
			2260,
			h * .98,
			-100,
			h * 1.39
		], style.backgroundEnd);
		polygon(group, [
			-100,
			h * .98,
			2260,
			h * .57,
			2260,
			h * .62,
			-100,
			h * 1.03
		], style.accentColor);
		group.add(new Konva.Circle({
			x: 310,
			y: h * (wide ? .77 : .55),
			radius: Math.min(150, h * .09),
			stroke: style.accentColor,
			strokeWidth: Math.min(22, h * .013)
		}));
		for (let i = 0; !wide && i < 4; i++) group.add(new Konva.Line({
			points: [
				1760 + i * 42,
				h * .79,
				1810 + i * 42,
				h * .73
			],
			stroke: style.textColor,
			strokeWidth: 10,
			opacity: .65
		}));
	} else if (id === "mosaic") {
		const tile = 240, top = h * (wide ? .03 : .045), tileH = h * (wide ? .16 : .13);
		for (let row = 0; row < 5; row++) for (let col = 0; col < 10; col++) if ((row + col) % 2 === 0) group.add(new Konva.Rect({
			x: col * tile - 120,
			y: top + row * tileH,
			width: tile,
			height: tileH,
			fill: style.backgroundEnd,
			opacity: row % 2 ? .24 : .42,
			cornerRadius: (row + col) % 4 ? [
				0,
				80,
				0,
				80
			] : 0
		}));
		group.add(new Konva.Ellipse({
			x: 1080,
			y: h * .4,
			radiusX: 560,
			radiusY: h * .34,
			fill: style.background
		}));
		group.add(new Konva.Line({
			points: [
				80,
				h * .73,
				2080,
				h * .73
			],
			stroke: style.accentColor,
			strokeWidth: 2,
			opacity: .35
		}));
	} else if (id === "folio") {
		const paper = {
			x: 710,
			y: h * .07,
			width: 860,
			height: h * .86
		};
		group.add(new Konva.Rect({
			...paper,
			x: paper.x + 38,
			y: paper.y + 34,
			fill: style.accentColor,
			opacity: .22,
			rotation: -4
		}));
		group.add(new Konva.Rect({
			...paper,
			fill: style.backgroundEnd,
			rotation: 2
		}));
		group.add(new Konva.Line({
			points: [
				80,
				h * .05,
				2080,
				h * .05
			],
			stroke: style.accentColor,
			strokeWidth: 2,
			opacity: .6
		}));
		group.add(new Konva.Line({
			points: [
				80,
				h * .955,
				2080,
				h * .955
			],
			stroke: style.accentColor,
			strokeWidth: 2,
			opacity: .6
		}));
		group.add(new Konva.Circle({
			x: 1920,
			y: h * .3,
			radius: Math.min(100, h * .1),
			stroke: style.accentColor,
			strokeWidth: 2,
			opacity: .5
		}));
	}
	layer.add(group);
}
//#endregion
//#region src/rendering/template-decoration.ts
/** All paths use spread coordinates, including the off-canvas half of a panorama. */
function drawExpressiveDecoration(layer, style, h, panel) {
	const family = panoramaStart(style.template);
	const group = new Konva.Group({
		x: isPanoramaEnd(style.template) ? -1080 : 0,
		listening: false,
		name: "template-decoration"
	});
	const wide = h <= 1080;
	if (family === "daybreak") {
		group.add(new Konva.Circle({
			x: 260,
			y: h * .52,
			radius: Math.min(140, h * .085),
			fill: style.backgroundEnd,
			opacity: .28
		}));
		for (let i = 0; i < 4; i++) group.add(new Konva.Shape({
			fillLinearGradientStartPoint: {
				x: 0,
				y: 0
			},
			fillLinearGradientEndPoint: {
				x: 2160,
				y: h
			},
			fillLinearGradientColorStops: [
				0,
				i < 2 ? style.backgroundEnd : style.accentColor,
				1,
				i === 0 ? style.backgroundEnd : style.accentColor
			],
			opacity: [
				.68,
				.82,
				.48,
				1
			][i],
			sceneFunc(ctx, shape) {
				const y = h * (.6 + i * .1);
				ctx.beginPath();
				ctx.moveTo(-10, y);
				for (let segment = 0; segment < 4; segment++) {
					const x = segment * 600 - 10;
					const swing = (segment % 2 === 0 ? -1 : 1) * h * (.18 - i * .025);
					ctx.bezierCurveTo(x + 180, y + swing, x + 420, y + swing, x + 600, y);
				}
				ctx.lineTo(2400, h + 10);
				ctx.lineTo(-10, h + 10);
				ctx.closePath();
				ctx.fillStrokeShape(shape);
			}
		}));
	}
	if (family === "tidal") {
		group.add(new Konva.Shape({
			fill: style.backgroundEnd,
			sceneFunc(ctx, shape) {
				ctx.beginPath();
				ctx.moveTo(0, h * .64);
				ctx.bezierCurveTo(680, h * .27, 1420, h * 1.04, 2160, h * .46);
				ctx.lineTo(2160, h);
				ctx.lineTo(0, h);
				ctx.closePath();
				ctx.fillStrokeShape(shape);
			}
		}));
		for (let i = 0; i < 22; i++) group.add(new Konva.Shape({
			stroke: style.accentColor,
			strokeWidth: i % 5 === 0 ? 2.2 : 1.2,
			opacity: .22 + i % 4 * .04,
			sceneFunc(ctx, shape) {
				const y = h * (.51 + i * .024);
				ctx.beginPath();
				ctx.moveTo(-20, y);
				ctx.bezierCurveTo(640, y - h * .4, 1450, y + h * .45, 2180, y - h * .13);
				ctx.strokeShape(shape);
			}
		}));
	}
	if (style.template === "bloom") {
		const x = wide ? panel.x - 12 : 145;
		const width = wide ? panel.width + 24 : 790;
		const y = wide ? h * .065 : h * .305;
		group.add(new Konva.Rect({
			x,
			y,
			width,
			height: h - y + 20,
			cornerRadius: [
				width / 2,
				width / 2,
				0,
				0
			],
			fill: style.backgroundEnd
		}));
		for (const mirror of [false, true]) {
			const branch = new Konva.Group({
				x: mirror ? 1080 : wide ? panel.x - 60 : 0,
				y: h,
				scaleX: mirror ? -1 : 1,
				scaleY: Math.min(1.5, h / 1920)
			});
			branch.add(new Konva.Path({
				data: "M 15 50 C 230 -210 50 -410 195 -670",
				stroke: style.accentColor,
				strokeWidth: 3,
				opacity: .7
			}));
			for (let i = 0; i < 6; i++) {
				const leaf = new Konva.Group({
					x: 65 + i * 20,
					y: -70 - i * 100,
					rotation: i % 2 ? -38 : 53
				});
				leaf.add(new Konva.Path({
					data: "M 0 0 C -76 -30 -84 -110 -20 -178 C 46 -134 62 -59 0 0 Z",
					fill: style.accentColor,
					opacity: i % 2 ? .44 : .72
				}));
				leaf.add(new Konva.Path({
					data: "M 0 0 Q -17 -81 -20 -160",
					stroke: style.background,
					strokeWidth: 1.5,
					opacity: .5
				}));
				branch.add(leaf);
			}
			group.add(branch);
		}
	}
	if (style.template === "punch") {
		const x = wide ? panel.x - 10 : 60;
		const width = wide ? panel.width + 20 : 960;
		const y = wide ? h * .04 : h * .32;
		group.add(new Konva.Rect({
			x: x + 22,
			y: y + 22,
			width,
			height: h - y + 20,
			cornerRadius: [
				width / 2,
				width / 2,
				0,
				0
			],
			fill: style.accentColor
		}));
		group.add(new Konva.Rect({
			x,
			y,
			width,
			height: h - y + 20,
			cornerRadius: [
				width / 2,
				width / 2,
				0,
				0
			],
			fill: style.backgroundEnd
		}));
		group.add(new Konva.Rect({
			x: x + 22,
			y: y + 24,
			width: width - 44,
			height: h - y,
			cornerRadius: [
				(width - 44) / 2,
				(width - 44) / 2,
				0,
				0
			],
			stroke: style.background,
			strokeWidth: 2.5
		}));
	}
	if (group.hasChildren()) layer.add(group);
	else group.destroy();
}
/** Vector-only decoration shares the export scene and stays crisp at every size. */
function drawTemplateDecoration(layer, style, canvas, panel) {
	const h = canvas.height;
	drawBannerDecoration(layer, style, panel);
	drawCompositionDecoration(layer, style, panel);
	drawHolidayDecoration(layer, style, h, panel);
	drawHalloweenDecoration(layer, style, h, panel);
	drawShowcaseDecoration(layer, style, h, panel);
	drawPatternDecoration(layer, style, h, panel);
	drawExpressiveDecoration(layer, style, h, panel);
	drawPanoramaDecoration(layer, style, h);
	if (style.template === "studio") {
		const inset = Math.min(32, h * .04);
		layer.add(new Konva.Rect({
			x: inset,
			y: inset,
			width: canvas.width - inset * 2,
			height: h - inset * 2,
			stroke: style.accentColor,
			strokeWidth: 1.5,
			opacity: .5,
			listening: false
		}));
		layer.add(new Konva.Rect({
			x: panel.x,
			y: panel.y + panel.height * .28,
			width: panel.width,
			height: panel.height * .72,
			fill: style.backgroundEnd,
			cornerRadius: Math.min(24, h * .025),
			listening: false
		}));
	}
	if (style.template === "split") layer.add(new Konva.Line({
		points: h <= 1080 ? [
			420,
			0,
			1080,
			0,
			1080,
			h,
			530,
			h
		] : [
			0,
			h * .39,
			1080,
			h * .345,
			1080,
			h,
			0,
			h
		],
		fill: style.backgroundEnd,
		closed: true,
		listening: false
	}));
	if (style.template === "halo") {
		const radius = Math.min(panel.width * .54, panel.height * .5);
		const center = {
			x: panel.x + panel.width / 2,
			y: panel.y + panel.height / 2
		};
		layer.add(new Konva.Circle({
			...center,
			radius,
			fill: style.backgroundEnd,
			listening: false
		}));
		layer.add(new Konva.Circle({
			...center,
			radius: radius * 1.1,
			stroke: style.accentColor,
			strokeWidth: 1.5,
			opacity: .45,
			listening: false
		}));
	}
	if (style.template === "gallery") {
		layer.add(new Konva.Rect({
			x: panel.x - 20,
			y: panel.y - h * .015,
			width: panel.width + 40,
			height: panel.height + h * .03,
			fill: style.backgroundEnd,
			listening: false
		}));
		layer.add(new Konva.Line({
			points: [
				80,
				h * .735,
				1e3,
				h * .735
			],
			stroke: style.accentColor,
			strokeWidth: 2,
			listening: false
		}));
	}
}
//#endregion
//#region src/rendering/snap-guides.ts
/** All positions are in scene coordinates, including the cropped half of a panorama. */
function canvasGuideTargets(width, height, tiles = 1, cropOffset = 0) {
	const margin = Math.min(80, width * .08, height * .08);
	const targets = [];
	for (let tile = 0; tile < tiles; tile++) for (const x of [
		width / 2,
		margin,
		width - margin,
		0,
		width
	]) targets.push({
		axis: "x",
		position: tile * width + x - cropOffset,
		start: 0,
		end: height
	});
	for (const y of [
		height / 2,
		margin,
		height - margin,
		0,
		height
	]) targets.push({
		axis: "y",
		position: y,
		start: -cropOffset,
		end: width * tiles - cropOffset
	});
	return targets;
}
function objectGuideTargets(rect) {
	return [...[
		rect.x + rect.width / 2,
		rect.x,
		rect.x + rect.width
	].map((position) => ({
		axis: "x",
		position,
		start: rect.y,
		end: rect.y + rect.height
	})), ...[
		rect.y + rect.height / 2,
		rect.y,
		rect.y + rect.height
	].map((position) => ({
		axis: "y",
		position,
		start: rect.x,
		end: rect.x + rect.width
	}))];
}
/** At most one match per axis, nearest first. Threshold is supplied in scene units. */
function snapToGuides(rect, targets, threshold) {
	const result = {
		x: 0,
		y: 0,
		guides: []
	};
	for (const axis of ["x", "y"]) {
		const size = axis === "x" ? rect.width : rect.height;
		const anchors = [
			rect[axis] + size / 2,
			rect[axis],
			rect[axis] + size
		];
		let match;
		for (const target of targets) {
			if (target.axis !== axis) continue;
			for (const anchor of anchors) {
				const delta = target.position - anchor;
				if (Math.abs(delta) <= threshold && (!match || Math.abs(delta) < Math.abs(match.delta))) match = {
					delta,
					target
				};
			}
		}
		if (match) {
			result[axis] = match.delta;
			const cross = axis === "x" ? rect.y : rect.x;
			const span = axis === "x" ? rect.height : rect.width;
			result.guides.push({
				...match.target,
				start: Math.min(match.target.start, cross),
				end: Math.max(match.target.end, cross + span)
			});
		}
	}
	return result;
}
//#endregion
//#region src/rendering/scene-guides.ts
/** Measure the composition box, excluding selection outlines, shadows and camera details. */
function bounds(group) {
	const box = group.getAttr("guideBounds");
	const transform = group.getTransform();
	const corners = [
		{
			x: box.x,
			y: box.y
		},
		{
			x: box.x + box.width,
			y: box.y
		},
		{
			x: box.x,
			y: box.y + box.height
		},
		{
			x: box.x + box.width,
			y: box.y + box.height
		}
	].map((point) => transform.point(point));
	const x = Math.min(...corners.map((point) => point.x));
	const y = Math.min(...corners.map((point) => point.y));
	return {
		x,
		y,
		width: Math.max(...corners.map((point) => point.x)) - x,
		height: Math.max(...corners.map((point) => point.y)) - y
	};
}
/** Only installed on interactive scenes. Nothing here is serialized or exported. */
function attachSceneGuides(layer, canvas, tiles, cropOffset) {
	const objects = layer.getChildren().filter((node) => node instanceof Konva.Group && Boolean(node.getAttr("guideBounds")));
	const overlay = new Konva.Group({
		name: "smart-guides",
		listening: false
	});
	layer.add(overlay);
	const clear = () => {
		overlay.destroyChildren();
		layer.batchDraw();
	};
	for (const object of objects) {
		object.on("dragmove.guides", (event) => {
			overlay.destroyChildren();
			if ("altKey" in event.evt && event.evt.altKey) {
				layer.batchDraw();
				return;
			}
			const scale = Math.max(.01, Math.abs(layer.getStage()?.scaleX() ?? 1));
			const targets = [...canvasGuideTargets(canvas.width, canvas.height, tiles, cropOffset), ...objects.filter((other) => other !== object).flatMap((other) => objectGuideTargets(bounds(other)))];
			const snap = snapToGuides(bounds(object), targets, 6 / scale);
			object.position({
				x: object.x() + snap.x,
				y: object.y() + snap.y
			});
			for (const guide of snap.guides) {
				const points = guide.axis === "x" ? [
					guide.position,
					guide.start,
					guide.position,
					guide.end
				] : [
					guide.start,
					guide.position,
					guide.end,
					guide.position
				];
				for (const [stroke, strokeWidth] of [["#ffffff", 3], ["#a3422d", 1]]) overlay.add(new Konva.Line({
					points,
					stroke,
					strokeWidth,
					strokeScaleEnabled: false,
					listening: false
				}));
			}
			overlay.moveToTop();
			layer.batchDraw();
		});
		object.on("dragend.guides", clear);
	}
}
//#endregion
//#region src/core/device-placement.ts
/** A complete turn has the same persisted angle, regardless of drag direction. */
function normalizeDeviceRotation(degrees) {
	return ((degrees + 180) % 360 + 360) % 360 - 180;
}
//#endregion
//#region src/rendering/device-resize.ts
/** Editor-only handles. The rendered device scales live; one placement is committed on release. */
function attachDeviceResize(layer, phone, device, cropOffset, onCommit, onSelect, rotationEnabled = false) {
	const footprint = new Konva.Rect({
		width: device.width,
		height: device.height,
		fill: "rgba(0,0,0,0)",
		name: "device-hitbox"
	});
	phone.add(footprint);
	phone.getClientRect = (config) => footprint.getClientRect(config);
	const handles = new Konva.Transformer({
		name: "device-transformer",
		visible: false,
		nodes: [phone],
		enabledAnchors: [
			"top-left",
			"top-right",
			"bottom-left",
			"bottom-right"
		],
		rotateEnabled: rotationEnabled,
		rotateAnchorOffset: 32,
		rotateAnchorCursor: "grab",
		rotationSnaps: [
			0,
			45,
			90,
			135,
			180,
			225,
			270,
			315
		],
		rotationSnapTolerance: 3,
		flipEnabled: false,
		keepRatio: true,
		shiftBehavior: "none",
		ignoreStroke: true,
		anchorSize: 14,
		anchorCornerRadius: 3,
		anchorFill: "#FFFEF8",
		anchorStroke: "#547449",
		anchorStrokeWidth: 2,
		anchorStyleFunc: (anchor) => {
			anchor.hitStrokeWidth(30);
			if (anchor.hasName("rotater")) anchor.cornerRadius(7);
		},
		borderStroke: "#547449",
		borderStrokeWidth: 1.5,
		boundBoxFunc(oldBox, box) {
			const scale = Math.abs(phone.getStage()?.scaleX() ?? 1);
			const width = box.width / scale;
			return Number.isFinite(width) && width >= PLACEMENT_LIMITS.width.min && width <= PLACEMENT_LIMITS.width.max && box.height > 0 ? box : oldBox;
		}
	});
	layer.add(handles);
	handles.on("visibleChange.rotation", () => {
		const stage = phone.getStage();
		if (!rotationEnabled || !handles.visible() || !stage) return;
		const scale = Math.abs(phone.getAbsoluteScale().x);
		if (!scale) return;
		const transform = phone.getAbsoluteTransform();
		let best = {
			angle: 0,
			offset: 32,
			clearance: -Infinity
		};
		for (const offset of [32, -24]) {
			const distance = offset / scale;
			const candidates = [
				{
					angle: 0,
					x: device.width / 2,
					y: -distance
				},
				{
					angle: 90,
					x: device.width + distance,
					y: device.height / 2
				},
				{
					angle: 180,
					x: device.width / 2,
					y: device.height + distance
				},
				{
					angle: 270,
					x: -distance,
					y: device.height / 2
				}
			];
			for (const candidate of candidates) {
				const point = transform.point(candidate);
				const clearance = Math.min(point.x, point.y, stage.width() - point.x, stage.height() - point.y) - 22;
				if (clearance > best.clearance) best = {
					angle: candidate.angle,
					offset,
					clearance
				};
				if (clearance >= 0) break;
			}
			if (best.clearance >= 0) break;
		}
		handles.rotateAnchorAngle(best.angle);
		handles.rotateAnchorOffset(best.offset);
	});
	let initialRotation = phone.rotation();
	phone.on("transformstart.resize", () => {
		initialRotation = phone.rotation();
		onSelect();
		phone.getStage()?.container().parentElement?.focus({ preventScroll: true });
	});
	phone.on("transformend.resize", () => {
		const resized = Math.abs(phone.scaleX() - 1) >= 1e-7;
		const rotated = rotationEnabled && Math.abs(normalizeDeviceRotation(phone.rotation() - initialRotation)) >= 1e-7;
		if (!resized && !rotated) return;
		const width = resized ? Math.round(device.width * phone.scaleX()) : device.width;
		const height = device.height * width / device.width;
		onCommit({
			x: phone.x() - width / 2 + cropOffset,
			y: phone.y() - height / 2,
			width,
			...rotated ? { rotation: normalizeDeviceRotation(Math.round(phone.rotation())) } : {}
		});
	});
	return handles;
}
//#endregion
//#region src/rendering/scene.ts
/** Selection is editor-only; export scenes contain no outlines or event handlers. */
function selectSceneElement(layer, element, shotId) {
	layer.setAttr("selectedElement", element);
	layer.setAttr("selectedShotId", shotId);
	layer.find(".device-transformer").forEach((node) => {
		const selected = node.getAttr("element") === element && node.getAttr("shotId") === shotId;
		node.visible(selected);
		if (selected) node.moveToTop();
	});
	layer.find(".selection-outline").forEach((node) => node.visible(node.getAttr("element") === element && node.getAttr("shotId") === shotId));
	layer.batchDraw();
}
function makeMovable(group, element, options, shotId) {
	group.draggable(true);
	group.on("mouseenter", () => {
		const container = group.getStage()?.container();
		if (container) container.style.cursor = "grab";
		group.findOne(".selection-outline")?.show();
	});
	group.on("mousedown touchstart", () => {
		selectSceneElement(group.getLayer(), element, shotId);
		options.onSelectElement?.(element, shotId);
		const container = group.getStage()?.container();
		if (container) {
			container.style.cursor = "grabbing";
			container.parentElement?.focus({ preventScroll: true });
		}
	});
	group.on("mouseup touchend", () => {
		const container = group.getStage()?.container();
		if (container) container.style.cursor = "grab";
	});
	group.on("mouseleave", () => {
		const container = group.getStage()?.container();
		if (container) container.style.cursor = "";
		if (group.getLayer()?.getAttr("selectedElement") !== element || group.getLayer()?.getAttr("selectedShotId") !== shotId) group.findOne(".selection-outline")?.hide();
	});
}
/** Keep punctuation with its word while allowing natural breaks in unspaced scripts. */
function captionWords(text) {
	const words = [];
	for (const part of new Intl.Segmenter(void 0, { granularity: "word" }).segment(text)) if (part.isWordLike) words.push(part.segment);
	else if (part.segment.trim() && words.length) words[words.length - 1] += part.segment;
	return words;
}
function addText(layer, text, options) {
	if (!text.trim()) return;
	const lines = text.split("\n");
	let last = lines.length - 1;
	while (last > 0 && !lines[last].trim()) last--;
	const nodes = lines.map((line, index) => new Konva.Text({
		x: 0,
		width: options.width,
		text: line || " ",
		fontFamily: options.fontFamily ?? "Manrope",
		fontStyle: options.weight,
		fontSize: options.fontSize,
		lineHeight: options.lineHeight ?? 1.15,
		fill: index === last && options.accent ? options.accent : options.color,
		align: options.align,
		opacity: options.opacity ?? 1,
		wrap: "word",
		listening: Boolean(options.interaction.onTextMove)
	}));
	const height = () => nodes.reduce((sum, node) => sum + node.height(), 0);
	const words = options.fitWords ? captionWords(text) : [];
	const fits = () => height() <= options.height && words.every((word) => nodes[0].measureSize(word).width <= options.width);
	while (!fits() && nodes[0].fontSize() > 8) nodes.forEach((node) => node.fontSize(node.fontSize() - 1));
	if (!fits()) {
		nodes.forEach((node) => node.destroy());
		throw new Error("This caption is too long to fit. Shorten it before exporting.");
	}
	const group = new Konva.Group({
		x: options.x + options.offset.x,
		y: options.y + options.offset.y,
		name: `caption-${options.element}`,
		shotId: options.shotId,
		guideBounds: {
			x: 0,
			y: 0,
			width: options.width,
			height: height()
		}
	});
	let y = 0;
	for (const node of nodes) {
		node.y(y);
		y += node.height();
		group.add(node);
	}
	if (options.interaction.onTextMove) {
		group.add(new Konva.Rect({
			x: -8,
			y: -8,
			width: options.width + 16,
			height: height() + 16,
			stroke: "#547449",
			strokeWidth: 2,
			strokeScaleEnabled: false,
			dash: [7, 5],
			listening: false,
			visible: false,
			name: "selection-outline",
			element: options.element,
			shotId: options.shotId
		}));
		makeMovable(group, options.element, options.interaction, options.shotId);
		group.on("dragend", () => options.interaction.onTextMove?.(options.element, group.x() - options.x, group.y() - options.y, options.shotId));
	}
	layer.add(group);
}
/** Shared by Artboard and PNG export. Coordinates use a 1080-wide document at the selected export aspect ratio. */
function createScene(project, shot, image, options = {}) {
	const style = resolveStyle(project, shot);
	const fitWords = !legacyTemplateIds.some((id) => id === style.template);
	const template = templateLayout(project, style);
	const canvas = canonicalCanvas(project);
	const panoramic = isPanoramaTemplate(style.template);
	const cropOffset = isPanoramaEnd(style.template) ? canvas.width : 0;
	const spreadWidth = panoramic ? canvas.width * 2 : canvas.width;
	const imageWidth = image?.naturalWidth ?? 0;
	const imageHeight = image?.naturalHeight ?? 0;
	if (shot.assetId !== null && (!image?.complete || imageWidth <= 0 || imageHeight <= 0)) throw new Error("The screenshot has not finished loading.");
	if (!Number.isFinite(shot.phone.x) || !Number.isFinite(shot.phone.y)) throw new Error("The device position is invalid.");
	const layer = new Konva.Layer({ listening: Boolean(options.onMove || options.onTextMove || options.onResize) });
	try {
		if (resolveExportProfile(project).sourceOnly) {
			layer.add(new Konva.Rect({
				...canvas,
				fill: "#000000",
				listening: false
			}));
			if (shot.assetId === null) return layer;
			const scale = Math.min(canvas.width / imageWidth, canvas.height / imageHeight);
			layer.add(new Konva.Image({
				image,
				width: imageWidth * scale,
				height: imageHeight * scale,
				x: (canvas.width - imageWidth * scale) / 2,
				y: (canvas.height - imageHeight * scale) / 2,
				listening: false
			}));
			return layer;
		}
		layer.add(new Konva.Rect({
			...canvas,
			fill: "#F4F1E9",
			listening: false
		}));
		layer.add(new Konva.Rect({
			...canvas,
			x: -cropOffset,
			width: spreadWidth,
			...style.backgroundMode === "gradient" ? {
				fillLinearGradientStartPoint: {
					x: 0,
					y: 0
				},
				fillLinearGradientEndPoint: {
					x: panoramic ? spreadWidth : 880,
					y: canvas.height
				},
				fillLinearGradientColorStops: [
					0,
					style.background,
					1,
					style.backgroundEnd
				]
			} : { fill: style.background },
			listening: false
		}));
		if (style.texture === "dots") layer.add(new Konva.Shape({
			listening: false,
			fill: style.textColor,
			x: -cropOffset,
			opacity: .1,
			sceneFunc(context, shape) {
				context.beginPath();
				for (let x = 28; x < spreadWidth; x += 44) for (let y = 26; y < canvas.height; y += 44) {
					context.moveTo(x + 1.8, y);
					context.arc(x, y, 1.8, 0, Math.PI * 2);
				}
				context.fillStrokeShape(shape);
			}
		}));
		if (style.template === "tilt") layer.add(new Konva.Line({
			points: [
				-90,
				canvas.height * .625,
				1170,
				canvas.height * (940 / 1920),
				1170,
				canvas.height * (1540 / 1920),
				-90,
				canvas.height * .9375
			],
			closed: true,
			fill: style.accentColor,
			opacity: .09,
			listening: false
		}));
		if (style.template === "editorial") layer.add(new Konva.Rect({
			...template.panel,
			cornerRadius: [
				Math.min(160, canvas.height * .1),
				Math.min(160, canvas.height * .1),
				32,
				32
			],
			fill: style.backgroundEnd,
			listening: false
		}));
		if (panoramaStart(style.template) === "panorama") {
			layer.add(new Konva.Line({
				x: -cropOffset,
				points: [
					-120,
					canvas.height * .72,
					2280,
					canvas.height * .2,
					2280,
					canvas.height * .45,
					-120,
					canvas.height * .97
				],
				closed: true,
				fill: style.backgroundEnd,
				listening: false
			}));
			layer.add(new Konva.Line({
				x: -cropOffset,
				points: [
					-120,
					canvas.height * .72 - 24,
					2280,
					canvas.height * .2 - 24
				],
				stroke: style.accentColor,
				strokeWidth: 2,
				opacity: .4,
				listening: false
			}));
		}
		drawTemplateDecoration(layer, style, canvas, template.panel);
		if (shot.backgroundImage) {
			const background = options.images?.get(shot.backgroundImage.assetId);
			if (!background?.complete || background.naturalWidth <= 0 || background.naturalHeight <= 0) throw new Error("The background image has not finished loading.");
			const box = fitImage(background.naturalWidth, background.naturalHeight, {
				x: -cropOffset,
				y: 0,
				width: spreadWidth,
				height: canvas.height
			}, shot.backgroundImage.fit);
			layer.add(new Konva.Image({
				...box,
				image: background,
				opacity: shot.backgroundImage.opacity,
				listening: false,
				name: "background-image"
			}));
		}
		const deviceNodes = [];
		const elements = ["device", ...(shot.companions ?? []).map((device) => `device:${device.id}`)];
		for (const element of elements) {
			const slot = deviceShot(shot, element);
			const style = resolveStyle(project, slot);
			const source = slot.assetId === shot.assetId ? image : options.images?.get(slot.assetId ?? "");
			const empty = slot.assetId === null;
			if (empty && !options.emptyDeviceLabel) continue;
			if (!empty && (!source?.complete || source.naturalWidth <= 0 || source.naturalHeight <= 0)) throw new Error("The screenshot has not finished loading.");
			const imageWidth = source?.naturalWidth ?? 0, imageHeight = source?.naturalHeight ?? 0;
			const device = deviceGeometry(style.device, slot.phone.width, style.frame, style.deviceOrientation);
			const phone = new Konva.Group({
				x: slot.phone.x + device.width / 2 - cropOffset,
				y: slot.phone.y + device.height / 2,
				offsetX: device.width / 2,
				offsetY: device.height / 2,
				rotation: slot.phone.rotation,
				width: device.width,
				height: device.height,
				draggable: Boolean(options.onMove),
				name: element === "device" ? "phone scene-device" : "scene-device",
				element,
				shotId: shot.id,
				guideBounds: {
					x: 0,
					y: 0,
					width: device.width,
					height: device.height
				}
			});
			const banner = isBannerProfile(project.exportProfile);
			const face = banner ? phone : deviceFace(phone, device, style.template);
			if (!banner) drawDeviceFrame(face, device);
			const screen = new Konva.Group({ clipFunc(context) {
				context.beginPath();
				context.roundRect(device.screen.x, device.screen.y, device.screen.width, device.screen.height, device.screen.radius);
				context.closePath();
			} });
			screen.add(new Konva.Rect({
				...device.screen,
				fill: banner ? "rgba(0,0,0,0)" : "#FFFFFF"
			}));
			if (empty) {
				screen.add(new Konva.Rect({
					...device.screen,
					fill: "#F3F4EF"
				}));
				screen.add(new Konva.Text({
					x: device.screen.x + 12,
					y: device.screen.y + device.screen.height / 2 - 16,
					width: device.screen.width - 24,
					text: options.emptyDeviceLabel,
					fontFamily: "sans-serif",
					fontSize: Math.min(32, device.screen.width * .08),
					align: "center",
					fill: "#65745E",
					listening: false
				}));
			} else screen.add(new Konva.Image({
				image: source,
				...fitImage(imageWidth, imageHeight, device.screen, style.fit)
			}));
			face.add(screen);
			if (!banner) drawDeviceDetails(face, device, style.camera);
			if (options.onMove) {
				makeMovable(phone, element, options, shot.id);
				phone.on("dragend", () => options.onMove?.(Math.round(phone.x() - device.width / 2 + cropOffset), Math.round(phone.y() - device.height / 2), element));
			}
			layer.add(phone);
			deviceNodes.push({
				phone,
				device,
				element
			});
		}
		for (const owner of (panoramic ? panoramaPair(project, shot.id) : null) ?? [shot]) {
			const ownerStyle = resolveStyle(project, owner);
			const ownerOrigin = isPanoramaEnd(ownerStyle.template) ? canvas.width : 0;
			const captionLayout = templateLayout(project, ownerStyle);
			addText(layer, owner.title, {
				...captionLayout.title,
				x: captionLayout.title.x + ownerOrigin - cropOffset,
				shotId: owner.id,
				element: "title",
				offset: textOffset(owner, "title"),
				interaction: options,
				fitWords,
				fontSize: ownerStyle.titleSize * template.fontScale,
				weight: style.titleFont ? style.titleFont === "Fraunces" ? "600" : "800" : template.titleWeight ?? (style.template === "classic" ? "700" : "800"),
				fontFamily: style.titleFont ?? template.titleFont,
				lineHeight: template.lineHeight,
				color: style.textColor,
				accent: style.accentTitle ? style.accentColor : void 0,
				align: style.align
			});
			addText(layer, owner.subtitle, {
				...captionLayout.subtitle,
				x: captionLayout.subtitle.x + ownerOrigin - cropOffset,
				shotId: owner.id,
				element: "subtitle",
				offset: textOffset(owner, "subtitle"),
				interaction: options,
				fitWords,
				fontSize: template.subtitleSize,
				weight: style.bodyFont === "Fraunces" ? "600" : "400",
				fontFamily: style.bodyFont,
				color: style.textColor,
				align: style.align,
				opacity: style.template === "classic" ? .78 : .88
			});
		}
		if (style.template === "classic") {
			deviceNodes[0]?.phone.moveToTop();
			for (const element of ["title", "subtitle"]) if (shot.textOffsets?.[element]) layer.findOne(`.caption-${element}`)?.moveToTop();
		}
		for (const owner of (panoramic ? panoramaPair(project, shot.id) : null) ?? [shot]) {
			const origin = isPanoramaEnd(resolveStyle(project, owner).template) ? canvas.width : 0;
			for (const overlay of owner.overlays ?? []) {
				const source = options.images?.get(overlay.assetId);
				if (!source?.complete || !source.naturalWidth) throw new Error("An extra image is still loading. Try again in a moment.");
				const element = `overlay:${overlay.id}`;
				const group = new Konva.Group({
					x: overlay.x + overlay.width / 2 + origin - cropOffset,
					y: overlay.y + overlay.height / 2,
					offsetX: overlay.width / 2,
					offsetY: overlay.height / 2,
					width: overlay.width,
					height: overlay.height,
					rotation: overlay.rotation,
					name: "scene-overlay",
					element,
					shotId: owner.id,
					guideBounds: {
						x: 0,
						y: 0,
						width: overlay.width,
						height: overlay.height
					}
				});
				group.add(new Konva.Image({
					image: source,
					width: overlay.width,
					height: overlay.height
				}));
				layer.add(group);
				if (options.onOverlayChange) {
					makeMovable(group, element, options, owner.id);
					group.on("dragend", () => options.onOverlayChange?.(overlay.id, {
						x: group.x() - overlay.width / 2 - origin + cropOffset,
						y: group.y() - overlay.height / 2
					}, owner.id));
					attachDeviceResize(layer, group, overlay, cropOffset - origin, (placement) => options.onOverlayChange?.(overlay.id, {
						...placement,
						height: placement.width * overlay.height / overlay.width
					}, owner.id), () => {
						selectSceneElement(layer, element, owner.id);
						options.onSelectElement?.(element, owner.id);
					}).setAttrs({
						element,
						shotId: owner.id
					});
				}
			}
		}
		if (options.guides && (options.onMove || options.onTextMove)) attachSceneGuides(layer, canvas, panoramic ? 2 : 1, cropOffset);
		if (options.onResize) for (const { phone, device, element } of deviceNodes) attachDeviceResize(layer, phone, device, cropOffset, (placement) => options.onResize?.(placement, shot.id, element), () => {
			selectSceneElement(layer, element, shot.id);
			options.onSelectElement?.(element, shot.id);
		}, true).setAttrs({
			element,
			shotId: shot.id
		});
		return layer;
	} catch (error) {
		layer.destroy();
		throw error;
	}
}
//#endregion
//#region src/export/review.ts
var RECOMMENDED_IMAGE_BYTES = 8e6;
function reviewExportedImage(blob, name, profile, format) {
	return {
		name,
		bytes: blob.size,
		width: profile.width,
		height: profile.height,
		format,
		overLimit: profile.maxBytes !== void 0 && blob.size > profile.maxBytes,
		large: blob.size > RECOMMENDED_IMAGE_BYTES
	};
}
function publicationAdvice(profile, count) {
	if (profile.store === "presentation") return [];
	const advice = [];
	if (profile.store === "google" && profile.category !== "banner") {
		if (profile.id === "play-xr" && count < 4) advice.push("Android XR needs at least 4 screenshots. You can export individual files while preparing the set.");
		else if (profile.id.startsWith("play-auto")) advice.push("Prepare both Automotive orientations: at least 2 portrait and 2 landscape screenshots in the complete listing.");
		else if (!profile.sourceOnly && profile.id !== "play-tv" && count < 2) advice.push("Google Play needs at least 2 screenshots in the complete listing. A single exported file is only part of that set.");
		if ([
			"phone",
			"tablet",
			"desktop"
		].includes(profile.category) && !profile.sourceOnly && !profile.id.startsWith("play-auto") && !["play-xr", "play-tv"].includes(profile.id) && count < 4) advice.push("For promotional placements, Google Play recommends at least 4 screenshots of your app.");
	}
	if (profile.sourceOnly) advice.push("This destination exports only the original app capture. Design, text, frames, and overlays are kept in your project but excluded here. Use a square capture without transparent masking.");
	else if (profile.store === "google") advice.push("Review Google Play content guidance: avoid rankings, testimonials, awards, prices, and promotional claims. Tablet and Chromebook captures should show the app interface without extra promotional text.");
	else advice.push("Use captures from the actual Apple app. Review every language and provide iPad screenshots if the app supports iPad.");
	return advice;
}
//#endregion
//#region src/agent/render.ts
var registerFonts = FontLibrary.use.bind(FontLibrary);
function loadNativeFonts(directory) {
	registerFonts("Manrope", join(directory, "Manrope.ttf"));
	registerFonts("Fraunces", join(directory, "Fraunces-Semibold.ttf"));
	Konva.pixelRatio = 1;
	Konva.autoDrawEnabled = false;
}
async function imageFor(asset, project, shot) {
	const scales = [];
	for (const slot of [shot, ...(shot.companions ?? []).map((d) => deviceShot(shot, `device:${d.id}`))]) {
		if (slot.assetId !== asset.id) continue;
		const style = resolveStyle(project, slot);
		const screen = deviceGeometry(style.device, slot.phone.width, style.frame, style.deviceOrientation).screen;
		scales.push(fitImage(asset.width, asset.height, screen, style.fit).width / asset.width);
	}
	for (const owner of linkedShots(project, shot.id)) for (const overlay of owner.overlays ?? []) if (overlay.assetId === asset.id) scales.push(Math.max(overlay.width / asset.width, overlay.height / asset.height));
	if (shot.backgroundImage?.assetId === asset.id) {
		const canvas = canonicalCanvas(project);
		scales.push(Math.max(canvas.width * linkedShots(project, shot.id).length / asset.width, canvas.height / asset.height));
	}
	const scale = Math.min(1, Math.max(...scales, 0) * resolveExportProfile(project).width / 1080);
	if (!(scale > 0)) throw new Error("An image has no valid placement in this scene.");
	const bytes = await sharp(Buffer.from(await asset.blob.arrayBuffer()), {
		limitInputPixels: LIMITS.imagePixels,
		failOn: "warning"
	}).rotate().resize({
		width: Math.max(1, Math.ceil(asset.width * scale)),
		height: Math.max(1, Math.ceil(asset.height * scale)),
		fit: "fill",
		kernel: "lanczos3"
	}).png().toBuffer();
	const image = new Image$1(bytes);
	await image.decode();
	Object.defineProperties(image, {
		naturalWidth: { get: () => asset.width },
		naturalHeight: { get: () => asset.height }
	});
	return image;
}
async function renderNativeShot(project, shot, assets) {
	const profile = resolveExportProfile(project);
	if (profile.sourceOnly) throw new Error("Use the web studio for source-only Wear OS exports.");
	const images = /* @__PURE__ */ new Map();
	for (const id of sceneAssetIds(project, shot)) {
		const asset = assets.get(id);
		if (!asset) throw new Error("A screenshot image is missing from this project.");
		images.set(id, await imageFor(asset, project, shot));
	}
	const stage = new Konva.Stage({
		width: profile.width,
		height: profile.height,
		scaleX: profile.width / 1080,
		scaleY: profile.width / 1080
	});
	try {
		stage.add(createScene(project, shot, images.get(shot.assetId ?? ""), { images }));
		stage.draw();
		const canvas = stage.toCanvas({
			width: profile.width,
			height: profile.height,
			pixelRatio: 1
		});
		const buffer = await sharp(await canvas.toBuffer("png")).flatten({ background: "#F4F1E9" }).toColourspace("srgb").removeAlpha().png().toBuffer();
		await validateExportPng(new Blob([new Uint8Array(buffer)], { type: "image/png" }), profile);
		return buffer;
	} finally {
		stage.destroy();
	}
}
/** Called only inside a newly reserved output directory. Never overwrites user work. */
async function writeDesign(project, assets, directory, fonts) {
	validateProject(project);
	if (!project.shots.length) throw new Error("The project has no slides to render.");
	const profile = resolveExportProfile(project);
	if (project.shots.length > profile.maxCount) throw new Error(`This export profile allows ${profile.maxCount} slides per language.`);
	loadNativeFonts(fonts);
	const byId = new Map(assets.map((asset) => [asset.id, asset]));
	const source = project.localization?.source ?? "en";
	const locales = [source, ...project.localization?.targets ?? []];
	const packed = {};
	const files = [];
	const previews = [];
	const warnings = publicationAdvice(profile, project.shots.length);
	let total = 0;
	for (const locale of locales) {
		if (locale !== source && project.shots.some((shot) => localeStatus(shot, locale) === "untranslated" || localeStatus(shot, locale) === "outdated")) throw new Error(`The ${locale} captions are missing or outdated. Review them in the web studio before exporting.`);
		const localized = localizedProject(project, locale);
		for (const [index, shot] of localized.shots.entries()) {
			const name = `${locale}/${String(index + 1).padStart(2, "0")}.png`;
			const png = await renderNativeShot(localized, shot, byId);
			total += png.length;
			if (total > 268435456) throw new Error("This export exceeds 256 MB. Export fewer slides or languages together.");
			const review = reviewExportedImage(new Blob([new Uint8Array(png)], { type: "image/png" }), name, profile, "png");
			if (review.overLimit) throw new Error(`${name} exceeds this store slot's file-size limit.`);
			files.push(review);
			packed[name] = png;
			if (locale === source) previews.push(await sharp(png).resize({
				width: 280,
				height: 380,
				fit: "inside"
			}).toBuffer());
		}
	}
	const columns = Math.min(4, previews.length), cellWidth = 304, cellHeight = 432;
	const composite = [];
	for (const [i, input] of previews.entries()) {
		const meta = await sharp(input).metadata();
		const x = i % columns * cellWidth, y = Math.floor(i / columns) * cellHeight;
		composite.push({
			input,
			left: x + Math.round((cellWidth - meta.width) / 2),
			top: y + 12
		});
		const label = Buffer.from(`<svg width="304" height="40"><text x="152" y="25" text-anchor="middle" font-size="16" fill="#202725">${String(i + 1).padStart(2, "0")}</text></svg>`);
		composite.push({
			input: label,
			left: x,
			top: y + 386
		});
	}
	await sharp({ create: {
		width: columns * cellWidth,
		height: Math.ceil(previews.length / columns) * cellHeight,
		channels: 3,
		background: "#E3E8DE"
	} }).composite(composite).png().toFile(join(directory, "preview.png"));
	const { mkdir } = await import("node:fs/promises");
	for (const locale of locales) await mkdir(join(directory, locale));
	for (const [name, data] of Object.entries(packed)) await writeFile(join(directory, name), data, { flag: "wx" });
	await writeFile(join(directory, "screenshots.zip"), zipSync(packed, { level: 0 }), { flag: "wx" });
	await writeFile(join(directory, "project.henscreenshots"), new Uint8Array(await (await exportProject(project, assets)).arrayBuffer()), { flag: "wx" });
	const report = {
		version: 1,
		project: project.name,
		profile: profile.id,
		width: profile.width,
		height: profile.height,
		languages: locales,
		files,
		warnings,
		preview: "preview.png",
		editableProject: "project.henscreenshots",
		archive: "screenshots.zip",
		captionReview: "Review every language and the preview before publishing.",
		supportedLanguages: languages.map(([code]) => code)
	};
	await writeFile(join(directory, "report.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
	return report;
}
//#endregion
//#region src/agent/cli.ts
var help = `Hen Screenshots local plugin · ${version}

hen templates [--query dark]       List template IDs and required images
hen profiles                      List export profiles and dimensions
hen languages                     List supported caption languages
hen doctor                        Check the local renderer and fonts
hen create --config design.json --out ./output
hen create --input ./captures --name "My app" --template halo --profile play-phone-portrait --out ./output
hen render --project app.henscreenshots --out ./output
hen inspect --project app.henscreenshots

Every create/render writes a NEW output directory: preview.png, project.henscreenshots,
screenshots.zip, report.json and PNGs in language folders. Existing directories are never overwritten.
Input folders accept PNG, JPEG and still WebP. Paths in design.json are relative to that file.
Use the design-spec reference in this plugin for captions, brand kits, panoramas and translations.`;
async function main(argv = process.argv.slice(2)) {
	const { positionals, values } = parseArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: {
			help: {
				type: "boolean",
				short: "h"
			},
			query: { type: "string" },
			config: { type: "string" },
			input: { type: "string" },
			out: { type: "string" },
			name: { type: "string" },
			template: { type: "string" },
			profile: { type: "string" },
			device: { type: "string" },
			project: { type: "string" }
		}
	});
	const [command = "help", ...extra] = positionals;
	if (extra.length) throw new Error("Unexpected arguments. Quote file paths and names that contain spaces.");
	if (values.help || command === "help") {
		process.stdout.write(help + "\n");
		return;
	}
	const print = (value) => process.stdout.write(JSON.stringify(value, null, 2) + "\n");
	const fonts = fileURLToPath(new URL(
		/* @vite-ignore */
		"../assets/fonts/",
		import.meta.url
	));
	if (command === "templates") {
		const query = (values.query ?? "").toLowerCase();
		print([...templates, ...bannerTemplates].filter((t) => JSON.stringify(t).toLowerCase().includes(query)).map((t) => {
			const p = createProject();
			p.exportProfile = t.id.startsWith("banner-") ? "play-feature-graphic" : "play-phone-portrait";
			p.shots.push(createShot("example", 0));
			applyTemplate(p, p.shots[0].id, t.id);
			return {
				id: t.id,
				name: t.name,
				description: t.description,
				category: t.category,
				appearance: t.appearance,
				workspace: t.id.startsWith("banner-") ? "banners" : "screenshots",
				slides: p.shots.length,
				companionImages: p.shots[0].companions?.length ?? 0
			};
		}));
		return;
	}
	if (command === "profiles") {
		print(exportProfiles.map((p) => ({
			...p,
			pluginSupported: !("sourceOnly" in p && p.sourceOnly)
		})));
		return;
	}
	if (command === "languages") {
		print(languages.map(([code, name]) => ({
			code,
			name
		})));
		return;
	}
	if (command === "doctor") {
		loadNativeFonts(fonts);
		print({
			ok: true,
			version,
			node: process.version,
			renderer: "Konva + Skia",
			fonts: ["Manrope", "Fraunces"],
			runtime: "local",
			networkRequiredForRendering: false
		});
		return;
	}
	if (![
		"create",
		"render",
		"inspect"
	].includes(command)) throw new Error(`Unknown command: ${command}. Run hen --help.`);
	if (command !== "inspect" && !values.out) throw new Error("Choose a new output directory with --out.");
	let loaded;
	if (command === "render" || command === "inspect") {
		if (!values.project) throw new Error("Choose a .henscreenshots file with --project.");
		loaded = await importProject(await readLocalFile(resolve(values.project), LIMITS.totalBytes + 4194304), decodeNativeImages);
		if (command === "inspect") {
			print({
				project: loaded.project,
				assets: loaded.assets.map(({ blob, ...info }) => ({
					...info,
					bytes: blob.size
				}))
			});
			return;
		}
	} else {
		if (Boolean(values.config) === Boolean(values.input)) throw new Error("Choose either --config design.json or --input captures-folder.");
		if (values.config && [
			values.name,
			values.template,
			values.profile,
			values.device
		].some((v) => v !== void 0)) throw new Error("With --config, put the name, template, profile and device in the JSON file.");
		let raw, directory;
		if (values.config) {
			const path = resolve(values.config);
			directory = dirname(path);
			const file = await readLocalFile(path, 1048576);
			try {
				raw = JSON.parse(await file.text());
			} catch {
				throw new Error("The design config is not valid JSON.");
			}
		} else {
			directory = resolve(values.input);
			const paths = (await readdir(directory, { withFileTypes: true })).filter((e) => e.isFile() && /\.(png|jpe?g|webp)$/i.test(e.name)).map((e) => e.name).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
			const profile = values.profile ?? "play-phone-portrait";
			raw = {
				version: 1,
				name: values.name ?? "My app",
				profile,
				template: values.template ?? (isBannerProfile(profile) ? "banner-signal" : "studio"),
				...values.device ? { device: values.device } : {},
				slides: paths.map((image) => ({
					image,
					title: image.replace(/\.[^.]+$/, "").slice(0, 100),
					subtitle: ""
				}))
			};
		}
		const spec = parseDesignSpec(raw);
		const images = await readAssets(specImagePaths(spec), directory);
		loaded = {
			project: buildDesign(spec, images, spec.brandKit ? await importBrandKit(await readLocalFile(localPath(spec.brandKit, directory), 131072)) : void 0),
			assets: [...new Map([...images.values()].map((a) => [a.id, a])).values()],
			revision: 0
		};
	}
	const out = resolve(values.out);
	await mkdir(dirname(out), { recursive: true });
	try {
		await mkdir(out);
	} catch (cause) {
		throw new Error(`Cannot create output directory “${out}”. Choose a new path; existing work is never overwritten.`, { cause });
	}
	try {
		print({
			ok: true,
			output: out,
			...await writeDesign(loaded.project, loaded.assets, out, fonts)
		});
	} catch (error) {
		await rm(out, {
			recursive: true,
			force: true
		});
		throw error;
	}
}
//#endregion
export { main };
