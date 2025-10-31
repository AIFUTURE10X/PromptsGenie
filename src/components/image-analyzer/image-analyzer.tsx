import { useState } from 'react';
import { Zap, Sparkles, User, ImageIcon, Palette, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from './image-upload';
import { AnalyzerCard } from './analyzer-card';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { SpeedMode } from '../../lib/schemas';

export function ImageAnalyzer() {
  // Image mode: 'single' = one image for all, 'separate' = different images per analyzer
  const [imageMode, setImageMode] = useState<'single' | 'separate'>('single');

  // Single image mode states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Separate image mode states
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneFile, setSceneFile] = useState<File | null>(null);
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [styleFile, setStyleFile] = useState<File | null>(null);

  const [speedMode, setSpeedMode] = useState<SpeedMode>('Fast');
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [subjectPrompt, setSubjectPrompt] = useState<string | null>(null);
  const [scenePrompt, setScenePrompt] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string | null>(null);
  const [copiedCombined, setCopiedCombined] = useState(false);

  const handleImageSelect = (imageData: string, file: File) => {
    setSelectedImage(imageData);
    setSelectedFile(file);
  };

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

  const handleClear = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setSubjectPrompt(null);
    setScenePrompt(null);
    setStylePrompt(null);
  };

  const handleClearAll = () => {
    // Clear single mode
    setSelectedImage(null);
    setSelectedFile(null);
    // Clear separate mode
    setSubjectImage(null);
    setSubjectFile(null);
    setSceneImage(null);
    setSceneFile(null);
    setStyleImage(null);
    setStyleFile(null);
    // Clear prompts
    setSubjectPrompt(null);
    setScenePrompt(null);
    setStylePrompt(null);
  };

  const toggleImageMode = () => {
    setImageMode(prev => prev === 'single' ? 'separate' : 'single');
  };

  // Get the appropriate image for each analyzer based on mode
  const getSubjectImageData = () => imageMode === 'single' ? selectedImage : subjectImage;
  const getSceneImageData = () => imageMode === 'single' ? selectedImage : sceneImage;
  const getStyleImageData = () => imageMode === 'single' ? selectedImage : styleImage;

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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Mode Toggles */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            {/* Speed Mode Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold mb-2 text-white">Analysis Mode</h2>
                <p className="text-sm text-blue-100">
                  {speedMode === 'Fast'
                    ? 'Fast mode provides quick, concise analysis'
                    : 'Quality mode provides detailed, comprehensive analysis'}
                </p>
              </div>
              <Button
                onClick={toggleSpeedMode}
                size="lg"
                variant={speedMode === 'Quality' ? 'default' : 'secondary'}
                className="min-w-40"
              >
                {speedMode === 'Fast' ? (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Fast Mode
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Quality Mode
                  </>
                )}
              </Button>
            </div>

            {/* Image Mode Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-blue-500/20">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold mb-2 text-white">Image Mode</h2>
                <p className="text-sm text-blue-100">
                  {imageMode === 'single'
                    ? 'Use one image for all three analyzers'
                    : 'Upload different images for Subject, Scene, and Style'}
                </p>
              </div>
              <Button
                onClick={toggleImageMode}
                size="lg"
                variant={imageMode === 'separate' ? 'default' : 'secondary'}
                className="min-w-40"
              >
                {imageMode === 'single' ? (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Single Image
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Separate Images
                  </>
                )}
              </Button>
            </div>

            {/* Auto-Analyze Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-blue-500/20">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold mb-2 text-white">Auto-Analyze</h2>
                <p className="text-sm text-blue-100">
                  {autoAnalyze
                    ? 'Images are analyzed automatically when uploaded'
                    : 'Manual control - click Analyze button when ready'}
                </p>
              </div>
              <Button
                onClick={toggleAutoAnalyze}
                size="lg"
                variant={autoAnalyze ? 'default' : 'secondary'}
                className="min-w-40"
              >
                {autoAnalyze ? (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Auto ON
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Manual
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Upload - Single or Separate Mode */}
      {imageMode === 'single' ? (
        <>
          <motion.div layout>
            <ImageUpload
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onClear={handleClear}
              label="Upload an image for all analyzers"
            />
          </motion.div>

          {/* File Info */}
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Subject Image Upload */}
          <motion.div layout>
            <ImageUpload
              onImageSelect={handleSubjectImageSelect}
              selectedImage={subjectImage}
              onClear={() => {
                setSubjectImage(null);
                setSubjectFile(null);
                setSubjectPrompt(null);
              }}
              label="Upload Subject Image"
            />
          </motion.div>

          {/* Scene Image Upload */}
          <motion.div layout>
            <ImageUpload
              onImageSelect={handleSceneImageSelect}
              selectedImage={sceneImage}
              onClear={() => {
                setSceneImage(null);
                setSceneFile(null);
                setScenePrompt(null);
              }}
              label="Upload Scene Image"
            />
          </motion.div>

          {/* Style Image Upload */}
          <motion.div layout>
            <ImageUpload
              onImageSelect={handleStyleImageSelect}
              selectedImage={styleImage}
              onClear={() => {
                setStyleImage(null);
                setStyleFile(null);
                setStylePrompt(null);
              }}
              label="Upload Style Image"
            />
          </motion.div>
        </div>
      )}

      {/* Analyzer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyzerCard
          type="subject"
          title="Subject Analysis"
          description="Analyzes the main subject, appearance, and pose"
          imageData={getSubjectImageData()}
          speedMode={speedMode}
          autoAnalyze={autoAnalyze}
          icon={<User className="w-5 h-5 text-primary" />}
          onPromptChange={setSubjectPrompt}
        />
        <AnalyzerCard
          type="scene"
          title="Scene Analysis"
          description="Analyzes the environment, lighting, and atmosphere"
          imageData={getSceneImageData()}
          speedMode={speedMode}
          autoAnalyze={autoAnalyze}
          icon={<ImageIcon className="w-5 h-5 text-primary" />}
          onPromptChange={setScenePrompt}
        />
        <AnalyzerCard
          type="style"
          title="Style Analysis"
          description="Identifies artistic style and visual characteristics"
          imageData={getStyleImageData()}
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
            <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm border-green-500/20">
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
  );
}
