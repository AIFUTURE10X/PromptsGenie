import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, Wand2, Edit3, GripVertical, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { AspectRatioSelector } from './aspect-ratio-selector';
import { ImageGrid } from './image-grid';
import { EnhancementModal } from './enhancement-modal';

interface GeneratedImage {
  index: number;
  imageData: string;
  mimeType: string;
  prompt?: string;
}

interface ImageGeneratorProps {
  prompt: string;
  subjectPrompt?: string | null;
  scenePrompt?: string | null;
  stylePrompt?: string | null;
  subjectImage?: string | null;
  subjectImage2?: string | null;
  sceneImage?: string | null;
  styleImage?: string | null;
}

export function ImageGenerator({ prompt, subjectPrompt, scenePrompt, stylePrompt, subjectImage, subjectImage2, sceneImage, styleImage }: ImageGeneratorProps) {
  const [imageCount, setImageCount] = useState(2);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [modelInfo, setModelInfo] = useState<string | null>(null);

  // Prompt enhancement states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [isEditingEnhanced, setIsEditingEnhanced] = useState(false);

  // Combined prompt editing states
  const [isEditingCombined, setIsEditingCombined] = useState(false);
  const [editedCombinedPrompt, setEditedCombinedPrompt] = useState<string>('');
  const [hasEditedCombined, setHasEditedCombined] = useState(false);

  const [styleIntensity, setStyleIntensity] = useState<'subtle' | 'moderate' | 'strong'>('moderate');
  const [preciseReference, setPreciseReference] = useState(false);

  // Style preset state
  type StylePreset = 'custom' | 'ghibli' | 'photorealistic' | 'anime';
  const [stylePreset, setStylePreset] = useState<StylePreset>('custom');

  // Style preset configurations
  const STYLE_PRESETS = {
    ghibli: {
      styleIntensity: 'strong' as const,
      preciseReference: false,
      description: 'Studio Ghibli style - Hand-drawn watercolor aesthetic with soft edges and whimsical atmosphere'
    },
    photorealistic: {
      styleIntensity: 'subtle' as const,
      preciseReference: true,
      description: 'Photorealistic - Preserves subject accuracy with minimal style application'
    },
    anime: {
      styleIntensity: 'strong' as const,
      preciseReference: false,
      description: 'Modern Anime - Sharp cel-shading with vibrant colors and clean line art'
    },
    custom: {
      styleIntensity: 'moderate' as const,
      preciseReference: false,
      description: 'Custom - Manual control of all settings'
    }
  };

  // Apply preset configuration
  const applyStylePreset = (preset: StylePreset) => {
    setStylePreset(preset);
    const config = STYLE_PRESETS[preset];
    setStyleIntensity(config.styleIntensity);
    setPreciseReference(config.preciseReference);
  };

  // Tab and modal states
  const [activeTab, setActiveTab] = useState<'combined' | 'enhanced'>('combined');
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);

  // Prompt card expansion state
  const [promptCardHeight, setPromptCardHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('promptCard_height');
      return saved ? parseInt(saved) : 200;
    } catch {
      return 200;
    }
  });
  const [promptCardWidth, setPromptCardWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('promptCard_width');
      return saved ? parseInt(saved) : 100; // Percentage
    } catch {
      return 100;
    }
  });
  const promptCardRef = useRef<HTMLDivElement>(null);
  const isExpandingPromptCard = useRef(false);
  const expandStartXPrompt = useRef(0);
  const expandStartYPrompt = useRef(0);
  const expandStartWidthPrompt = useRef(0);
  const expandStartHeightPrompt = useRef(0);

  const handleEnhancePrompt = async () => {
    if (!prompt || prompt.trim().length === 0) {
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/gemini-enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          subjectPrompt: subjectPrompt || null,
          scenePrompt: scenePrompt || null,
          stylePrompt: stylePrompt || null,
          styleIntensity: styleIntensity,
          preciseReference: preciseReference
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to enhance prompt');
      }

      setEnhancedPrompt(data.enhancedPrompt);
      setActiveTab('enhanced'); // Switch to enhanced tab after successful enhancement
    } catch (err) {
      console.error('Prompt enhancement error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateClick = () => {
    // Check user preference
    const preference = localStorage.getItem('promptEnhancementPreference');

    // If user is on combined tab and has no preference set, show modal
    if (activeTab === 'combined' && !preference) {
      setShowEnhancementModal(true);
      return;
    }

    // If preference is to enhance and we're on combined tab, run enhancement first
    if (activeTab === 'combined' && preference === 'enhanced' && !enhancedPrompt) {
      handleEnhancePrompt().then(() => {
        // After enhancement, generate will be called from the enhanced tab
        handleGenerate();
      });
      return;
    }

    // Otherwise, generate with current tab's prompt
    handleGenerate();
  };

  const handleGenerate = async () => {
    // Use edited combined prompt if user has edited it, otherwise use auto-generated
    const combinedPromptToUse = hasEditedCombined ? editedCombinedPrompt : prompt;
    const finalPrompt = activeTab === 'enhanced' ? enhancedPrompt : combinedPromptToUse;

    if (!finalPrompt || finalPrompt.trim().length === 0) {
      setError('Please provide a prompt from the image analyzer above');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setModelInfo(null);

    try {
      // Prepare reference images for Imagen 3 customization
      const referenceImages = [];

      // Add subject image(s) as REFERENCE_TYPE_SUBJECT
      // Validate that imageData exists and is not empty
      if (subjectImage && subjectImage.trim().length > 0) {
        referenceImages.push({
          referenceId: 1,
          referenceType: 'REFERENCE_TYPE_SUBJECT',
          subjectType: 'SUBJECT_TYPE_PERSON',
          imageData: subjectImage
        });
      }
      if (subjectImage2 && subjectImage2.trim().length > 0) {
        referenceImages.push({
          referenceId: 1, // Same ID as first subject to group them together
          referenceType: 'REFERENCE_TYPE_SUBJECT',
          subjectType: 'SUBJECT_TYPE_PERSON',
          imageData: subjectImage2
        });
      }

      // Add style image as REFERENCE_TYPE_STYLE
      if (styleImage && styleImage.trim().length > 0) {
        referenceImages.push({
          referenceId: 2,
          referenceType: 'REFERENCE_TYPE_STYLE',
          styleDescription: stylePrompt || 'artistic style',
          imageData: styleImage
        });
      }

      console.log(`📸 Frontend: Prepared ${referenceImages.length} reference image(s) for API`);
      referenceImages.forEach((ref, idx) => {
        console.log(`  ${idx + 1}. Type: ${ref.referenceType}, ID: ${ref.referenceId}, Data length: ${ref.imageData?.length || 0}`);
      });

      // Note: Imagen 3 doesn't have REFERENCE_TYPE_SCENE, so we'll use scene info in the prompt only

      const response = await fetch('/.netlify/functions/gemini-image-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          count: imageCount,
          aspectRatio,
          seed,
          referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
          useCustomization: referenceImages.length > 0
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate images');
      }

      // Add the prompt to each generated image
      const imagesWithPrompt = data.images.map((img: GeneratedImage) => ({
        ...img,
        prompt: finalPrompt
      }));
      setGeneratedImages(imagesWithPrompt);

      // Display model info if fallback was used
      if (data.fallbackUsed) {
        setModelInfo('⚠️ Using Imagen 2 (Imagen 3 quota exceeded)');
      } else if (data.modelUsed) {
        setModelInfo(`✓ Generated with ${data.modelUsed}`);
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = () => {
    setGeneratedImages([]);
    setError(null);
  };

  const handleDeleteImage = (index: number) => {
    setGeneratedImages(prevImages => prevImages.filter(img => img.index !== index));
  };

  // Prompt card expansion handlers (drag to expand width and height)
  const handlePromptExpandStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isExpandingPromptCard.current = true;
    document.body.style.userSelect = 'none';

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    expandStartXPrompt.current = clientX;
    expandStartYPrompt.current = clientY;
    expandStartWidthPrompt.current = promptCardRef.current?.offsetWidth || 0;
    expandStartHeightPrompt.current = promptCardHeight;
  };

  // Expansion event listeners
  useEffect(() => {
    const handleExpandMove = (e: MouseEvent | TouchEvent) => {
      if (!isExpandingPromptCard.current || !promptCardRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - expandStartXPrompt.current;
      const deltaY = clientY - expandStartYPrompt.current;

      // Calculate new width as percentage of parent container
      const parentWidth = promptCardRef.current.parentElement?.offsetWidth || 1;
      const newWidthPx = Math.max(300, expandStartWidthPrompt.current + deltaX);
      const newWidthPercent = Math.min(100, Math.max(50, (newWidthPx / parentWidth) * 100));

      // Calculate new height
      const newHeight = Math.max(150, expandStartHeightPrompt.current + deltaY);

      setPromptCardWidth(newWidthPercent);
      setPromptCardHeight(newHeight);
    };

    const handleExpandEnd = () => {
      if (isExpandingPromptCard.current) {
        isExpandingPromptCard.current = false;
        document.body.style.userSelect = '';
        try {
          localStorage.setItem('promptCard_height', promptCardHeight.toString());
          localStorage.setItem('promptCard_width', promptCardWidth.toString());
        } catch {
          // Silently fail
        }
      }
    };

    document.addEventListener('mousemove', handleExpandMove);
    document.addEventListener('mouseup', handleExpandEnd);
    document.addEventListener('touchmove', handleExpandMove);
    document.addEventListener('touchend', handleExpandEnd);

    return () => {
      document.removeEventListener('mousemove', handleExpandMove);
      document.removeEventListener('mouseup', handleExpandEnd);
      document.removeEventListener('touchmove', handleExpandMove);
      document.removeEventListener('touchend', handleExpandEnd);
    };
  }, [promptCardHeight, promptCardWidth]);

  if (!prompt) {
    return null; // Don't show generator if there's no prompt
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="bg-[#F77000] backdrop-blur-sm border-[#F77000]">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                Image Generator
              </CardTitle>
              <p className="text-xs sm:text-sm text-black mt-1">
                {activeTab === 'enhanced' ? 'Gemini Flash 2.5 + Imagen 3' : 'Imagen 3'}
              </p>
            </div>
            {generatedImages.length > 0 && (
              <Button
                onClick={handleClearAll}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-3 sm:px-6">
          {/* Single Row Settings */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-white uppercase">Settings</label>

            {/* Style Preset Dropdown - Full Width */}
            <div className="flex flex-col">
              <label className="text-xs text-white/80 mb-1">Style Preset</label>
              <select
                value={stylePreset}
                onChange={(e) => applyStylePreset(e.target.value as StylePreset)}
                className="px-3 py-2 rounded-md bg-white border border-black/30 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black/50 font-medium"
              >
                <option value="ghibli">🎨 Studio Ghibli - Hand-drawn watercolor aesthetic</option>
                <option value="anime">✨ Modern Anime - Sharp cel-shading style</option>
                <option value="photorealistic">📸 Photorealistic - Preserves subject accuracy</option>
                <option value="custom">⚙️ Custom - Manual control</option>
              </select>
            </div>

            {/* Preset Description */}
            <div className="p-2 rounded bg-white/10 border border-white/20">
              <p className="text-xs text-white/90">
                {STYLE_PRESETS[stylePreset].description}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Number of Images Dropdown */}
              <div className="flex flex-col">
                <label className="text-xs text-white/80 mb-1">Images</label>
                <select
                  value={imageCount}
                  onChange={(e) => setImageCount(parseInt(e.target.value))}
                  className="px-3 py-2 rounded-md bg-white border border-black/30 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black/50"
                >
                  <option value={1}>1 Image</option>
                  <option value={2}>2 Images</option>
                </select>
              </div>

              {/* Aspect Ratio Dropdown */}
              <div className="flex flex-col">
                <label className="text-xs text-white/80 mb-1">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="px-3 py-2 rounded-md bg-white border border-black/30 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black/50"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="4:3">4:3 Classic</option>
                  <option value="3:4">3:4 Portrait</option>
                </select>
              </div>

              {/* Seed Input */}
              <div className="flex flex-col">
                <label className="text-xs text-white/80 mb-1">Seed</label>
                <input
                  type="number"
                  value={seed ?? ''}
                  onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Random"
                  className="px-3 py-2 rounded-md bg-white border border-black/30 text-black text-sm placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-black/50"
                />
              </div>

              {/* Precise Reference Toggle */}
              <div className="flex flex-col justify-end">
                <label className="text-xs text-white/80 mb-1">Precise Reference</label>
                <button
                  onClick={() => {
                    setPreciseReference(!preciseReference);
                    if (stylePreset !== 'custom') setStylePreset('custom');
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    preciseReference
                      ? 'bg-white text-black'
                      : 'bg-black/20 text-white hover:bg-black/30'
                  }`}
                  title={preciseReference
                    ? "Precise mode ON - Uses uploaded image for precise outputs"
                    : "Precise mode OFF - Whisk will caption and interpret your image"}
                >
                  <span className={`w-2 h-2 rounded-full ${preciseReference ? 'bg-black' : 'bg-white'}`}></span>
                  {preciseReference ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Precise Reference Info */}
            {preciseReference && (
              <div className="p-2 rounded bg-yellow-500/20 border border-yellow-500/30">
                <p className="text-xs text-yellow-100">
                  Precise mode directly uses your uploaded image for more precise outputs. When turned off, Whisk will caption and interpret your image for a more creative output.
                </p>
              </div>
            )}
          </div>

          {/* Style Intensity Control */}
          {stylePrompt && (
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-white uppercase">
                Style Intensity (Accuracy vs Creativity)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['subtle', 'moderate', 'strong'] as const).map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => {
                      setStyleIntensity(intensity);
                      if (stylePreset !== 'custom') setStylePreset('custom');
                    }}
                    className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-md font-bold text-xs sm:text-sm transition-all capitalize ${
                      styleIntensity === intensity
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-black/20 text-white hover:bg-black/30'
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/70">
                {styleIntensity === 'subtle' && 'Photorealistic base with subtle style hints - best for preserving subject accuracy'}
                {styleIntensity === 'moderate' && 'Balanced style application while maintaining realism'}
                {styleIntensity === 'strong' && 'Full artistic interpretation - may modify subject appearance'}
              </p>
            </div>
          )}

          {/* Tabbed Prompt Display */}
          <div className="space-y-2">
            {/* Tab Headers */}
            <div className="flex items-center gap-2 border-b border-white/20 pb-2">
              <GripVertical className="w-4 h-4 text-white/60" />
              <button
                onClick={() => setActiveTab('combined')}
                className={`px-3 py-1.5 rounded-t-md text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'combined'
                    ? 'bg-white text-black'
                    : 'bg-black/20 text-white/60 hover:text-white hover:bg-black/30'
                }`}
              >
                Combined Prompt
                {activeTab === 'combined' && <span className="ml-2 text-xs">({prompt.split(' ').length} words)</span>}
              </button>
              {enhancedPrompt && (
                <button
                  onClick={() => setActiveTab('enhanced')}
                  className={`px-3 py-1.5 rounded-t-md text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 ${
                    activeTab === 'enhanced'
                      ? 'bg-white text-black'
                      : 'bg-black/20 text-white/60 hover:text-white hover:bg-black/30'
                  }`}
                >
                  ✨ Enhanced Prompt
                  {activeTab === 'enhanced' && <span className="ml-1 text-xs">({enhancedPrompt.split(' ').length} words)</span>}
                </button>
              )}
            </div>

            {/* Tab Content */}
            <motion.div
              ref={promptCardRef}
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                width: `${promptCardWidth}%`,
                minHeight: `${promptCardHeight}px`
              }}
            >
              {activeTab === 'combined' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/60">
                      {hasEditedCombined ? 'Manually edited prompt' : 'Auto-generated from image analysis'}
                    </p>
                    <div className="flex items-center gap-2">
                      {hasEditedCombined && (
                        <button
                          onClick={() => {
                            setHasEditedCombined(false);
                            setEditedCombinedPrompt('');
                            setIsEditingCombined(false);
                          }}
                          className="text-xs text-white/80 hover:text-white flex items-center gap-1"
                          title="Reset to auto-generated prompt"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => setIsEditingCombined(!isEditingCombined)}
                        className="text-xs text-white/80 hover:text-white flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        {isEditingCombined ? 'Done' : 'Edit'}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    {isEditingCombined ? (
                      <textarea
                        value={hasEditedCombined ? editedCombinedPrompt : prompt}
                        onChange={(e) => {
                          setEditedCombinedPrompt(e.target.value);
                          setHasEditedCombined(true);
                        }}
                        className="w-full h-full min-h-[150px] p-2.5 sm:p-3 rounded-lg bg-black/20 border border-black/30 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    ) : (
                      <div className="p-2.5 sm:p-3 rounded-lg bg-black/20 border border-black/30 overflow-y-auto h-full min-h-[150px]">
                        <p className="text-sm text-white whitespace-pre-wrap break-words">
                          {hasEditedCombined ? editedCombinedPrompt : prompt}
                        </p>
                      </div>
                    )}
                  </div>
                  {!enhancedPrompt && !isEnhancing && (
                    <Button
                      onClick={handleEnhancePrompt}
                      variant="secondary"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Enhance with Gemini AI
                    </Button>
                  )}
                  {isEnhancing && (
                    <div className="p-3 rounded-lg bg-black/20 border border-black/30 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-white animate-spin flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-white">Enhancing prompt with Gemini Flash 2.5...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/60">AI-enhanced with scene preservation & quality modifiers</p>
                    <button
                      onClick={() => setIsEditingEnhanced(!isEditingEnhanced)}
                      className="text-xs text-white/80 hover:text-white flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      {isEditingEnhanced ? 'Done' : 'Edit'}
                    </button>
                  </div>
                  <div className="relative">
                    {isEditingEnhanced ? (
                      <textarea
                        value={enhancedPrompt}
                        onChange={(e) => setEnhancedPrompt(e.target.value)}
                        className="w-full h-full min-h-[150px] p-2.5 sm:p-3 rounded-lg bg-black/20 border border-black/30 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    ) : (
                      <div className="p-2.5 sm:p-3 rounded-lg bg-black/20 border border-black/30 overflow-y-auto h-full min-h-[150px]">
                        <p className="text-sm text-white whitespace-pre-wrap break-words">{enhancedPrompt}</p>
                      </div>
                    )}

                    {/* Bottom-right expand handle */}
                    <div className="absolute bottom-2 right-2 bg-black/40 rounded-lg p-1.5 backdrop-blur-sm">
                      {/* Drag to expand handle */}
                      <div
                        onMouseDown={handlePromptExpandStart}
                        onTouchStart={handlePromptExpandStart}
                        className="cursor-nwse-resize p-1 hover:bg-white/10 rounded transition-colors touch-none"
                        aria-label="Drag to expand card (width and height)"
                        role="button"
                        tabIndex={0}
                      >
                        <GripVertical className="w-4 h-4 text-white/60" />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleEnhancePrompt}
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Re-enhance Prompt
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateClick}
            disabled={isGenerating || isEnhancing || !prompt}
            className="w-full py-4 sm:py-6 text-base sm:text-lg font-bold"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                <span className="hidden sm:inline">Generating {imageCount} {imageCount === 1 ? 'Image' : 'Images'}...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Generate {imageCount} {imageCount === 1 ? 'Image' : 'Images'}</span>
                <span className="sm:hidden">Generate</span>
              </>
            )}
          </Button>

          {/* Model Info Display (Fallback notification) */}
          {modelInfo && !error && (
            <div className={`p-3 rounded-lg ${
              modelInfo.includes('⚠️')
                ? 'bg-yellow-500/20 border border-yellow-500/30'
                : 'bg-green-500/20 border border-green-500/30'
            }`}>
              <p className={`text-xs sm:text-sm font-medium ${
                modelInfo.includes('⚠️')
                  ? 'text-yellow-100'
                  : 'text-green-100'
              }`}>{modelInfo}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
              <p className="text-sm text-red-100 font-medium">{error}</p>
            </div>
          )}

          {/* Image Grid */}
          {(generatedImages.length > 0 || isGenerating) && (
            <div className="pt-4">
              <ImageGrid
                images={generatedImages}
                imageCount={imageCount}
                aspectRatio={aspectRatio}
                isGenerating={isGenerating}
                onDeleteImage={handleDeleteImage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhancement Confirmation Modal */}
      <EnhancementModal
        isOpen={showEnhancementModal}
        onClose={() => setShowEnhancementModal(false)}
        onUseCombined={() => handleGenerate()}
        onEnhanceFirst={() => {
          handleEnhancePrompt().then(() => handleGenerate());
        }}
      />
    </motion.div>
  );
}
