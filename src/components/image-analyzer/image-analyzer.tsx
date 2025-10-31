import { useState } from 'react';
import { Zap, Sparkles, User, ImageIcon, Palette, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from './image-upload';
import { AnalyzerCard } from './analyzer-card';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
  const [copiedCombined, setCopiedCombined] = useState(false);

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

  // Combine all prompts into one text
  const combinedPrompt =
    [subjectPrompt, scenePrompt, stylePrompt].filter(Boolean).join(' ') || '';

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
          <Card className="bg-gradient-to-br from-[#ea663a]/10 to-[#ea663a]/5 backdrop-blur-sm border-[#ea663a]/30">
            <CardContent className="p-4 space-y-4">
              {/* Subject Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold uppercase text-blue-400">Subject</h3>
                  <User className="w-4 h-4 text-blue-400" />
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
                  <h3 className="text-sm font-semibold uppercase text-purple-400">Scene</h3>
                  <ImageIcon className="w-4 h-4 text-purple-400" />
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
                  <h3 className="text-sm font-semibold uppercase text-pink-400">Style</h3>
                  <Palette className="w-4 h-4 text-pink-400" />
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
          {/* Analyzer Cards - Horizontal Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Combined Prompts Section */}
          <AnimatePresence>
            {combinedPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-[#ea663a]/10 to-[#ea663a]/5 backdrop-blur-sm border-[#ea663a]/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-white">Combined Prompt</CardTitle>
                        <p className="text-sm text-green-100 mt-1">
                          All three analyses combined into one prompt
                        </p>
                      </div>
                      <Button
                        onClick={handleCopyCombined}
                        variant="secondary"
                        size="sm"
                        className="ml-4"
                      >
                        {copiedCombined ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy All
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      readOnly
                      value={combinedPrompt}
                      className="w-full min-h-32 p-4 rounded-lg bg-background/50 border border-primary/20 text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                      rows={4}
                    />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {subjectPrompt && (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-blue-400" />
                            <span className="font-medium text-blue-300">Subject</span>
                          </div>
                          <p className="text-xs text-blue-100/80">{subjectPrompt}</p>
                        </div>
                      )}
                      {scenePrompt && (
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-purple-400" />
                            <span className="font-medium text-purple-300">Scene</span>
                          </div>
                          <p className="text-xs text-purple-100/80">{scenePrompt}</p>
                        </div>
                      )}
                      {stylePrompt && (
                        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Palette className="w-4 h-4 text-pink-400" />
                            <span className="font-medium text-pink-300">Style</span>
                          </div>
                          <p className="text-xs text-pink-100/80">{stylePrompt}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
