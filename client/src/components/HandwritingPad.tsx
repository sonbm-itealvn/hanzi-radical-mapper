// Style reminder: The handwriting pad is a paper practice tile; strokes are indigo, selected candidates are vermilion.

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eraser, PenLine, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recognizeHandwriting, type InkPoint, type InkStroke } from "@/lib/handwritingRecognition";

type HandwritingPadProps = {
  onClose: () => void;
  onSelect: (value: string) => void;
};

export default function HandwritingPad({ onClose, onSelect }: HandwritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokeRef = useRef<InkPoint[]>([]);
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const [status, setStatus] = useState("Viết một chữ vào ô giấy rồi bấm nhận diện.");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "rgba(23,50,77,.13)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(rect.width / 2, 16);
    ctx.lineTo(rect.width / 2, rect.height - 16);
    ctx.moveTo(16, rect.height / 2);
    ctx.lineTo(rect.width - 16, rect.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    strokes.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.strokeStyle = "#17324d";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, t: Date.now() };
  };

  const startStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    activeStrokeRef.current = [point];
    setStrokes((previous) => [...previous, [point]]);
    setCandidates([]);
    setStatus("Đang ghi nét…");
  };

  const moveStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeStrokeRef.current.length) return;
    const point = pointFromEvent(event);
    activeStrokeRef.current.push(point);
    setStrokes((previous) => previous.map((stroke, index) => index === previous.length - 1 ? [...stroke, point] : stroke));
  };

  const endStroke = () => {
    activeStrokeRef.current = [];
    setStatus("Đã ghi nét. Bạn có thể thêm nét hoặc nhận diện ngay.");
  };

  const clear = () => {
    setStrokes([]);
    setCandidates([]);
    setStatus("Viết một chữ vào ô giấy rồi bấm nhận diện.");
  };

  const undo = () => {
    setStrokes((previous) => previous.slice(0, -1));
    setCandidates([]);
    setStatus("Đã hoàn tác nét cuối.");
  };

  const recognize = async () => {
    if (!strokes.length) {
      setStatus("Hãy viết ít nhất một nét trước.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsRecognizing(true);
    setStatus("Đang tìm các chữ gần nhất…");
    const nextCandidates = await recognizeHandwriting(strokes, canvas.clientWidth, canvas.clientHeight);
    setCandidates(nextCandidates);
    setStatus(nextCandidates.length ? "Chọn chữ đúng nhất để bắt đầu tra." : "Chưa tìm thấy ứng viên phù hợp.");
    setIsRecognizing(false);
  };

  return (
    <div className="handwriting-pad" aria-label="Bảng viết tay để tra chữ">
      <div className="handwriting-pad__header">
        <div><span className="metadata-label">TRA BẰNG NÉT VIẾT</span><strong>Viết chữ bạn nhớ hình, không cần nhớ cách gõ.</strong></div>
        <button type="button" className="handwriting-close" onClick={onClose} aria-label="Đóng bảng viết tay"><X size={17} /></button>
      </div>
      <div className="handwriting-pad__body">
        <div className="handwriting-canvas-wrap">
          <canvas ref={canvasRef} className="handwriting-canvas" onPointerDown={startStroke} onPointerMove={moveStroke} onPointerUp={endStroke} onPointerCancel={endStroke} aria-label="Ô viết tay" />
          <div className="handwriting-canvas-hint">dùng chuột, trackpad hoặc ngón tay</div>
        </div>
        <div className="handwriting-pad__side">
          <div className="handwriting-status"><PenLine size={15} /> {status}</div>
          <div className="handwriting-actions">
            <Button type="button" className="primary-control" onClick={recognize} disabled={isRecognizing}><Sparkles size={15} /> {isRecognizing ? "Đang nhận…" : "Nhận diện"}</Button>
            <Button type="button" variant="outline" className="step-control" onClick={undo} disabled={!strokes.length}><RotateCcw size={15} /> Hoàn tác</Button>
            <Button type="button" variant="ghost" className="erase-control" onClick={clear} disabled={!strokes.length}><Eraser size={15} /> Xóa</Button>
          </div>
          {candidates.length > 0 && <div className="candidate-box"><span className="metadata-label">ỨNG VIÊN GỢI Ý</span><div className="candidate-list">{candidates.map((candidate) => <button type="button" key={candidate} className="candidate-chip" onClick={() => onSelect(candidate)}><span>{candidate}</span><Check size={13} /></button>)}</div><small>Nét viết chỉ dùng để tìm ứng viên; hãy chọn chữ khớp nhất trước khi tra.</small></div>}
        </div>
      </div>
      <div className="handwriting-privacy"><Sparkles size={12} /> Nhận diện dùng nét bạn vừa vẽ để trả ứng viên; không lưu lịch sử nét trong app.</div>
    </div>
  );
}
