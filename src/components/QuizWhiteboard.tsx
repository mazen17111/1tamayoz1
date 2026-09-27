import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  Grid, 
  Sun, 
  Moon, 
  Check
} from 'lucide-react';

interface QuizWhiteboardProps {
  questionId: string;
  questionNumber: number;
  initialDrawingDataUrl?: string;
  onSaveDrawing: (questionId: string, dataUrl: string) => void;
  className?: string;
}

type BoardBackground = 'dark' | 'light' | 'grid';

export const QuizWhiteboard: React.FC<QuizWhiteboardProps> = ({
  questionId,
  questionNumber,
  initialDrawingDataUrl,
  onSaveDrawing,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing state (using refs for 120fps lag-free performance without React re-renders)
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<any>(null);
  const currentQuestionIdRef = useRef<string>(questionId);
  currentQuestionIdRef.current = questionId;

  // Undo history stack using lightweight Offscreen / HTMLCanvas snapshot elements (GPU accelerated)
  const historyStackRef = useRef<HTMLCanvasElement[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);

  // UI state for tools & settings
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>('#38bdf8'); // sky blue by default
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [bgType, setBgType] = useState<BoardBackground>('dark');

  // Available vibrant colors
  const darkThemeColors = ['#ffffff', '#38bdf8', '#4ade80', '#facc15', '#f87171', '#c084fc'];
  const lightThemeColors = ['#0f172a', '#0284c7', '#16a34a', '#ca8a04', '#dc2626', '#9333ea'];
  const currentColors = bgType === 'light' ? lightThemeColors : darkThemeColors;

  // Keep penColor contrasting if board background changes
  useEffect(() => {
    if (bgType === 'light' && (penColor === '#ffffff' || penColor === '#facc15')) {
      setPenColor('#0284c7');
    } else if (bgType !== 'light' && penColor === '#0f172a') {
      setPenColor('#38bdf8');
    }
  }, [bgType, penColor]);

  // Fast background painter
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, type: BoardBackground) => {
    ctx.save();
    if (type === 'light') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else if (type === 'grid') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else {
      // Classic deep slate blackboard
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }, []);

  // GPU Snapshot taker (takes <1ms with zero memory bloat)
  const pushSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    try {
      const snap = document.createElement('canvas');
      snap.width = canvas.width;
      snap.height = canvas.height;
      const snapCtx = snap.getContext('2d');
      if (snapCtx) {
        snapCtx.drawImage(canvas, 0, 0);
        // Keep max 12 snapshots for memory efficiency
        const stack = historyStackRef.current;
        if (stack.length >= 12) {
          stack.shift();
        }
        stack.push(snap);
        setCanUndo(stack.length > 1);
      }
    } catch {}
  }, []);

  // Debounced save to parent (prevents 200ms UI pauses on stroke end)
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const dataUrl = canvas.toDataURL('image/png');
        onSaveDrawing(currentQuestionIdRef.current, dataUrl);
      } catch {}
    }, 450);
  }, [onSaveDrawing]);

  // Flush save immediately (e.g. before unmount or question switch)
  const flushSaveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      onSaveDrawing(currentQuestionIdRef.current, dataUrl);
    } catch {}
  }, [onSaveDrawing]);

  // Canvas initialization / loader
  const initCanvas = useCallback((bg = bgType, dataUrl = initialDrawingDataUrl) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
    const displayWidth = Math.max(280, Math.floor(rect.width));
    const displayHeight = Math.max(240, Math.floor(rect.height));

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw initial background
    drawBackground(ctx, displayWidth, displayHeight, bg);

    // Reset history stack
    historyStackRef.current = [];
    setCanUndo(false);

    if (dataUrl && dataUrl.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        pushSnapshot();
      };
      img.src = dataUrl;
    } else {
      pushSnapshot();
    }
  }, [bgType, initialDrawingDataUrl, drawBackground, pushSnapshot]);

  // Initialize on mount or when switching question
  useEffect(() => {
    initCanvas(bgType, initialDrawingDataUrl);
    return () => {
      flushSaveNow();
    };
  }, [questionId]); // Only reinit if questionId changes

  // Switch background theme without losing drawing strokes
  const handleSwitchBackground = (newBg: BoardBackground) => {
    if (newBg === bgType) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      setBgType(newBg);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Save current drawing to temporary canvas
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    const tempCtx = temp.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
    }

    setBgType(newBg);

    // Redraw with new background
    drawBackground(ctx, w, h, newBg);
    if (tempCtx) {
      ctx.drawImage(temp, 0, 0, w, h);
    }

    pushSnapshot();
    scheduleSave();
  };

  // Undo implementation (<1ms instant restoration)
  const handleUndo = () => {
    const stack = historyStackRef.current;
    if (stack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stack.pop(); // Remove current state
    const previousState = stack[stack.length - 1];
    if (previousState) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(previousState, 0, 0, w, h);
      setCanUndo(stack.length > 1);
      scheduleSave();
    }
  };

  // Clear board
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    drawBackground(ctx, w, h, bgType);
    pushSnapshot();
    scheduleSave();
  };

  // Smooth Coordinate Calculation
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Ultra-smooth Bezier drawing handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only handle primary button / primary touch pointer
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      canvas.setPointerCapture(e.pointerId);
      activePointerIdRef.current = e.pointerId;
    } catch {}

    const pt = getCoordinates(e);
    isDrawingRef.current = true;
    lastPointRef.current = pt;

    // Apply active tool stroke styles
    if (activeTool === 'eraser') {
      ctx.strokeStyle = bgType === 'light' ? '#ffffff' : (bgType === 'grid' ? '#0f172a' : '#1e293b');
      ctx.lineWidth = lineWidth * 6;
    } else {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = lineWidth;
    }

    // Draw single dot on tap/click
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, (activeTool === 'eraser' ? lineWidth * 3 : lineWidth / 2), 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCoordinates(e);
    const lastPoint = lastPointRef.current;

    if (lastPoint) {
      // Quadratic bezier midpoint smoothing for buttery curve
      const midX = (lastPoint.x + currentPoint.x) / 2;
      const midY = (lastPoint.y + currentPoint.y) / 2;

      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
      ctx.stroke();

      lastPointRef.current = currentPoint;
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (canvas && activePointerIdRef.current !== null) {
      try {
        canvas.releasePointerCapture(activePointerIdRef.current);
      } catch {}
      activePointerIdRef.current = null;
    }

    pushSnapshot();
    scheduleSave();
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl text-right select-none ${className}`}>
      
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 sm:p-2.5 bg-slate-800/95 border-b border-slate-700/80 backdrop-blur-xs">
        
        {/* Tools (Pen / Eraser / Thickness) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pen Button */}
          <button
            type="button"
            onClick={() => setActiveTool('pen')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'pen'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="قلم الكتابة"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">القلم</span>
          </button>

          {/* Eraser Button */}
          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="الممحاة"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الممحاة</span>
          </button>

          {/* Line Thickness */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-700/70">
            {[2, 4, 7].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setLineWidth(size)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  lineWidth === size ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title={`حجم الخط ${size}px`}
              >
                <div 
                  className="rounded-full bg-current transition-all" 
                  style={{ width: `${size * 1.5 + 2}px`, height: `${size * 1.5 + 2}px` }} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette (When Pen is Active) */}
        {activeTool === 'pen' && (
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-700/70">
            {currentColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPenColor(c)}
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer border border-white/20"
                style={{ backgroundColor: c }}
                title={`لون: ${c}`}
              >
                {penColor === c && (
                  <Check className={`w-3 h-3 ${c === '#ffffff' ? 'text-black' : 'text-white'}`} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Board Backgrounds & Undo/Clear Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Background switcher */}
          <div className="flex items-center bg-slate-950/70 p-0.5 rounded-xl border border-slate-700/70">
            <button
              type="button"
              onClick={() => handleSwitchBackground('dark')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                bgType === 'dark' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
              title="سبورة سوداء داكنة"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSwitchBackground('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                bgType === 'grid' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
              title="سبورة مربعات للمسائل والكسور"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSwitchBackground('light')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                bgType === 'light' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
              title="سبورة بيضاء"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Instant Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
              !canUndo
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white'
            }`}
            title="تراجع عن آخر خطوة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Clear Board */}
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-700/80 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
            title="مسح السبورة بالكامل"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* High Performance Drawing Canvas */}
      <div 
        ref={containerRef} 
        className="relative flex-1 w-full h-full min-h-[260px] touch-none cursor-crosshair overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          className="absolute inset-0 block w-full h-full touch-none select-none"
          style={{ touchAction: 'none', willChange: 'transform' }}
        />

        {/* Indicator badge */}
        <div className="absolute bottom-2 left-2 pointer-events-none bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>مسودة السؤال {questionNumber} (فائقة السرعة ومحفوظة)</span>
        </div>
      </div>
    </div>
  );
};
