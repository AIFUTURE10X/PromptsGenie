import { useState } from 'react';
import { Zap, Sparkles, User, ImageIcon, Palette, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [scenePrompt, setScenePrompt] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string | null>(null);

  // Combined prompt copy state
  const [copiedCombined, setCopiedCombined] = useState(false);

  // Collapsible state for upload sections
  const [isExpanded, setIsExpanded] = useState(true);

  // Combine prompts
  const combinedPrompt = [subjectPrompt, scenePrompt, stylePrompt]
    .filter(Boolean)
    .join(' ') || '';

  // Image handlers
  const handleSubjectImageSelect = (imageData: string, file: File) => {
    setSubjectImage(imageData);
    setSubjectFile(file);
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

  return (
    <div className="w-full">
      {/* Responsive Layout: Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,350px)_1fr] gap-4 sm:gap-6">
        {/* LEFT COLUMN: Image Uploads */}
        <div className="px-4 sm:px-6 lg:pl-0 lg:pr-0">
          <Card className="bg-[#F77000] backdrop-blur-sm border-[#F77000]">
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
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
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
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
                        onImageSelect={handleSubjectImageSelect}
                        selectedImage={subjectImage}
                        onClear={() => {
                          setSubjectImage(null);
                          setSubjectFile(null);
                          setSubjectPrompt(null);
                        }}
                        label="Upload Subject"
                      />
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
              title="Subject Analysis"
              description="Analyzes the main subject, appearance, and pose"
              imageData={subjectImage}
              speedMode={speedMode}
              autoAnalyze={autoAnalyze}
              icon={<User className="w-5 h-5 text-primary" />}
              onPromptChange={setSubjectPrompt}
            />
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
                    <CardHeader className="pb-2 px-3 sm:px-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm sm:text-base text-white">Combined Prompt</CardTitle>
                          <p className="text-xs text-white/80 mt-0.5">
                            All three analyses combined
                          </p>
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
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-2 px-3 sm:px-6">
                      <textarea
                        readOnly
                        value={combinedPrompt}
                        className="w-full flex-1 p-2 sm:p-2.5 rounded-lg bg-black/20 border border-black/30 text-white resize-none focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Image Generator Section - Full Width Below Analyzer Cards */}
          <ImageGenerator prompt={combinedPrompt} />
        </div>
      </div>
    </div>
  );
}
