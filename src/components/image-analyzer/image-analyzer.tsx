import { useState, useRef, useEffect } from 'react';
import { Zap, Sparkles, User, ImageIcon, Palette, Copy, Check, ChevronDown, ChevronUp, Plus, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from './image-upload';
import { AnalyzerCard } from './analyzer-card';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ImageGenerator } from '../image-generator/image-generator';
import type { SpeedMode } from '../../lib/schemas';

interface ImageAnalyzerProps {
  speedMode?: SpeedMode;
  autoAnalyze?: boolean;
  onSpeedModeChange?: (mode: SpeedMode) => void;
  onAutoAnalyzeChange?: (auto: boolean) => void;
}

export function ImageAnalyzer({
  speedMode: externalSpeedMode,
  autoAnalyze: externalAutoAnalyze,
  onSpeedModeChange,
  onAutoAnalyzeChange
}: ImageAnalyzerProps = {}) {
  // Image states for each analyzer
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [subjectImage2, setSubjectImage2] = useState<string | null>(null);
  const [subjectFile2, setSubjectFile2] = useState<File | null>(null);
  const [showSubject2, setShowSubject2] = useState(false);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneFile, setSceneFile] = useState<File | null>(null);
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [styleFile, setStyleFile] = useState<File | null>(null);

  // Settings states - use props if provided, otherwise local state
  const [localSpeedMode, setLocalSpeedMode] = useState<SpeedMode>('Fast');
  const [localAutoAnalyze, setLocalAutoAnalyze] = useState(true);

  const speedMode = externalSpeedMode ?? localSpeedMode;
  const autoAnalyze = externalAutoAnalyze ?? localAutoAnalyze;

  // Prompt states
  const [subjectPrompt, setSubjectPrompt] = useState<string | null>(null);
  const [subjectPrompt2, setSubjectPrompt2] = useState<string | null>(null);
  const [scenePrompt, setScenePrompt] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string | null>(null);

  // Combined prompt copy state
  const [copiedCombined, setCopiedCombined] = useState(false);

  // Collapsible state for upload sections
  const [isExpanded, setIsExpanded] = useState(true);

  // Combined Prompt textarea customization state
  const [combinedFontSize, setCombinedFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('combinedPrompt_fontSize');
      return saved ? parseInt(saved) : 14;
    } catch {
      return 14;
    }
  });
  const [combinedHeight, setCombinedHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('combinedPrompt_height');
      return saved ? parseInt(saved) : 150;
    } catch {
      return 150;
    }
  });
  const combinedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isResizingCombined = useRef(false);
  const resizeStartXCombined = useRef(0);
  const resizeStartYCombined = useRef(0);
  const resizeStartWidthCombined = useRef(0);
  const resizeStartHeightCombined = useRef(0);

  // Combine prompts - merge both subject prompts if both exist
  const combinedSubjectPrompt = [subjectPrompt, subjectPrompt2]
    .filter(Boolean)
    .join(', ') || null;

  const combinedPrompt = [combinedSubjectPrompt, scenePrompt, stylePrompt]
    .filter(Boolean)
    .join(' ') || '';

  // Image handlers
  const handleSubjectImageSelect = (imageData: string, file: File) => {
    setSubjectImage(imageData);
    setSubjectFile(file);
  };

  const handleSubjectImage2Select = (imageData: string, file: File) => {
    setSubjectImage2(imageData);
    setSubjectFile2(file);
  };

  const handleSceneImageSelect = (imageData: string, file: File) => {
    setSceneImage(imageData);
    setSceneFile(file);
  };

  const handleStyleImageSelect = (imageData: string, file: File) => {
    setStyleImage(imageData);
    setStyleFile(file);
  };

  const handleCopyCombined = async () => {
    if (combinedPrompt) {
      await navigator.clipboard.writeText(combinedPrompt);
      setCopiedCombined(true);
      setTimeout(() => setCopiedCombined(false), 2000);
    }
  };

  // Combined Prompt font size handler
  const handleCombinedFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setCombinedFontSize(newSize);
    try {
      localStorage.setItem('combinedPrompt_fontSize', newSize.toString());
    } catch {
      // Silently fail if localStorage unavailable
    }
  };

  const getCombinedFontSizeLabel = (size: number) => {
    if (size <= 12) return 'Small';
    if (size <= 16) return 'Medium';
    return 'Large';
  };

  // Combined Prompt resize handlers
  const handleCombinedResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingCombined.current = true;
    document.body.style.userSelect = 'none';

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    resizeStartXCombined.current = clientX;
    resizeStartYCombined.current = clientY;
    resizeStartWidthCombined.current = combinedTextareaRef.current?.offsetWidth || 0;
    resizeStartHeightCombined.current = combinedTextareaRef.current?.offsetHeight || 0;
  };

  // Add resize event listeners
  useEffect(() => {
    const handleResizeMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizingCombined.current || !combinedTextareaRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaY = clientY - resizeStartYCombined.current;
      const newHeight = Math.max(96, resizeStartHeightCombined.current + deltaY);

      setCombinedHeight(newHeight);
    };

    const handleResizeEnd = () => {
      if (isResizingCombined.current) {
        isResizingCombined.current = false;
        document.body.style.userSelect = '';

        try {
          localStorage.setItem('combinedPrompt_height', combinedHeight.toString());
        } catch {
          // Silently fail if localStorage unavailable
        }
      }
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchmove', handleResizeMove);
    document.addEventListener('touchend', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
    };
  }, [combinedHeight]);

  return (
    <div className="w-full">
      {/* Responsive Layout: Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,350px)_1fr] gap-4 sm:gap-6">
        {/* LEFT COLUMN: Image Uploads */}
        <div className="px-4 sm:px-6 lg:pl-0 lg:pr-0">
          <Card className="bg-[#F77000] backdrop-blur-sm border-[#F77000]">
            <CardContent className="p-2 sm:p-3 space-y-2 sm:space-y-3">
              {/* Master Toggle Button */}
              <div className="flex items-center justify-between pb-2 border-b border-white/20">
                <h3 className="text-sm font-semibold text-white">Upload Images</h3>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  aria-label={isExpanded ? 'Collapse all sections' : 'Expand all sections'}
                  aria-expanded={isExpanded}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : 180 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white" />
                    )}
                  </motion.div>
                </button>
              </div>

              {/* Subject Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase text-white">Subject</h3>
                  <div className="flex items-center gap-2">
                    {!showSubject2 ? (
                      <button
                        onClick={() => setShowSubject2(true)}
                        className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title="Add second subject"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowSubject2(false);
                          setSubjectImage2(null);
                          setSubjectFile2(null);
                          setSubjectPrompt2(null);
                        }}
                        className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title="Remove second subject"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </button>
                    )}
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, width: '100%', x: 0 }}
                      animate={{ height: 'auto', opacity: 1, width: '100%', x: 0 }}
                      exit={{ height: 0, opacity: 0, width: '90%', x: 20 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ transformOrigin: 'right center', overflow: 'hidden' }}
                    >
                      <div className="space-y-2">
                        <ImageUpload
                          onImageSelect={handleSubjectImageSelect}
                          selectedImage={subjectImage}
                          onClear={() => {
                            setSubjectImage(null);
                            setSubjectFile(null);
                            setSubjectPrompt(null);
                          }}
                          label="Upload Subject 1"
                        />
                        {showSubject2 && (
                          <ImageUpload
                            onImageSelect={handleSubjectImage2Select}
                            selectedImage={subjectImage2}
                            onClear={() => {
                              setSubjectImage2(null);
                              setSubjectFile2(null);
                              setSubjectPrompt2(null);
                            }}
                            label="Upload Subject 2"
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Scene Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase text-white">Scene</h3>
                  <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, width: '100%', x: 0 }}
                      animate={{ height: 'auto', opacity: 1, width: '100%', x: 0 }}
                      exit={{ height: 0, opacity: 0, width: '90%', x: 20 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ transformOrigin: 'right center', overflow: 'hidden' }}
                    >
                      <ImageUpload
                        onImageSelect={handleSceneImageSelect}
                        selectedImage={sceneImage}
                        onClear={() => {
                          setSceneImage(null);
                          setSceneFile(null);
                          setScenePrompt(null);
                        }}
                        label="Upload Scene"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Style Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase text-white">Style</h3>
                  <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, width: '100%', x: 0 }}
                      animate={{ height: 'auto', opacity: 1, width: '100%', x: 0 }}
                      exit={{ height: 0, opacity: 0, width: '90%', x: 20 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ transformOrigin: 'right center', overflow: 'hidden' }}
                    >
                      <ImageUpload
                        onImageSelect={handleStyleImageSelect}
                        selectedImage={styleImage}
                        onClear={() => {
                          setStyleImage(null);
                          setStyleFile(null);
                          setStylePrompt(null);
                        }}
                        label="Upload Style"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="space-y-4 px-4 sm:px-6 lg:pl-0 lg:pr-4">
          {/* Analyzer Cards + Combined Prompt - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 items-stretch">
            <AnalyzerCard
              type="subject"
              title="Subject 1 Analysis"
              description="Analyzes the main subject, appearance, and pose"
              imageData={subjectImage}
              speedMode={speedMode}
              autoAnalyze={autoAnalyze}
              icon={<User className="w-5 h-5 text-primary" />}
              onPromptChange={setSubjectPrompt}
            />
            {showSubject2 && (
              <AnalyzerCard
                type="subject"
                title="Subject 2 Analysis"
                description="Analyzes the second subject, appearance, and pose"
                imageData={subjectImage2}
                speedMode={speedMode}
                autoAnalyze={autoAnalyze}
                icon={<User className="w-5 h-5 text-primary" />}
                onPromptChange={setSubjectPrompt2}
              />
            )}
            <AnalyzerCard
              type="scene"
              title="Scene Analysis"
              description="Analyzes the environment, lighting, and atmosphere"
              imageData={sceneImage}
              speedMode={speedMode}
              autoAnalyze={autoAnalyze}
              icon={<ImageIcon className="w-5 h-5 text-primary" />}
              onPromptChange={setScenePrompt}
            />
            <AnalyzerCard
              type="style"
              title="Style Analysis"
              description="Identifies artistic style and visual characteristics"
              imageData={styleImage}
              speedMode={speedMode}
              autoAnalyze={autoAnalyze}
              icon={<Palette className="w-5 h-5 text-primary" />}
              onPromptChange={setStylePrompt}
            />

            {/* Combined Prompt Card */}
            <AnimatePresence>
              {combinedPrompt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="h-full min-h-[200px] sm:min-h-[250px]"
                >
                  <Card className="h-full flex flex-col bg-[#F77000] backdrop-blur-sm border-[#F77000]">
                    <CardHeader className="pb-2 px-3 sm:px-6 cursor-grab active:cursor-grabbing">
                      <motion.div
                        drag
                        dragMomentum={false}
                        dragElastic={0}
                        whileDrag={{ scale: 1.02 }}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-white/60" />
                            <div>
                              <CardTitle className="text-sm sm:text-base text-white">Combined Prompt</CardTitle>
                              <p className="text-xs text-white/80 mt-0.5">
                                {showSubject2 ? 'All analyses combined' : 'All three analyses combined'}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={handleCopyCombined}
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-1.5 text-xs sm:text-sm w-full sm:w-auto"
                          >
                            {copiedCombined ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy All
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-2 px-3 sm:px-6">
                      <div className="relative flex-1">
                        <textarea
                          ref={combinedTextareaRef}
                          readOnly
                          value={combinedPrompt}
                          style={{
                            fontSize: `${combinedFontSize}px`,
                            height: `${combinedHeight}px`,
                            minHeight: '96px',
                          }}
                          className="w-full p-2 sm:p-2.5 rounded-lg bg-black/20 border border-black/30 text-white resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                        />

                        {/* Bottom-right control group */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/40 rounded-lg p-1.5 backdrop-blur-sm">
                          {/* Font size slider */}
                          <div className="flex items-center gap-1.5">
                            <label
                              htmlFor="combinedFontSize"
                              className="text-xs text-white/80 font-semibold"
                              aria-label="Font size control"
                            >
                              A
                            </label>
                            <input
                              id="combinedFontSize"
                              type="range"
                              min="12"
                              max="20"
                              step="2"
                              value={combinedFontSize}
                              onChange={handleCombinedFontSizeChange}
                              className="w-16 h-1 bg-white/30 rounded-lg cursor-pointer"
                              aria-label="Adjust font size"
                              aria-valuemin={12}
                              aria-valuemax={20}
                              aria-valuenow={combinedFontSize}
                              aria-valuetext={getCombinedFontSizeLabel(combinedFontSize)}
                            />
                            <span className="text-xs text-white/60 min-w-[3rem] text-right">
                              {getCombinedFontSizeLabel(combinedFontSize)}
                            </span>
                          </div>

                          {/* Resize handle */}
                          <div
                            onMouseDown={handleCombinedResizeStart}
                            onTouchStart={handleCombinedResizeStart}
                            className="cursor-nwse-resize p-1 hover:bg-white/10 rounded transition-colors touch-none"
                            aria-label="Resize textarea"
                            role="button"
                            tabIndex={0}
                          >
                            <svg
                              className="w-4 h-4 text-white/60"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <path d="M10 14l4-4M14 14l-4-4" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Image Generator Section - Full Width Below Analyzer Cards */}
          <ImageGenerator
            prompt={combinedPrompt}
            subjectPrompt={combinedSubjectPrompt}
            scenePrompt={scenePrompt}
            stylePrompt={stylePrompt}
          />
        </div>
      </div>
    </div>
  );
}
