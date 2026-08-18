// Style reminder: Editorial study notebook — ivory paper, indigo ink, vermilion cues, tea-green radical metadata.

export type ComponentInfo = {
  char: string;
  label: string;
  role: string;
  position: string;
  tone: "tea" | "ink" | "vermilion" | "gold";
};

export type HanziMeta = {
  char: string;
  pinyin: string;
  meaning: string;
  traditional: string;
  radical: string;
  radicalPinyin: string;
  structure: string;
  note: string;
  zhuyin: string;
  keyPoints: string;
  pinyinComposition: string;
  zhuyinComposition: string;
  components: ComponentInfo[];
};

export type PhraseMeta = {
  phrase: string;
  pinyin: string;
  zhuyin: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  exampleMeaning: string;
  exampleLabel?: string;
};

export type StrokeData = {
  strokes: string[];
  medians: number[][][];
};

export const HANZI_CDN = import.meta.env.VITE_HANZI_CDN || "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1";

export const HANZI_EXAMPLES = ["你", "好", "休", "明", "語", "請", "飯", "海", "看", "間", "這", "學"];



export function resolveHanziInput(value: string) {
  return Array.from(value).filter((char) => isHanzi(char)).join("");
}



export const FALLBACK_META = (char: string): HanziMeta => ({
  char,
  pinyin: "Đang tải...",
  meaning: "Chưa có thông tin",
  traditional: "待查",
  radical: "—",
  radicalPinyin: "",
  structure: "Chưa rõ cấu trúc",
  note: "Đang chờ tải dữ liệu từ điển trực tuyến...",
  zhuyin: "—",
  keyPoints: "Hãy nạp chữ để xem hướng dẫn viết.",
  pinyinComposition: "—",
  zhuyinComposition: "—",
  components: [],
});

export function isHanzi(value: string) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(value);
}
