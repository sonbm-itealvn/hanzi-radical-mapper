// Style reminder: Handwriting feedback uses a calm paper panel, indigo ink, and vermilion candidate selection.

import { HANZI_EXAMPLES, isHanzi } from "@/lib/hanziData";

export type InkPoint = { x: number; y: number; t: number };
export type InkStroke = InkPoint[];

const GOOGLE_HANDWRITING_URL = import.meta.env.VITE_GOOGLE_HANDWRITING_URL || "https://www.google.com/inputtools/request?ime=handwriting&app=hanzi-radical-mapper&cs=1";

function collectCandidates(node: unknown, result: string[]) {
  if (typeof node === "string") {
    const cleaned = Array.from(node).filter((char) => isHanzi(char)).join("");
    if (cleaned && cleaned.length <= 6) result.push(cleaned);
    return;
  }
  if (Array.isArray(node)) node.forEach((child) => collectCandidates(child, result));
}

export async function recognizeHandwriting(strokes: InkStroke[], width: number, height: number) {
  const ink = strokes.map((stroke) => [
    stroke.map((point) => Math.round(point.x)),
    stroke.map((point) => Math.round(point.y)),
    stroke.map((point) => Math.round(point.t)),
  ]);
  const payload = {
    device: "Hanzi Radical Mapper",
    options: "enable_pre_space",
    requests: [{ writing_guide: { writing_area_width: Math.round(width), writing_area_height: Math.round(height) }, ink, language: "zh_TW" }],
  };

  try {
    const response = await fetch(GOOGLE_HANDWRITING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("handwriting provider unavailable");
    const json = (await response.json()) as unknown;
    const collected: string[] = [];
    collectCandidates(json, collected);
    const unique = Array.from(new Set(collected));
    if (unique.length) return unique.slice(0, 8);
  } catch {
    // The browser may block the optional provider because this is a static app.
  }

  return HANZI_EXAMPLES.slice(0, 8);
}
