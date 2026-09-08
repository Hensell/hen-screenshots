export const TRANSLATION_CACHE = "hen-translation-v1";
export interface TranslationPack {
  id: string;
  revision: string;
  bytes: number;
}
const packs: Record<string, TranslationPack> = {
  "en-es": {
    id: "Xenova/opus-mt-en-es",
    revision: "4b002a4c7edd54a7ced58877258b87f7efd3f892",
    bytes: 119380000,
  },
  "es-en": {
    id: "Xenova/opus-mt-es-en",
    revision: "eadfd7c658a9d8929ac3b8e996b68a68e2c7d480",
    bytes: 119380000,
  },
  "en-fr": {
    id: "Xenova/opus-mt-en-fr",
    revision: "28726206f80896b90035bd99cccd5cc1e151f916",
    bytes: 113120000,
  },
  "fr-en": {
    id: "Xenova/opus-mt-fr-en",
    revision: "6b166a182780e118c997879d0ad5be4b53671644",
    bytes: 113120000,
  },
  "en-de": {
    id: "Xenova/opus-mt-en-de",
    revision: "1ca130c44c4c5441ef16d48aae521a424ab644f7",
    bytes: 111520000,
  },
  "de-en": {
    id: "Xenova/opus-mt-de-en",
    revision: "399dfd68706739fffd503f876093e455ae268a06",
    bytes: 111520000,
  },
};
export function translationRoute(
  source: string,
  target: string,
): TranslationPack[] | null {
  if (source === target) return null;
  if (packs[`${source}-${target}`]) return [packs[`${source}-${target}`]];
  const first = packs[`${source}-en`],
    second = packs[`en-${target}`];
  return first && second ? [first, second] : null;
}
export const modelFileNames = [
  "onnx/encoder_model_quantized.onnx",
  "onnx/decoder_model_merged_quantized.onnx",
  "config.json",
  "tokenizer.json",
  "tokenizer_config.json",
];
export function packFileUrl(pack: TranslationPack, file: string) {
  return `https://huggingface.co/${pack.id}/resolve/${pack.revision}/${file}`;
}
