// Style reminder: Sổ tay chữ trên bàn học — paper canvas, indigo ink, vermilion action marks, tea-green radicals.

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronRight, Info, Loader2, Mic, PenLine, Play, RotateCcw, Search, SkipForward, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import HanziStrokeCanvas from "@/components/HanziStrokeCanvas";
import HandwritingPad from "@/components/HandwritingPad";
import {
  FALLBACK_META,
  HANZI_CDN,
  HANZI_EXAMPLES,
  isHanzi,
  resolveHanziInput,
  type HanziMeta,
  type PhraseMeta,
  type StrokeData,
} from "@/lib/hanziData";
import { RADICAL_DICT } from "@/lib/radicalData";
import { getSpeechRecognition, type SpeechRecognitionLike } from "@/lib/speechRecognition";
import { lookupOnlinePhrase, type OnlinePhraseMeta } from "@/lib/onlineDictionary";
import { loadIdsMapping, parseIds } from "@/lib/idsService";

const MARK_URL = "/images/hanzi-mapper-mark.png";
const DESK_URL = "/images/hanzi-study-desk.png";
const INK_WASH_URL = "/images/hanzi-ink-wash.png";

function pickCharacter(value: string) {
  return extractHanziPhrase(resolveHanziInput(value))[0] ?? "你";
}

function extractHanziPhrase(value: string) {
  return Array.from(resolveHanziInput(value)).filter((char) => isHanzi(char)).join("");
}

function speakMandarin(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [query, setQuery] = useState("你");
  const [character, setCharacter] = useState("你");
  const [strokeData, setStrokeData] = useState<StrokeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [micMessage, setMicMessage] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null);
  const [showWritingPad, setShowWritingPad] = useState(false);
  const [onlinePhraseMeta, setOnlinePhraseMeta] = useState<OnlinePhraseMeta | null>(null);
  const [onlinePhraseLoading, setOnlinePhraseLoading] = useState(false);
  const [onlinePhraseError, setOnlinePhraseError] = useState("");
  const [onlineCharacterMeta, setOnlineCharacterMeta] = useState<OnlinePhraseMeta | null>(null);

  const resolvedPhrase = useMemo(() => extractHanziPhrase(query), [query]);
  const phraseMeta: PhraseMeta | null = onlinePhraseMeta;
  const phraseLookupState = onlinePhraseLoading ? "loading" : onlinePhraseMeta ? "online" : onlinePhraseError ? "error" : "empty";

  const meta: HanziMeta = useMemo(() => {
    const fallback = FALLBACK_META(character);
    const detail = phraseMeta?.characterDetails?.find(c => c.char === character) 
                || onlineCharacterMeta?.characterDetails?.find(c => c.char === character);
    
    let radicalPinyin = fallback.radicalPinyin;
    let radicalMeaning = "";
    if (detail?.radical) {
      const radInfo = RADICAL_DICT[detail.radical];
      if (radInfo) {
        radicalPinyin = `${radInfo.pinyin} / ${radInfo.vi}`;
        radicalMeaning = radInfo.meaning;
      } else {
        radicalPinyin = "gợi nhóm nghĩa";
      }
    }

    const parsed = detail?.radical ? parseIds(character, detail.radical) : null;

    const components = detail?.radical ? [
      { char: detail.radical, label: `Bộ ${RADICAL_DICT[detail.radical]?.vi || detail.radical}`, role: "bộ thủ chính", position: parsed?.structure || "—", tone: "tea" as const },
      { char: parsed?.remaining || "…", label: "Phần còn lại", role: "thành phần", position: "—", tone: "ink" as const }
    ] : fallback.components;

    return {
      ...fallback,
      radical: detail?.radical ?? fallback.radical,
      radicalPinyin,
      pinyin: detail?.pinyin ?? (phraseMeta?.phrase === character ? phraseMeta.pinyin : fallback.pinyin),
      zhuyin: detail?.bopomofo ?? (phraseMeta?.phrase === character ? phraseMeta.zhuyin : fallback.zhuyin),
      meaning: phraseMeta?.phrase === character && phraseMeta.meaning !== "Chưa có nghĩa trực tuyến" ? phraseMeta.meaning : (onlineCharacterMeta?.meaning || fallback.meaning),
      components,
      structure: parsed?.structure ?? (detail?.radical ? "Chưa rõ cấu trúc (tự động)" : fallback.structure),
      note: detail?.radical ? `Đã nạp tự động bộ thủ [ ${detail.radical} ] và âm đọc từ từ điển online.` : fallback.note
    };
  }, [character, phraseMeta, onlineCharacterMeta]);

  useEffect(() => {
    loadIdsMapping();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    lookupOnlinePhrase(character, controller.signal)
      .then(res => setOnlineCharacterMeta(res))
      .catch(() => {});
    return () => controller.abort();
  }, [character]);

  useEffect(() => {
    if (!resolvedPhrase) {
      setOnlinePhraseMeta(null);
      setOnlinePhraseLoading(false);
      setOnlinePhraseError("");
      return;
    }
    const controller = new AbortController();
    setOnlinePhraseMeta(null);
    setOnlinePhraseLoading(true);
    setOnlinePhraseError("");
    void lookupOnlinePhrase(resolvedPhrase, controller.signal)
      .then((result) => setOnlinePhraseMeta(result))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setOnlinePhraseError(error instanceof Error ? error.message : "Không thể kết nối từ điển online.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setOnlinePhraseLoading(false);
      });
    return () => controller.abort();
  }, [resolvedPhrase]);

  const loadCharacter = useCallback(async (nextCharacter: string, displayValue?: string) => {
    const clean = pickCharacter(nextCharacter);
    setCharacter(clean);
    setQuery(displayValue ?? clean);
    setCurrentStroke(-1);
    setIsPlaying(false);
    setLoading(true);
    setDataError(false);
    try {
      const response = await fetch(`${HANZI_CDN}/${encodeURIComponent(clean)}.json`);
      if (!response.ok) throw new Error("stroke data unavailable");
      const data = (await response.json()) as StrokeData;
      setStrokeData(data);
    } catch {
      setStrokeData(null);
      setDataError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCharacter("你");
  }, [loadCharacter]);

  useEffect(() => {
    if (!isPlaying || !strokeData?.strokes.length) return;
    const next = currentStroke + 1;
    if (next >= strokeData.strokes.length) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setCurrentStroke(next), 530);
    return () => window.clearTimeout(timer);
  }, [currentStroke, isPlaying, strokeData]);

  const handleSearch = () => {
    const phrase = extractHanziPhrase(query);
    void loadCharacter(phrase || "你", phrase || "你");
  };

  const handleMic = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setMicMessage("Trình duyệt này chưa hỗ trợ nhập bằng mic. Hãy dùng Chrome hoặc Safari mới.");
      return;
    }
    if (isListening) {
      recognition?.stop();
      return;
    }
    const nextRecognition = new Recognition();
    nextRecognition.lang = "cmn-Hant-TW"; // Sử dụng mã cmn-Hant-TW để bắt buộc ra chữ Phồn thể
    nextRecognition.interimResults = true;
    nextRecognition.continuous = false;
    nextRecognition.onstart = () => {
      setIsListening(true);
      setMicMessage("Đang nghe… hãy đọc một chữ bằng tiếng Hoa.");
    };
    nextRecognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join("");
      const spokenPhrase = extractHanziPhrase(transcript);
      if (spokenPhrase) {
        setMicMessage(`Đã nghe: ${spokenPhrase}${spokenPhrase.length > 1 ? " · chọn từng chữ bên dưới" : ""}`);
        void loadCharacter(spokenPhrase, spokenPhrase);
      }
    };
    nextRecognition.onerror = (event) => {
      setIsListening(false);
      setMicMessage(event.error === "not-allowed" ? "Mic chưa được cấp quyền. Hãy cho phép mic rồi thử lại." : "Chưa nghe rõ. Hãy đọc chậm một chữ.");
    };
    nextRecognition.onend = () => setIsListening(false);
    setRecognition(nextRecognition);
    nextRecognition.start();
  };

  const handlePlay = () => {
    if (!strokeData?.strokes.length) return;
    setCurrentStroke(-1);
    setIsPlaying(true);
  };

  const handleStep = () => {
    if (!strokeData?.strokes.length) return;
    setIsPlaying(false);
    setCurrentStroke((previous) => Math.min(previous + 1, strokeData.strokes.length - 1));
  };

  return (
    <div className="app-frame">
      <header className="site-header">
        <div className="brand-lockup">
          <img src={MARK_URL} alt="" className="brand-mark" />
          <div>
            <div className="brand-name">Hanzi <span>·</span> Mapper</div>
            <div className="brand-kicker">BÀN HỌC CHỮ PHỒN THỂ</div>
          </div>
        </div>
        <nav className="header-nav" aria-label="Điều hướng chính">
          <a href="#workspace" className="is-active">Tra chữ</a>
          <a href="#stroke-lab">Thứ tự nét</a>
          <a href="#about">Cách học</a>
        </nav>
        <div className="header-status"><span className="status-dot" /> TOCFL · STARTER</div>
      </header>

      <main id="workspace" className="workspace">
        <section className="input-board" aria-labelledby="page-title">
          <div className="section-kicker"><span className="red-seal">一</span> BÀN NHẬP CHỮ</div>
          <div className="intro-copy">
            <h1 id="page-title">Gõ một chữ.<br /><em>Nhìn thấy cách nó được dựng lên.</em></h1>
            <p>Tra bộ thủ, cấu trúc và nét viết của chữ Hán phồn thể theo cách trực quan hơn một cuốn từ điển.</p>
          </div>

          <div className="search-form" role="search">
            <label htmlFor="hanzi-input">Chữ Hán cần tra</label>
            <div className="search-row">
              <div className="search-input-wrap">
                <Search size={19} strokeWidth={1.8} aria-hidden="true" />
                <input
                  id="hanzi-input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  maxLength={12}
                  placeholder="例如：學習、請問、海邊"
                  aria-label="Nhập chữ Hán"
                />
                <Button type="button" variant="ghost" className={`mic-button ${isListening ? "is-listening" : ""}`} onClick={handleMic} aria-label={isListening ? "Dừng nghe" : "Nhập chữ bằng mic"}>
                  <Mic size={16} />
                </Button>
                <span className="input-hint">⌘ ↵</span>
              </div>
              <Button className="search-button" onClick={handleSearch} aria-label="Tra chữ">
                Tra chữ <ChevronRight size={17} />
              </Button>
            </div>
            <div className="search-helper"><Info size={13} /> Nhập một chữ hoặc cả cụm từ phồn thể. Chữ đang xem được phân tích ở bên phải.</div>
            {micMessage && <div className={`mic-message ${isListening ? "is-listening" : ""}`}><Mic size={13} /> {micMessage}</div>}
            <button type="button" className="handwriting-trigger" onClick={() => setShowWritingPad((previous) => !previous)}><PenLine size={15} /> {showWritingPad ? "Đóng bảng viết tay" : "Viết tay để tra chữ"}<ChevronRight size={14} /></button>
            {extractHanziPhrase(query).length > 1 && (
              <div className="phrase-rail" aria-label="Chọn chữ trong cụm đang tra">
                <span className="phrase-rail__label">CHỌN CHỮ TRONG CỤM</span>
                <div className="phrase-rail__chars">
                  {Array.from(extractHanziPhrase(query)).map((char, index) => (
                    <button type="button" key={`${char}-${index}`} className={`phrase-char ${char === character ? "is-selected" : ""}`} onClick={() => void loadCharacter(char, extractHanziPhrase(query))} aria-label={`Phân tích chữ ${char}`}>
                      <span>{char}</span><small>{index + 1}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showWritingPad && <HandwritingPad onClose={() => setShowWritingPad(false)} onSelect={(value) => { setShowWritingPad(false); void loadCharacter(value, value); }} />}
            {resolvedPhrase.length >= 2 && <div className={`phrase-dictionary-card ${phraseLookupState === "online" ? "is-online" : ""} ${phraseLookupState === "empty" || phraseLookupState === "error" ? "is-untranslated" : ""}`}>
              {phraseLookupState === "loading" && !phraseMeta && <div className="phrase-lookup-state"><Loader2 size={17} className="animate-spin" /><strong>Đang tra cụm online…</strong><small>Ưu tiên dữ liệu chữ phồn thể Đài Loan.</small></div>}
              {phraseLookupState === "error" && <div className="phrase-lookup-state"><Info size={17} /><strong>Không kết nối được từ điển online.</strong><small>{onlinePhraseError} Bạn vẫn có thể chọn từng chữ bên dưới.</small></div>}
              {phraseLookupState === "empty" && <div className="phrase-lookup-state"><BookOpen size={17} /><strong>Chưa tìm thấy nghĩa online.</strong><small>Cụm đã được nhận diện; hãy chọn từng chữ để phân tích hoặc thử cách gõ khác.</small></div>}
              {phraseMeta && <>
              <div className="phrase-dictionary-card__header">
                <div><span className="metadata-label">TỪ ĐIỂN ONLINE</span><strong>{phraseMeta.phrase}</strong></div>
                <button type="button" className="speak-button" onClick={() => speakMandarin(phraseMeta.phrase)} aria-label={`Nghe ${phraseMeta.phrase}`}><Volume2 size={16} /> Nghe cụm</button>
              </div>
              <div className="phrase-dictionary-reading"><strong>{phraseMeta.pinyin}</strong><span>{phraseMeta.zhuyin}</span><em>{phraseMeta.partOfSpeech}</em></div>
              <p className="phrase-dictionary-meaning">{phraseMeta.meaning}</p>
              <div className="phrase-dictionary-example"><span>{phraseMeta.exampleLabel ?? "VÍ DỤ"}</span><strong>{phraseMeta.example}</strong><small>{phraseMeta.exampleMeaning}</small></div>
              {phraseLookupState === "online" && onlinePhraseMeta?.source && <small className="phrase-dictionary-source">Nguồn: {onlinePhraseMeta.source}</small>}
              </>}
            </div>}
          </div>

          <div className="example-strip">
            <div className="example-label">THỬ NHANH</div>
            <div className="example-chips">
              {HANZI_EXAMPLES.map((example) => (
                <button key={example} className={example === character ? "example-chip is-selected" : "example-chip"} onClick={() => void loadCharacter(example)}>
                  {example}
                </button>
              ))}
            </div>
          </div>



          <div className="desk-note" style={{ backgroundImage: `url(${DESK_URL})` }}>
            <div className="desk-note__veil" />
            <div className="desk-note__content">
              <span className="desk-note__eyebrow">MỘT CHỮ · BA GÓC NHÌN</span>
              <strong>Bộ thủ · cấu trúc · thứ tự nét</strong>
              <span>Mỗi lần tra là một lần nhìn chữ chậm hơn.</span>
            </div>
          </div>
        </section>

        <section className="result-board" aria-live="polite" aria-labelledby="result-title">
          <div className="result-header">
            <div>
              <div className="section-kicker">KẾT QUẢ TRA CỨU <span className="ink-rule" /></div>
              <h2 id="result-title">Chữ đang ở trên bàn</h2>
            </div>
            <div className="result-index">#{String(HANZI_EXAMPLES.indexOf(character) + 1).padStart(2, "0")}</div>
          </div>

          <div className="character-card">
            <div className="character-card__main">
              <span className="character-card__label">繁體字 · CHỮ PHỒN THỂ</span>
              <div className="main-character">{character}</div>
              <div className="character-reading"><span>{meta.pinyin}</span><span className="reading-divider">/</span><span>{meta.meaning}</span><button type="button" className="speak-button speak-button--small" onClick={() => speakMandarin(character)} aria-label={`Nghe chữ ${character}`}><Volume2 size={14} /></button></div>
            </div>
            <div className="character-card__stamp">{meta.traditional}</div>
          </div>

          <div className="mapping-thread" aria-hidden="true"><span className="mapping-thread__dot" /><span className="mapping-thread__line" /><span className="mapping-thread__label">MAPPING THREAD</span><span className="mapping-thread__line" /><span className="mapping-thread__dot" /></div>

          <div className="metadata-row">
            <div className="metadata-block metadata-block--radical">
              <span className="metadata-label">BỘ THỦ CHÍNH</span>
              <div className="radical-line"><span className="radical-large">{meta.radical}</span><span><strong>{meta.radicalPinyin || "Chưa có"}</strong><small>{meta.radical === "—" ? "Đang chờ chú giải" : "gợi nhóm nghĩa"}</small></span></div>
            </div>
            <div className="metadata-block">
              <span className="metadata-label">CẤU TRÚC</span>
              <strong className="metadata-value">{meta.structure}</strong>
            </div>
            <div className="metadata-block">
              <span className="metadata-label">SỐ NÉT</span>
              <strong className="metadata-value">{loading ? "…" : dataError ? "—" : `${strokeCount || strokeData?.strokes.length || "—"} nét`}</strong>
            </div>
          </div>

          <div className="composition-section">
            <div className="subsection-heading"><span>01</span><div><h3>Chữ được dựng từ đâu?</h3><p>Nhìn quan hệ giữa bộ thủ chính và thành phần còn lại.</p></div></div>
            <div className="component-map">
              {meta.components.length ? meta.components.map((component, index) => (
                <div className={`component-node tone-${component.tone}`} key={`${component.char}-${component.position}`}>
                  <div className="component-node__char">{component.char}</div>
                  <div className="component-node__copy"><strong>{component.label}</strong><span>{component.role}</span><small>{component.position}</small></div>
                  {index < meta.components.length - 1 && <div className="component-link" aria-hidden="true"><ChevronRight size={15} /></div>}
                </div>
              )) : <div className="empty-component"><BookOpen size={18} /> Chưa có chú giải thành phần cho chữ này trong bộ mẫu.</div>}
            </div>
            <p className="note-line"><Sparkles size={14} /> {meta.note}</p>
          </div>

          <div id="stroke-lab" className="stroke-section">
            <div className="subsection-heading"><span>02</span><div><h3>Bắt đầu từ nét đầu tiên</h3><p>Phát lại toàn bộ hoặc bước từng nét để quan sát nhịp viết.</p></div></div>
            <div className="stroke-layout">
              <HanziStrokeCanvas character={character} data={strokeData} currentStroke={currentStroke} isPlaying={isPlaying} onStrokeCount={setStrokeCount} onSelectStroke={(index) => { setIsPlaying(false); setCurrentStroke(index); }} />
              <div className="stroke-controls">
                <div className="stroke-controls__top"><span className="control-label">THỨ TỰ NÉT · {strokeData?.strokes.length ?? "—"}</span><span className="stroke-counter">{currentStroke < 0 ? "Sẵn sàng" : `${currentStroke + 1} / ${strokeData?.strokes.length ?? "—"}`}</span></div>
                <div className="control-actions">
                  <Button className="primary-control" onClick={handlePlay} disabled={loading || !strokeData}>
                    <Play size={16} fill="currentColor" /> Phát lại
                  </Button>
                  <Button variant="outline" className="step-control" onClick={handleStep} disabled={loading || !strokeData}>
                    <SkipForward size={16} /> Từng nét
                  </Button>
                  <Button variant="ghost" className="reset-control" onClick={() => { setCurrentStroke(-1); setIsPlaying(false); }} aria-label="Đặt lại mô phỏng">
                    <RotateCcw size={16} />
                  </Button>
                </div>
                <div className="stroke-legend"><span><i className="legend-dot legend-dot--ink" /> đã viết</span><span><i className="legend-dot legend-dot--red" /> đang xem</span></div>
                {dataError && <div className="data-warning"><Info size={14} /> CDN nét chưa phản hồi. Hãy thử lại chữ này sau giây lát.</div>}
                <div className="stroke-note-card"><span className="metadata-label">KEY POINTS FOR HANDWRITING</span><strong>{meta.keyPoints}</strong></div>
                <div className="stroke-note-card stroke-note-card--pinyin"><span className="metadata-label">PINYIN COMPOSITION</span><strong>{meta.pinyinComposition}</strong><span>{meta.zhuyinComposition}</span></div>
              </div>
            </div>
          </div>

          <div id="about" className="study-tip" style={{ backgroundImage: `url(${INK_WASH_URL})` }}>
            <div className="study-tip__overlay" />
            <div className="study-tip__content"><span className="metadata-label">GỢI Ý ÔN TOCFL</span><strong>Đừng chỉ đọc nghĩa. Hãy gọi tên bộ thủ trước.</strong><span>Che phần ví dụ, nhìn chữ lớn và tự nói: “Bộ gì? Cấu trúc gì? Nét nào đi trước?”</span></div>
            <Volume2 size={18} className="tip-icon" />
          </div>
        </section>
      </main>

      <footer className="site-footer"><span>Hanzi · Mapper / Bản học thử chữ phồn thể</span><span>Nét chữ: <a href="https://github.com/chanind/hanzi-writer-data" target="_blank" rel="noreferrer">Hanzi Writer Data</a> · Chú giải bộ thủ: bộ mẫu TOCFL</span></footer>
    </div>
  );
}
