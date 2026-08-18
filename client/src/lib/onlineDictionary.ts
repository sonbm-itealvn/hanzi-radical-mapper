import type { PhraseMeta } from "@/lib/hanziData";

type TaiwanMandarinCharacter = {
  char: string;
  pinyin?: string;
  bopomofo?: string;
  radical?: string;
  stroke_count?: number;
};

type TaiwanMandarinWord = {
  word: string;
  pinyin?: string;
  bopomofo?: string;
  english?: string;
  pos_label?: string;
  tocfl_level_name?: string;
  characters?: TaiwanMandarinCharacter[];
};

type MyMemoryResponse = {
  responseData?: { translatedText?: string };
  matches?: Array<{ translation?: string }>;
};

export type OnlinePhraseMeta = PhraseMeta & {
  source: string;
  characterDetails: TaiwanMandarinCharacter[];
};

const TAIWAN_MANDARIN_ENDPOINT = import.meta.env.VITE_TAIWAN_MANDARIN_ENDPOINT || "https://api.taiwanmandarin.com/words";
const MYMEMORY_ENDPOINT = import.meta.env.VITE_MYMEMORY_ENDPOINT || "https://api.mymemory.translated.net/get";
const TATOEBA_ENDPOINT = "https://tatoeba.org/en/api_v0/search";
const sessionCache = new Map<string, OnlinePhraseMeta | null>();

function clean(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function looksVietnamese(value: string) {
  return /[à-ỹđ]/i.test(value);
}

async function lookupVietnameseMeaning(phrase: string, signal?: AbortSignal) {
  const url = new URL(MYMEMORY_ENDPOINT);
  url.searchParams.set("q", phrase);
  url.searchParams.set("langpair", "zh-TW|vi");
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) return "";
  const payload = (await response.json()) as MyMemoryResponse;
  const candidates = (payload.matches ?? []).map((match) => clean(match.translation)).filter(Boolean);
  return candidates.find(looksVietnamese) ?? clean(payload.responseData?.translatedText);
}

async function fetchExampleSentence(phrase: string, signal?: AbortSignal) {
  try {
    const url = new URL(TATOEBA_ENDPOINT);
    url.searchParams.set("from", "cmn");
    url.searchParams.set("to", "vie");
    url.searchParams.set("query", phrase);
    
    const response = await fetch(url, { signal });
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      
      // Tìm câu tiếng Trung phồn thể nếu có
      let chineseSentence = result.text;
      if (result.transcriptions && result.transcriptions.length > 0) {
        const hant = result.transcriptions.find((t: any) => t.script === "Hant" || t.lang_tag === "zh-Hant");
        if (hant) chineseSentence = hant.text;
      }
      
      // Lấy nghĩa tiếng Việt
      let vietnameseMeaning = "";
      if (result.translations && result.translations.length > 0 && result.translations[0].length > 0) {
        vietnameseMeaning = result.translations[0][0].text;
      }
      
      if (chineseSentence && vietnameseMeaning) {
        return {
          sentence: chineseSentence,
          meaning: vietnameseMeaning,
          source: "Tatoeba"
        };
      }
    }
  } catch (err) {
    console.error("Lỗi khi tải ví dụ:", err);
  }
  return null;
}

export async function lookupOnlinePhrase(phrase: string, signal?: AbortSignal): Promise<OnlinePhraseMeta | null> {
  const key = phrase.trim();
  if (!key) return null;
  if (sessionCache.has(key)) return sessionCache.get(key) ?? null;

  const response = await fetch(`${TAIWAN_MANDARIN_ENDPOINT}/${encodeURIComponent(key)}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) {
    sessionCache.set(key, null);
    return null;
  }
  if (!response.ok) throw new Error(`Từ điển Taiwan Mandarin trả về HTTP ${response.status}`);

  const payload = (await response.json()) as TaiwanMandarinWord;
  const english = clean(payload.english);
  let vietnamese = "";
  try {
    vietnamese = await lookupVietnameseMeaning(key, signal);
  } catch {
    vietnamese = "";
  }
  const meaning = vietnamese || english || "Chưa có nghĩa trực tuyến";
  const level = payload.tocfl_level_name ? ` · ${payload.tocfl_level_name}` : "";
  const pos = payload.pos_label ? `${payload.pos_label}${level}` : `Tra online${level}`;
  
  const exampleData = await fetchExampleSentence(key, signal);
  let finalExample = english || "—";
  let finalExampleMeaning = vietnamese ? `Nghĩa gốc: ${english || "đã được chuyển sang tiếng Việt ở trên"}.` : "Nghĩa tiếng Anh từ Taiwan Mandarin API.";
  let finalExampleLabel = english ? "NGHĨA GỐC" : "GHI CHÚ";
  let finalSource = vietnamese ? "Taiwan Mandarin API · zh-TW + MyMemory VI" : "Taiwan Mandarin API · zh-TW";

  if (exampleData) {
    finalExample = exampleData.sentence;
    finalExampleMeaning = exampleData.meaning;
    finalExampleLabel = "VÍ DỤ";
    finalSource += " + Tatoeba";
  }

  const result: OnlinePhraseMeta = {
    phrase: payload.word || key,
    pinyin: payload.pinyin || "Chưa có pinyin online",
    zhuyin: payload.bopomofo || "Chưa có zhuyin online",
    meaning,
    partOfSpeech: pos,
    example: finalExample,
    exampleMeaning: finalExampleMeaning,
    exampleLabel: finalExampleLabel,
    source: finalSource,
    characterDetails: payload.characters ?? [],
  };
  sessionCache.set(key, result);
  return result;
}
