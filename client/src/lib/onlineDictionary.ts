import type { PhraseMeta } from "@/lib/hanziData";

type TaiwanMandarinCharacter = {
  char: string;
  pinyin?: string;
  bopomofo?: string;
  radical?: string;
  stroke_count?: number;
  radical_meaning?: string;
  radical_number?: number;
  english?: string;
  example_words?: string[];
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

const BASE_API = "https://api.taiwanmandarin.com";
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
      
      let chineseSentence = result.text;
      if (result.transcriptions && result.transcriptions.length > 0) {
        const hant = result.transcriptions.find((t: any) => t.script === "Hant" || t.lang_tag === "zh-Hant");
        if (hant) chineseSentence = hant.text;
      }
      
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

/** Look up a single character via /characters/:char */
async function lookupCharacter(char: string, signal?: AbortSignal): Promise<TaiwanMandarinCharacter | null> {
  try {
    const response = await fetch(`${BASE_API}/characters/${encodeURIComponent(char)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as TaiwanMandarinCharacter;
  } catch {
    return null;
  }
}

/** Look up a multi-character word via /words/:word */
async function lookupWord(word: string, signal?: AbortSignal): Promise<TaiwanMandarinWord | null> {
  try {
    const response = await fetch(`${BASE_API}/words/${encodeURIComponent(word)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as TaiwanMandarinWord;
  } catch {
    return null;
  }
}

export async function lookupOnlinePhrase(phrase: string, signal?: AbortSignal): Promise<OnlinePhraseMeta | null> {
  const key = phrase.trim();
  if (!key) return null;
  if (sessionCache.has(key)) return sessionCache.get(key) ?? null;

  const isSingleChar = [...key].length === 1;
  
  let word: string = key;
  let pinyin = "";
  let bopomofo = "";
  let english = "";
  let posLabel = "";
  let tocflLevel = "";
  let characterDetails: TaiwanMandarinCharacter[] = [];
  let exampleWords: string[] = [];

  if (isSingleChar) {
    // Single character: use /characters/:char endpoint
    const charData = await lookupCharacter(key, signal);
    if (!charData) {
      sessionCache.set(key, null);
      return null;
    }
    word = charData.char || key;
    pinyin = charData.pinyin || "";
    bopomofo = charData.bopomofo || "";
    english = charData.english || "";
    posLabel = (charData as any).pos_label || "";
    tocflLevel = (charData as any).tocfl_level_name || "";
    exampleWords = charData.example_words || [];
    characterDetails = [charData];
  } else {
    // Multi-character word: use /words/:word endpoint
    const wordData = await lookupWord(key, signal);
    if (!wordData) {
      // Fallback: try looking up each character individually
      const chars = [...key];
      const charResults = await Promise.all(chars.map(c => lookupCharacter(c, signal)));
      const validChars = charResults.filter((c): c is TaiwanMandarinCharacter => c !== null);
      if (validChars.length === 0) {
        sessionCache.set(key, null);
        return null;
      }
      characterDetails = validChars;
      word = key;
      pinyin = validChars.map(c => c.pinyin || "?").join(" ");
      bopomofo = validChars.map(c => c.bopomofo || "?").join(" ");
      english = "";
    } else {
      word = wordData.word || key;
      pinyin = wordData.pinyin || "";
      bopomofo = wordData.bopomofo || "";
      english = clean(wordData.english);
      posLabel = wordData.pos_label || "";
      tocflLevel = wordData.tocfl_level_name || "";
      characterDetails = wordData.characters ?? [];

      // If word API didn't return character details, fetch them individually
      if (characterDetails.length === 0) {
        const chars = [...key];
        const charResults = await Promise.all(chars.map(c => lookupCharacter(c, signal)));
        characterDetails = charResults.filter((c): c is TaiwanMandarinCharacter => c !== null);
      }
    }
  }

  // Vietnamese translation
  let vietnamese = "";
  try {
    vietnamese = await lookupVietnameseMeaning(key, signal);
  } catch {
    vietnamese = "";
  }
  const meaning = vietnamese || english || "Chưa có nghĩa trực tuyến";
  const level = tocflLevel ? ` · ${tocflLevel}` : "";
  const pos = posLabel ? `${posLabel}${level}` : `Tra online${level}`;
  
  // Example sentence from Tatoeba
  const exampleData = await fetchExampleSentence(key, signal);
  let finalExample = "";
  let finalExampleMeaning = "";
  let finalExampleLabel = "";
  let finalSource = vietnamese ? "Taiwan Mandarin API + MyMemory VI" : "Taiwan Mandarin API";

  if (exampleData) {
    finalExample = exampleData.sentence;
    finalExampleMeaning = exampleData.meaning;
    finalExampleLabel = "VÍ DỤ";
    finalSource += " + Tatoeba";
  } else if (exampleWords.length > 0) {
    finalExample = exampleWords.slice(0, 5).join("、");
    finalExampleMeaning = "Các từ ghép thường gặp chứa ký tự này.";
    finalExampleLabel = "TỪ GHÉP";
  } else if (english) {
    finalExample = english;
    finalExampleMeaning = vietnamese ? `Nghĩa gốc tiếng Anh.` : "Nghĩa tiếng Anh từ Taiwan Mandarin API.";
    finalExampleLabel = "NGHĨA GỐC";
  } else {
    finalExample = "—";
    finalExampleMeaning = "";
    finalExampleLabel = "GHI CHÚ";
  }

  const result: OnlinePhraseMeta = {
    phrase: word,
    pinyin: pinyin || "Chưa có pinyin online",
    zhuyin: bopomofo || "Chưa có zhuyin online",
    meaning,
    partOfSpeech: pos,
    example: finalExample,
    exampleMeaning: finalExampleMeaning,
    exampleLabel: finalExampleLabel,
    source: finalSource,
    characterDetails,
  };
  sessionCache.set(key, result);
  return result;
}
