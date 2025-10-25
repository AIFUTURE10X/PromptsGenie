import React, { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from "../lib/utils";

export type RewriteStyle = 'Descriptive' | 'Concise' | 'Marketing' | 'Technical';
export type SpeedMode = 'Fast' | 'Quality';

interface DM2PromptEditorProps {
  onSend: (finalPrompt: string) => void;
  onClear?: () => void;
  onReanalyze?: () => void;
  initialText?: string;
  onResizeStart?: () => void;
  onResizeEnd?: (height: number) => void;
  // Added: allow App to control/read speed mode
  initialSpeedMode?: SpeedMode;
  onSpeedModeChange?: (mode: SpeedMode) => void;
  // Style/Scene descriptors and toggles
  styleDesc?: string;
  sceneDesc?: string;
  useStyle?: boolean;
  useScene?: boolean;
  onToggleStyle?: (v: boolean) => void;
  onToggleScene?: (v: boolean) => void;
}

export default function DM2PromptEditor({ onSend, onClear, onReanalyze, initialText, onResizeStart, onResizeEnd, initialSpeedMode, onSpeedModeChange, styleDesc = "", sceneDesc = "", useStyle = true, useScene = true, onToggleStyle, onToggleScene }: DM2PromptEditorProps) {
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>('Descriptive');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('Fast');
  const [autoRefine, setAutoRefine] = useState<boolean>(true);
  const [promptCount, setPromptCount] = useState<number>(1);
  const [draft, setDraft] = useState<boolean>(false);
  
  // Animation states for send button
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showRipple, setShowRipple] = useState<boolean>(false);
  const [showPulse, setShowPulse] = useState<boolean>(false);
  const [text, setText] = useState<string>('');
  const [editorHeight, setEditorHeight] = useState<number>(200);

  useEffect(() => {
    if (typeof initialText !== 'undefined') {
      setText(initialText);
    }
  }, [initialText]);

  // Sync incoming speed mode from parent if provided
  useEffect(() => {
    if (typeof initialSpeedMode !== 'undefined') {
      setSpeedMode(initialSpeedMode);
    }
  }, [initialSpeedMode]);

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

  const isSendDisabled = useMemo(() => {
    const disabled = text.trim().length === 0;
    console.log('DM2PromptEditor isSendDisabled:', disabled, 'text length:', text.length, 'trimmed length:', text.trim().length);
    return disabled;
  }, [text]);

  const handleSend = () => {
    console.log('DM2PromptEditor handleSend called with text:', text);
    
    // Trigger animations
    setIsAnimating(true);
    setShowRipple(true);
    setShowPulse(true);
    
    // Reset animations after they complete
    setTimeout(() => {
      setIsAnimating(false);
      setShowRipple(false);
    }, 600);
    
    setTimeout(() => {
      setShowPulse(false);
    }, 800);
    
    // Stub rewrite: build final prompt matching controls
    const header = `[${rewriteStyle} | ${speedMode}${autoRefine ? ' +AutoRefine' : ''} | count:${promptCount}${draft ? ' | draft' : ''}]`;
    const finalPrompt = `${header}\n\n${text.trim()}`;
    console.log('DM2PromptEditor sending finalPrompt:', finalPrompt);
    onSend(finalPrompt);
  };

  const handleClear = () => {
    // Clear only the editor controls and text
    setText('');
    setDraft(false);
    setPromptCount(1);
    setAutoRefine(true);
    setSpeedMode('Fast');
    setRewriteStyle('Descriptive');
    setEditorHeight(200);
    onSpeedModeChange?.('Fast');
  };

  const handleClearAll = () => {
    // Delegate full app-wide clearing to parent
    onClear?.();
  };

  return (
    <div className="bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border p-4 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Prompt Editor</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3" style={{ alignItems: 'flex-start' }}>

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
              onClick={() => { setSpeedMode(m); onSpeedModeChange?.(m); }}
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
      <div className="-mt-6">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPointerDown={onTextAreaPointerDown}
          onPointerMove={onTextAreaPointerMove}
          onPointerUp={onTextAreaPointerUp}
          className="w-full rounded-lg bg-dark-background/70 text-dark-text-primary placeholder:text-dark-text-secondary border-2 border-dark-border text-[12px] resize-none overflow-y-auto no-scrollbar cursor-text custom-text-cursor prompt-editor text-box"
          style={{ height: editorHeight, margin: 0, padding: '4px 12px 8px 12px' }}
          placeholder="Enter your prompt here..."
        />
        <div
          aria-label="Drag to open/resize editor"
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          className="mt-1 h-4 w-full rounded-md bg-panel-secondary dark:bg-dark-panel-secondary border-2 border-border dark:border-dark-border flex items-center justify-center cursor-ns-resize select-none"
          style={{ touchAction: 'none' }}
        >
          <div className="w-10 h-[2px] rounded bg-border dark:bg-dark-border" />
        </div>

      </div>

      </div>

      {/* Footer buttons */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="px-2 py-1 text-sm rounded-lg bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary"
          >
            Clear
          </button>
          <button
            onClick={handleClearAll}
            className="px-2 py-1 text-sm rounded-lg bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary"
            title="Clear all panels: editor, images, and prompt"
          >
            Clear All
          </button>
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              className="px-2 py-1 text-sm rounded-lg border-2 text-white"
              style={{ backgroundColor: '#782629', borderColor: '#782629' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a1d20'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#782629'}
              title="Reanalyze all uploaded images"
            >
              Reanalyze
            </button>
          )}
        </div>
        <button
          disabled={isSendDisabled}
          onClick={() => {
            console.log('DM2PromptEditor Send button clicked, disabled:', isSendDisabled);
            handleSend();
          }}
          className={cn(
            "px-3 py-1 text-sm rounded-lg bg-brand-accent hover:bg-brand-accent/90 text-white font-medium disabled:opacity-60",
            "send-button",
            {
              "animate-click": isAnimating,
              "ripple": showRipple,
              "pulse": showPulse
            }
          )}
        >
          Send
        </button>
      </div>

    </div>
  );
}