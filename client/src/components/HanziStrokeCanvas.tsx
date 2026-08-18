// Style reminder: The stroke canvas is a paper practice card; indigo for completed ink and vermilion for the active stroke.

import { useEffect, useMemo } from "react";
import type { StrokeData } from "@/lib/hanziData";

type HanziStrokeCanvasProps = {
  character: string;
  data: StrokeData | null;
  currentStroke: number;
  isPlaying: boolean;
  onStrokeCount: (count: number) => void;
  onSelectStroke: (index: number) => void;
};

function medianPath(points: number[][]) {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
}

export default function HanziStrokeCanvas({
  character,
  data,
  currentStroke,
  isPlaying,
  onStrokeCount,
  onSelectStroke,
}: HanziStrokeCanvasProps) {
  useEffect(() => {
    onStrokeCount(data?.strokes.length ?? 0);
  }, [data, onStrokeCount]);

  const visibleStroke = useMemo(() => {
    if (!data) return -1;
    if (isPlaying) return currentStroke;
    return currentStroke >= 0 ? currentStroke : data.strokes.length - 1;
  }, [currentStroke, data, isPlaying]);

  return (
    <div className="stroke-paper" aria-label={`Minh họa thứ tự nét chữ ${character}`}>
      <div className="stroke-paper__label">LƯỚI TẬP VIẾT · {data?.strokes.length ?? "—"} NÉT</div>
      <svg className="stroke-svg" viewBox="0 0 1024 1024" role="img" aria-label={`Chữ ${character}`}>
        <defs>
          <pattern id="practice-grid" width="256" height="256" patternUnits="userSpaceOnUse">
            <path d="M 256 0 L 0 0 0 256" fill="none" stroke="#17324d" strokeOpacity=".10" strokeWidth="3" />
            <path d="M 0 256 L 256 0" fill="none" stroke="#b94a3d" strokeOpacity=".08" strokeWidth="3" />
          </pattern>
        </defs>
        <rect x="34" y="34" width="956" height="956" rx="20" fill="url(#practice-grid)" />
        <g transform="scale(1, -1) translate(0, -900)">
          {data?.strokes.map((stroke, index) => (
            <path
              key={`${character}-outline-${index}`}
              d={stroke}
              className={`stroke-outline ${index <= visibleStroke ? "is-visible" : "is-muted"} ${index === currentStroke ? "is-active" : ""}`}
            />
          ))}
          {data?.medians.map((median, index) => (
            <path
              key={`${character}-median-${index}`}
              d={medianPath(median)}
              className={`stroke-median ${index === currentStroke ? "is-active" : ""}`}
            />
          ))}
        </g>
      </svg>
      {data && (
        <div className="stroke-strip" aria-label="Các bước thứ tự nét">
          {data.strokes.map((stroke, index) => (
            <button
              type="button"
              key={`${character}-thumb-${index}`}
              className={`stroke-thumb ${index < currentStroke ? "is-completed" : ""} ${index === (currentStroke < 0 ? 0 : currentStroke) ? "is-active" : ""}`}
              onClick={() => onSelectStroke(index)}
              aria-label={`Xem nét ${index + 1}`}
            >
              <span className="stroke-thumb__number">{index + 1}</span>
              <svg viewBox="0 0 1024 1024" aria-hidden="true">
                <text x="512" y="820" textAnchor="middle" className="stroke-thumb__ghost-glyph">{character}</text>
                <g transform="scale(1, -1) translate(0, -900)">
                  <path className="stroke-thumb__stroke" d={stroke} />
                </g>
              </svg>
            </button>
          ))}
        </div>
      )}
      {!data && <div className="stroke-paper__empty">Đang tải dữ liệu nét…</div>}
    </div>
  );
}
