import React, { useMemo, useState, useEffect, useRef } from 'react';

export type RewriteStyle = 'Descriptive' | 'Concise' | 'Marketing' | 'Technical';
export type SpeedMode = 'Fast' | 'Quality';

interface DM2PromptEditorProps {
  onSend: (finalPrompt: string) => void;
  onClear?: () => void;
  initialText?: string;
  onResizeStart?: () => void;
  onResizeEnd?: (height: number) => void;
  isGenerating?: boolean;
}

export default function DM2PromptEditor({ onSend, onClear, initialText, onResizeStart, onResizeEnd, isGenerating = false }: DM2PromptEditorProps) {
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>('Descriptive');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('Fast');
  const [autoRefine, setAutoRefine] = useState<boolean>(true);
  const [promptCount, setPromptCount] = useState<number>(1);
  const [draft, setDraft] = useState<boolean>(false);
  const [text, setText] = useState<string>('');
  const [editorHeight, setEditorHeight] = useState<number>(200);

  useEffect(() => {
    if (typeof initialText !== 'undefined') {
      setText(initialText);
    }
  }, [initialText]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragState = useRef({
    pressed: false,
    dragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const resizeState = useRef({
    pressed: false,
    dragging: false,
    startY: 0,
    startHeight: 0,
  });
  const minHeight = 0;
  const maxHeight = 600;

  useEffect(() => {
    // Pointer events are used directly on the textarea; no window listeners needed.
  }, []);

  const onTextAreaPointerDown = (e: React.PointerEvent<HTMLTextAreaElement>) => {
    if (e.button !== 0) return;
    const el = textareaRef.current;
    if (!el) return;
    dragState.current.pressed = true;
    dragState.current.dragging = false;
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.scrollTop = el.scrollTop;
    dragState.current.scrollLeft = el.scrollLeft;
    // Use pointer capture to reliably receive move/up events
    (el as any).setPointerCapture?.(e.pointerId);
  };

  const onTextAreaPointerMove = (e: React.PointerEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el || !dragState.current.pressed) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    if (!dragState.current.dragging) {
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragState.current.dragging = true;
        el.style.userSelect = 'none';
        el.style.cursor = 'grabbing';
      } else {
        return;
      }
    }

    // prevent text selection while dragging
    e.preventDefault();
    el.scrollTop = dragState.current.scrollTop - dy;
    el.scrollLeft = dragState.current.scrollLeft - dx;
  };

  const onTextAreaPointerUp = (e: React.PointerEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    dragState.current.pressed = false;
    dragState.current.dragging = false;
    if (el) {
      el.style.userSelect = 'text';
      el.style.cursor = 'grab';
      (el as any).releasePointerCapture?.(e.pointerId);
    }
  };

  const onGripPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    resizeState.current.pressed = true;
    resizeState.current.dragging = false;
    resizeState.current.startY = e.clientY;
    resizeState.current.startHeight = editorHeight;
    (el as any).setPointerCapture?.(e.pointerId);
    document.body.style.userSelect = 'none';
    onResizeStart?.();
  };
  const onGripPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeState.current.pressed) return;
    const dy = e.clientY - resizeState.current.startY;
    if (!resizeState.current.dragging) {
      if (Math.abs(dy) <= 4) return;
      resizeState.current.dragging = true;
    }
    e.preventDefault();
    const next = Math.max(minHeight, Math.min(maxHeight, resizeState.current.startHeight + dy));
    setEditorHeight(next);
  };
  const onGripPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    resizeState.current.pressed = false;
    resizeState.current.dragging = false;
    (el as any).releasePointerCapture?.(e.pointerId);
    document.body.style.userSelect = 'auto';
    onResizeEnd?.(editorHeight);
  };

  const isSendDisabled = useMemo(() => text.trim().length === 0, [text]);

  const handleSend = () => {
    // Stub rewrite: build final prompt matching controls
    const header = `[${rewriteStyle} | ${speedMode}${autoRefine ? ' +AutoRefine' : ''} | count:${promptCount}${draft ? ' | draft' : ''}]`;
    const finalPrompt = `${header}\n\n${text.trim()}`;
    onSend(finalPrompt);
  };

  const handleClear = () => {
    setText('');
    setDraft(false);
    setPromptCount(1);
    setAutoRefine(true);
    setSpeedMode('Fast');
    setRewriteStyle('Descriptive');
    setEditorHeight(200);
    onClear?.();
  };

  return (
    <div className="bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border p-4 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Prompt Editor</h3>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto no-scrollbar space-y-3">

      {/* Rewrite Style */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary dark:text-dark-text-secondary">Rewrite Style</label>
        <select
          value={rewriteStyle}
          onChange={(e) => setRewriteStyle(e.target.value as RewriteStyle)}
          className="rounded-md bg-panel-secondary dark:bg-dark-panel-secondary text-text-primary dark:text-dark-text-primary border border-border dark:border-dark-border text-sm px-2 py-1"
        >
          <option>Descriptive</option>
          <option>Concise</option>
          <option>Marketing</option>
          <option>Technical</option>
        </select>
      </div>

      {/* Speed Mode */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary dark:text-dark-text-secondary">Speed Mode</label>
        <div className="flex gap-2">
          {(['Fast', 'Quality'] as SpeedMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSpeedMode(m)}
              className={`px-3 py-1 rounded-full text-xs border-2 border-border dark:border-dark-border transition ${
                speedMode === m ? 'bg-brand-accent text-white' : 'bg-panel-secondary dark:bg-dark-panel-secondary text-text-primary dark:text-dark-text-primary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Refine */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary dark:text-dark-text-secondary">Auto Refine (Quality)</label>
        <div className="flex gap-2">
          {['Off', 'On'].map((label) => {
            const active = (label === 'On' ? autoRefine : !autoRefine);
            return (
              <button
                key={label}
                onClick={() => setAutoRefine(label === 'On')}
                className={`px-3 py-1 rounded-full text-xs border-2 border-border dark:border-dark-border transition ${
                  active ? 'bg-brand-accent text-white' : 'bg-panel-secondary dark:bg-dark-panel-secondary text-text-primary dark:text-dark-text-primary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Count */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary dark:text-dark-text-secondary">Prompt Count</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPromptCount((c) => Math.max(1, c - 1))}
            className="w-7 h-7 rounded-full bg-panel-secondary dark:bg-dark-panel-secondary border-2 border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary"
          >
            −
          </button>
          <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{promptCount}</span>
          <button
            onClick={() => setPromptCount((c) => Math.min(99, c + 1))}
            className="w-7 h-7 rounded-full bg-panel-secondary dark:bg-dark-panel-secondary border-2 border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary"
          >
            +
          </button>
        </div>
      </div>

      {/* Draft toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary dark:text-dark-text-secondary">Draft</label>
        <div className="flex gap-2">
          {['Off', 'On'].map((label) => {
            const active = (label === 'On' ? draft : !draft);
            return (
              <button
                key={label}
                onClick={() => setDraft(label === 'On')}
                className={`px-3 py-1 rounded-full text-xs border-2 border-border dark:border-dark-border transition ${
                  active ? 'bg-brand-accent text-white' : 'bg-panel-secondary dark:bg-dark-panel-secondary text-text-primary dark:text-dark-text-primary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Textarea */}
      <div>
        <label className="text-xs text-text-secondary dark:text-dark-text-secondary">Enter your prompt here...</label>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-2 w-full rounded-lg bg-dark-background/70 text-dark-text-primary placeholder:text-dark-text-secondary border-2 border-dark-border p-3 text-[12px] resize-none overflow-y-auto no-scrollbar cursor-text"
          style={{ height: editorHeight }}
          placeholder="Enter your prompt here..."
        />
        <div
          aria-label="Drag to open/resize editor"
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          className="mt-1 h-4 w-full rounded-md bg-panel-secondary dark:bg-dark-panel-secondary border-2 border-border dark:border-dark-border cursor-ns-resize select-none"
          style={{ touchAction: 'none' }}
        >
          <div className="grid grid-cols-3 h-full w-full pointer-events-none">
            <div className="h-full bg-background dark:bg-dark-background border-r border-border dark:border-dark-border"></div>
            <div className="h-full bg-background dark:bg-dark-background border-x border-border dark:border-dark-border"></div>
            <div className="h-full bg-background dark:bg-dark-background border-l border-border dark:border-dark-border"></div>
          </div>
        </div>

      </div>

      </div>

      {/* Footer buttons */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        <button
          onClick={handleClear}
          className="px-2 py-1 text-sm rounded-lg bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary"
        >
          Clear
        </button>
        <div className="relative inline-block group">
          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
            <div className="px-2 py-1 rounded-md bg-[#417D9B] text-white text-[11px] shadow-md w-[180px] text-center leading-tight">
              <div className="whitespace-nowrap">Generate for a</div>
              <div className="whitespace-nowrap">Quality Prompt Output</div>
            </div>
          </div>
          <button
            disabled={isSendDisabled || isGenerating}
            onClick={handleSend}
            aria-label="Generate for a Quality Prompt Output"
            aria-busy={isGenerating}
            className={`px-3 py-1 text-sm rounded-lg text-white font-medium transition-transform duration-150 active:scale-95 ${isGenerating ? 'bg-brand-accent animate-pulse cursor-wait opacity-90' : 'bg-brand-accent hover:bg-brand-accent/90'} disabled:opacity-60`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}