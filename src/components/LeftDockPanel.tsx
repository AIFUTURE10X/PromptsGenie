import React from "react";

type EffectType = "none" | "grain" | "particles";

interface LeftDockPanelProps {
  effect: EffectType;
  onEffectChange: (value: EffectType) => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  effectOpacity: number;
  onEffectOpacityChange: (value: number) => void;
  grainScale: number;
  onGrainScaleChange: (value: number) => void;
  onReset?: () => void;
}

export default function LeftDockPanel({
  effect,
  onEffectChange,
  opacity,
  onOpacityChange,
  effectOpacity,
  onEffectOpacityChange,
  grainScale,
  onGrainScaleChange,
  onReset,
}: LeftDockPanelProps) {
  return (
    <div className="bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border p-3 h-full w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-wider text-text-secondary dark:text-dark-text-secondary">DOCK</span>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-2 py-1 text-[10px] rounded-md border-2 border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary hover:border-accent"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Effect */}
        <div>
          <label className="block text-[11px] text-text-secondary dark:text-dark-text-secondary mb-1">Canvas Effect</label>
          <select
            value={effect}
            onChange={(e) => onEffectChange(e.target.value as EffectType)}
            className="w-full text-xs rounded-md border-2 border-border dark:border-dark-border bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary px-2 py-1"
          >
            <option value="none">None</option>
            <option value="grain">Grain</option>
            <option value="particles">Particles</option>
          </select>
        </div>

        {/* Base Opacity */}
        <div>
          <label className="block text-[11px] text-text-secondary dark:text-dark-text-secondary mb-1">
            Base Opacity <span className="ml-1 text-[10px]">{opacity.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Effect Opacity */}
        <div>
          <label className="block text-[11px] text-text-secondary dark:text-dark-text-secondary mb-1">
            Overlay Opacity <span className="ml-1 text-[10px]">{effectOpacity.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={effectOpacity}
            onChange={(e) => onEffectOpacityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Grain Scale */}
        <div>
          <label className="block text-[11px] text-text-secondary dark:text-dark-text-secondary mb-1">
            Grain Scale <span className="ml-1 text-[10px]">{grainScale}</span>
          </label>
          <input
            type="range"
            min={80}
            max={320}
            step={20}
            value={grainScale}
            onChange={(e) => onGrainScaleChange(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>

        <p className="text-[10px] text-text-secondary dark:text-dark-text-secondary">Visible on xl+ screens. On smaller screens, use default canvas settings.</p>
      </div>
    </div>
  );
}