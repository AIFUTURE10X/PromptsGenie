import { useState } from 'react';
import { Zap, Sparkles, User, ImageIcon, Palette, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from './image-upload';
import { AnalyzerCard } from './analyzer-card';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import type { SpeedMode } from '../../lib/schemas';

export function ImageAnalyzer() {
  // Image states for each analyzer
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneFile, setSceneFile] = useState<File | null>(null);
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [styleFile, setStyleFile] = useState<File | null>(null);

  // Settings states
  const [speedMode, setSpeedMode] = useState<SpeedMode>('Fast');
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  // Prompt states
  const [subjectPrompt, setSubjectPrompt] = useState<string | null>(null);
  const [scenePrompt, setScenePrompt] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string | null>(null);

  // Combined prompt copy state
  const [copiedCombined, setCopiedCombined] = useState(false);

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

  const toggleSpeedMode = () => {
    setSpeedMode((prev) => (prev === 'Fast' ? 'Quality' : 'Fast'));
  };

  const toggleAutoAnalyze = () => {
    setAutoAnalyze((prev) => !prev);
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
      {/* Compact Settings Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3 px-4 lg:pr-0">
        <Button
          onClick={toggleSpeedMode}
          size="sm"
          variant={speedMode === 'Quality' ? 'default' : 'secondary'}
        >
          {speedMode === 'Fast' ? (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Fast
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Quality
            </>
          )}
        </Button>
        <Button
          onClick={toggleAutoAnalyze}
          size="sm"
          variant={autoAnalyze ? 'default' : 'secondary'}
        >
          {autoAnalyze ? (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Auto
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Manual
            </>
          )}
        </Button>
      </div>

      {/* 2-Column Layout: Images (Left) | Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        {/* LEFT COLUMN: Image Uploads */}
        <div className="px-4 lg:pl-0 lg:pr-0">
          <Card className="bg-[#F77000] backdrop-blur-sm border-[#F77000]">
            <CardContent className="p-4 space-y-4">
              {/* Subject Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold uppercase text-white">Subject</h3>
                  <User className="w-4 h-4 text-white" />
                </div>
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
              </div>

              {/* Scene Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold uppercase text-white">Scene</h3>
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
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
              </div>

              {/* Style Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold uppercase text-white">Style</h3>
                  <Palette className="w-4 h-4 text-white" />
                </div>
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="space-y-4 px-4 lg:pl-0 lg:pr-4">
          {/* Analyzer Cards + Combined Prompt - Horizontal Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
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
                  className="h-full"
                >
                  <Card className="h-full flex flex-col bg-[#F77000] backdrop-blur-sm border-[#F77000]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-white">Combined Prompt</CardTitle>
                          <p className="text-xs text-white/80 mt-0.5">
                            All three analyses combined
                          </p>
                        </div>
                        <Button
                          onClick={handleCopyCombined}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1.5"
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
                    <CardContent className="flex-1 flex flex-col pt-2">
                      <textarea
                        readOnly
                        value={combinedPrompt}
                        className="w-full flex-1 p-2.5 rounded-lg bg-black/20 border border-black/30 text-white resize-none focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
