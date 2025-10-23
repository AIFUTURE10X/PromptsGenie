import React, { useRef, useState, useEffect } from 'react';

interface ImageDropZoneProps {
  onFiles?: (files: File[]) => void;
  isAnalyzing?: boolean;
  autoAnalyze?: boolean;
  onToggleAutoAnalyze?: (value: boolean) => void;
  // New: role-specific handlers
  onStyleFile?: (file?: File) => void;
  onSceneFile?: (file?: File) => void;
}

export default function ImageDropZone({ onFiles, isAnalyzing = false, autoAnalyze = true, onToggleAutoAnalyze, onStyleFile, onSceneFile }: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const styleInputRef = useRef<HTMLInputElement | null>(null);
  const sceneInputRef = useRef<HTMLInputElement | null>(null);
  const [selected, setSelected] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [stylePreview, setStylePreview] = useState<string | undefined>(undefined);
  const [scenePreview, setScenePreview] = useState<string | undefined>(undefined);

  const handleFiles = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    setSelected(images);
    onFiles?.(images);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    handleFiles(files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  // New: style & scene handlers
  const handleStyleClick = (e: React.MouseEvent) => { e.stopPropagation(); styleInputRef.current?.click(); };
  const handleSceneClick = (e: React.MouseEvent) => { e.stopPropagation(); sceneInputRef.current?.click(); };

  const handleStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    const file = files[0];
    if (stylePreview) { URL.revokeObjectURL(stylePreview); }
    if (file) {
      const url = URL.createObjectURL(file);
      setStylePreview(url);
      onStyleFile?.(file);
    } else {
      setStylePreview(undefined);
      onStyleFile?.(undefined);
    }
  };

  const handleSceneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    const file = files[0];
    if (scenePreview) { URL.revokeObjectURL(scenePreview); }
    if (file) {
      const url = URL.createObjectURL(file);
      setScenePreview(url);
      onSceneFile?.(file);
    } else {
      setScenePreview(undefined);
      onSceneFile?.(undefined);
    }
  };

  const clearSelection = () => {
    setSelected([]);
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    if (inputRef.current) inputRef.current.value = '';
    onFiles?.([]);
  };

  const clearStyle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (stylePreview) URL.revokeObjectURL(stylePreview);
    setStylePreview(undefined);
    onStyleFile?.(undefined);
    if (styleInputRef.current) styleInputRef.current.value = '';
  };

  const clearScene = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (scenePreview) URL.revokeObjectURL(scenePreview);
    setScenePreview(undefined);
    onSceneFile?.(undefined);
    if (sceneInputRef.current) sceneInputRef.current.value = '';
  };

  useEffect(() => {
    // create object URLs for previews
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return selected.map((f) => URL.createObjectURL(f));
    });
    // cleanup on unmount
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      if (stylePreview) URL.revokeObjectURL(stylePreview);
      if (scenePreview) URL.revokeObjectURL(scenePreview);
    };
  }, [selected]);

  return (
    <div
      className="relative h-full w-full bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border p-4 select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Analyzing overlay */}
      {isAnalyzing && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-xl"
          aria-busy="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-3">
            {previews[0] ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border dark:border-dark-border shadow-sm">
                <img
                  src={previews[0]}
                  alt="Analyzing image"
                  className="w-full h-full object-cover slow-spin"
                />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-full border-2 border-border dark:border-dark-border border-t-transparent animate-spin"
                role="status"
                aria-label="Analyzing"
              />
            )}
            <div className="px-3 py-1.5 rounded-md bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-xs text-text-primary dark:text-dark-text-primary">
              Analyzing…
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Upload Images</span>
            <span className="text-[11px] text-text-secondary dark:text-dark-text-secondary">Drag & drop or click</span>
            <span className="text-[11px] text-text-secondary dark:text-dark-text-secondary">Images only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-secondary dark:text-dark-text-secondary">Auto Analyze</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleAutoAnalyze?.(true); }}
                className={`px-2 py-1 text-xs rounded-md border-2 ${autoAnalyze ? 'bg-brand-accent text-white border-brand-accent' : 'bg-background dark:bg-dark-background border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary'}`}
              >
                On
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleAutoAnalyze?.(false); }}
                className={`px-2 py-1 text-xs rounded-md border-2 ${!autoAnalyze ? 'bg-brand-accent text-white border-brand-accent' : 'bg-background dark:bg-dark-background border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary'}`}
              >
                Off
              </button>
            </div>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                className="px-2 py-1 text-xs rounded-md bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary"
              >
                Clear ({selected.length})
              </button>
            )}
          </div>
        </div>

        {/* New: Style/Scene mini-slots */}
        <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Style slot */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 px-2 py-1 rounded-md bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-xs text-text-primary dark:text-dark-text-primary"
              onClick={handleStyleClick}
              title="Upload Style image"
            >
              <span>Style</span>
              <div className="w-8 h-8 rounded-md overflow-hidden bg-[#417D9B]/20 flex items-center justify-center">
                {stylePreview ? (
                  <img src={stylePreview} alt="Style" className="w-full h-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-text-secondary dark:text-dark-text-secondary">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </div>
            </button>
            {stylePreview && (
              <button
                type="button"
                className="px-2 py-1 rounded-md bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-xs"
                onClick={clearStyle}
              >
                Clear
              </button>
            )}
          </div>

          {/* Scene slot */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 px-2 py-1 rounded-md bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-xs text-text-primary dark:text-dark-text-primary"
              onClick={handleSceneClick}
              title="Upload Scene image"
            >
              <span>Scene</span>
              <div className="w-8 h-8 rounded-md overflow-hidden bg-[#417D9B]/20 flex items-center justify-center">
                {scenePreview ? (
                  <img src={scenePreview} alt="Scene" className="w-full h-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-text-secondary dark:text-dark-text-secondary">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </div>
            </button>
            {scenePreview && (
              <button
                type="button"
                className="px-2 py-1 rounded-md bg-background dark:bg-dark-background border-2 border-border dark:border-dark-border text-xs"
                onClick={clearScene}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {selected.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 select-none" aria-label="Add images">
              <div className="w-14 h-14 rounded-full bg-[#417D9B] flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M2 20a7 7 0 0 1 14 0"></path>
                  <path d="M19 9v4"></path>
                  <path d="M17 11h4"></path>
                </svg>
              </div>
              <span className="sr-only">Click to upload images</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 overflow-y-auto">
            {previews.map((src, idx) => (
              <div key={src} className="relative rounded-md overflow-hidden border-2 border-border dark:border-dark-border">
                <img src={src} alt={`Selected ${idx + 1}`} className="w-full h-24 object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
      {/* Hidden inputs for style and scene */}
      <input ref={styleInputRef} type="file" accept="image/*" className="hidden" onChange={handleStyleChange} />
      <input ref={sceneInputRef} type="file" accept="image/*" className="hidden" onChange={handleSceneChange} />
    </div>
  );
}