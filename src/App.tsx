import React, { useEffect, useState } from "react";
import DM2PromptEditor from "./components/DM2PromptEditor";
import CurrentPromptPanel from "./components/CurrentPromptPanel";
import ImageDropZone from "./components/ImageDropZone";
import { generateWithGemini } from "./services/promptApi";
import { generateWithImagesREST } from "./helpers/gemini";
import BackgroundCanvas from "./components/BackgroundCanvas";
import BrandHeader from "./components/BrandHeader";

// Local type to coordinate speed across components
type SpeedMode = 'Fast' | 'Quality';

function App() {
  const [prompt, setPrompt] = useState("");
  const [editorSeed, setEditorSeed] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [lastSource, setLastSource] = useState<"edge" | "gemini-mm" | "gemini-text" | undefined>(undefined);
  const [speedMode, setSpeedMode] = useState<SpeedMode>('Fast');
  
  // State for independent image analysis
  const [subjectImages, setSubjectImages] = useState<File[]>([]);
  const [sceneImages, setSceneImages] = useState<File[]>([]);
  const [styleImages, setStyleImages] = useState<File[]>([]);
  const [isAnalyzingSubject, setIsAnalyzingSubject] = useState(false);
  const [isAnalyzingScene, setIsAnalyzingScene] = useState(false);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [autoAnalyzeSubject, setAutoAnalyzeSubject] = useState(false);
  const [autoAnalyzeScene, setAutoAnalyzeScene] = useState(false);
  const [autoAnalyzeStyle, setAutoAnalyzeStyle] = useState(false);
  
  // Preview states for image thumbnails
  const [subjectPreview, setSubjectPreview] = useState<string | undefined>(undefined);
  const [scenePreview, setScenePreview] = useState<string | undefined>(undefined);
  const [stylePreview, setStylePreview] = useState<string | undefined>(undefined);

  // Resize/compress images to speed up requests
  const fileToOptimizedDataUrl = async (
    file: File,
    opts: { maxDim: number; quality: number; mimeType?: string } = { maxDim: 1024, quality: 0.7, mimeType: 'image/jpeg' }
  ): Promise<string> => {
    try {
      const blobUrl = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = blobUrl;
      });
      const { width, height } = img;
      const scale = Math.min(1, opts.maxDim / Math.max(width, height));
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL(opts.mimeType || 'image/jpeg', opts.quality);
      URL.revokeObjectURL(blobUrl);
      return dataUrl;
    } catch (e) {
      console.warn('Image optimization failed, falling back to raw DataURL:', e);
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };

  const getImageDataUrls = async (files: File[], mode: SpeedMode): Promise<string[]> => {
    const cfg = mode === 'Quality'
      ? { maxDim: 1600, quality: 0.85, mimeType: 'image/jpeg' }
      : { maxDim: 1024, quality: 0.7, mimeType: 'image/jpeg' };
    const urls = await Promise.all(files.map((f) => fileToOptimizedDataUrl(f, cfg)));
    console.log(`Optimized ${files.length} image(s) for ${mode} mode. First length:`, urls[0]?.length ?? 0);
    return urls;
  };

  const handleImageFiles = async (files: File[]) => {
    if (!files) return;
    setImages(files);
  };

  const handleSend = async (finalPrompt: string) => {
    setIsGenerating(true);
    try {
      const imagesDataUrls = await getImageDataUrls(images, speedMode);
      if (imagesDataUrls.length) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const mmModel = envModel || "gemini-2.0-flash"; // ensure 2.0 flash fallback
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 384, temperature: 0.95 }
          : { maxOutputTokens: 160, temperature: 0.7 };
        console.log("Gemini MM model (send):", mmModel, "config:", genCfg);
        const directMm = await generateWithImagesREST({ apiKey, model: mmModel, text: finalPrompt, imageDataUrls: imagesDataUrls, generationConfig: genCfg });
        setPrompt(directMm);
        setEditorSeed(directMm);
        setLastSource("gemini-mm");
      } else {
        const textModel = import.meta.env.VITE_GEMINI_MODEL_TEXT || "gemini-1.5-flash";
        const directResult = await generateWithGemini(finalPrompt, textModel, false);
        setPrompt(directResult);
        setEditorSeed(directResult);
        setLastSource("gemini-text");
      }
    } catch (err2) {
      console.error("Direct Gemini call failed:", err2);
      alert("An error occurred while generating. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-analyze images when they are added, honoring Speed Mode
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyze || images.length === 0) return;
      setIsAnalyzing(true);
      try {
        const imageDataUrls = await getImageDataUrls(images, speedMode);
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.0-flash"; // ensure 2.0 flash fallback
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 384, temperature: 0.95 }
          : { maxOutputTokens: 160, temperature: 0.7 };
        console.log("Gemini MM model (auto):", model, "config:", genCfg);

        const instructionFast =
          "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Don't invent details not visible.";
        const instructionQuality =
          "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Expand important details (subject, context, style, lighting, composition, lens, mood, constraints). Return only the improved prompt.";
        const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

        const analyzedDirect = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
        if (!cancelled) {
          setPrompt(analyzedDirect);
          setEditorSeed(analyzedDirect);
          setLastSource("gemini-mm");
        }
      } catch (e2) {
        console.error("Auto-analyze direct call failed", e2);
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [images, autoAnalyze, speedMode]);

  // Auto-analyze subject images when they are added
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyzeSubject || subjectImages.length === 0) return;
      setIsAnalyzingSubject(true);
      try {
        const imageDataUrls = await getImageDataUrls(subjectImages, speedMode);
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.0-flash";
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 384, temperature: 0.95 }
          : { maxOutputTokens: 160, temperature: 0.7 };

        const instructionFast =
          "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Focus specifically on the subject/main character, including appearance, pose, expression, clothing, and distinctive features. Don't invent details not visible.";
        const instructionQuality =
          "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Focus specifically on the subject/main character - expand important details (appearance, pose, expression, clothing, accessories, distinctive features). Return only the improved prompt.";
        const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

        const analyzedSubject = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
        if (!cancelled) {
          setPrompt(analyzedSubject);
          setEditorSeed(analyzedSubject);
          setLastSource("subject");
        }
      } catch (e2) {
        console.error("Auto-analyze subject failed", e2);
      } finally {
        if (!cancelled) setIsAnalyzingSubject(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [subjectImages, autoAnalyzeSubject, speedMode]);

  // Auto-analyze scene images when they are added
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyzeScene || sceneImages.length === 0) return;
      setIsAnalyzingScene(true);
      try {
        const imageDataUrls = await getImageDataUrls(sceneImages, speedMode);
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.0-flash";
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 384, temperature: 0.95 }
          : { maxOutputTokens: 160, temperature: 0.7 };

        const instructionFast =
          "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Focus specifically on the scene/environment, including setting, location, background, atmosphere, lighting, and environmental details. Don't invent details not visible.";
        const instructionQuality =
          "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Focus specifically on the scene/environment - expand important details (setting, location, background, architecture, landscape, atmosphere, lighting, weather, environmental context). Return only the improved prompt.";
        const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

        const analyzedScene = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
        if (!cancelled) {
          setPrompt(analyzedScene);
          setEditorSeed(analyzedScene);
          setLastSource("scene");
        }
      } catch (e2) {
        console.error("Auto-analyze scene failed", e2);
      } finally {
        if (!cancelled) setIsAnalyzingScene(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [sceneImages, autoAnalyzeScene, speedMode]);

  // Auto-analyze style images when they are added
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyzeStyle || styleImages.length === 0) return;
      setIsAnalyzingStyle(true);
      try {
        const imageDataUrls = await getImageDataUrls(styleImages, speedMode);
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.0-flash";
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 384, temperature: 0.95 }
          : { maxOutputTokens: 160, temperature: 0.7 };

        const instructionFast =
          "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Focus specifically on the artistic style, including art style, technique, color palette, composition, visual effects, and aesthetic approach. Don't invent details not visible.";
        const instructionQuality =
          "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Focus specifically on the artistic style - expand important details (art style, technique, medium, color palette, composition, visual effects, lighting style, texture, aesthetic approach). Return only the improved prompt.";
        const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

        const analyzedStyle = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
        if (!cancelled) {
          setPrompt(analyzedStyle);
          setEditorSeed(analyzedStyle);
          setLastSource("style");
        }
      } catch (e2) {
        console.error("Auto-analyze style failed", e2);
      } finally {
        if (!cancelled) setIsAnalyzingStyle(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [styleImages, autoAnalyzeStyle, speedMode]);

  // Generate preview URLs for image thumbnails
  useEffect(() => {
    if (subjectImages.length > 0) {
      const url = URL.createObjectURL(subjectImages[0]);
      setSubjectPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setSubjectPreview(undefined);
    }
  }, [subjectImages]);

  useEffect(() => {
    if (sceneImages.length > 0) {
      const url = URL.createObjectURL(sceneImages[0]);
      setScenePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setScenePreview(undefined);
    }
  }, [sceneImages]);

  useEffect(() => {
    if (styleImages.length > 0) {
      const url = URL.createObjectURL(styleImages[0]);
      setStylePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setStylePreview(undefined);
    }
  }, [styleImages]);

  // Manual trigger function for general analysis
  const handleRunAnalysis = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    try {
      const imageDataUrls = await getImageDataUrls(images, speedMode);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
      const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
      const model = envModel || "gemini-2.0-flash";
      const genCfg = speedMode === 'Quality'
        ? { maxOutputTokens: 384, temperature: 0.95 }
        : { maxOutputTokens: 160, temperature: 0.7 };

      const instructionFast =
        "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Don't invent details not visible.";
      const instructionQuality =
        "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Expand important details (subject, context, style, lighting, composition, lens, mood, constraints). Return only the improved prompt.";
      const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

      const analyzedDirect = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
      setPrompt(analyzedDirect);
      setEditorSeed(analyzedDirect);
      setLastSource("gemini-mm");
    } catch (e2) {
      console.error("Manual analysis failed", e2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Manual trigger functions for independent analysis
  const runSubjectAnalysis = async () => {
    if (subjectImages.length === 0) return;
    setIsAnalyzingSubject(true);
    try {
      const imageDataUrls = await getImageDataUrls(subjectImages, speedMode);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
      const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
      const model = envModel || "gemini-2.0-flash";
      const genCfg = speedMode === 'Quality'
        ? { maxOutputTokens: 384, temperature: 0.95 }
        : { maxOutputTokens: 160, temperature: 0.7 };

      const instructionFast =
        "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Focus specifically on the subject/main character, including appearance, pose, expression, clothing, and distinctive features. Don't invent details not visible.";
      const instructionQuality =
        "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Focus specifically on the subject/main character - expand important details (appearance, pose, expression, clothing, accessories, distinctive features). Return only the improved prompt.";
      const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

      const analyzedSubject = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
      setPrompt(analyzedSubject);
      setEditorSeed(analyzedSubject);
      setLastSource("subject");
    } catch (e2) {
      console.error("Subject analysis failed", e2);
    } finally {
      setIsAnalyzingSubject(false);
    }
  };

  const runSceneAnalysis = async () => {
    if (sceneImages.length === 0) return;
    setIsAnalyzingScene(true);
    try {
      const imageDataUrls = await getImageDataUrls(sceneImages, speedMode);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
      const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
      const model = envModel || "gemini-2.0-flash";
      const genCfg = speedMode === 'Quality'
        ? { maxOutputTokens: 384, temperature: 0.95 }
        : { maxOutputTokens: 160, temperature: 0.7 };

      const instructionFast =
        "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Focus specifically on the scene/environment, including setting, location, background, atmosphere, lighting, and environmental details. Don't invent details not visible.";
      const instructionQuality =
        "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Focus specifically on the scene/environment - expand important details (setting, location, background, architecture, landscape, atmosphere, lighting, weather, environmental context). Return only the improved prompt.";
      const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

      const analyzedScene = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
      setPrompt(analyzedScene);
      setEditorSeed(analyzedScene);
      setLastSource("scene");
    } catch (e2) {
      console.error("Scene analysis failed", e2);
    } finally {
      setIsAnalyzingScene(false);
    }
  };

  const runStyleAnalysis = async () => {
    if (styleImages.length === 0) return;
    setIsAnalyzingStyle(true);
    try {
      const imageDataUrls = await getImageDataUrls(styleImages, speedMode);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
      const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
      const model = envModel || "gemini-2.0-flash";
      const genCfg = speedMode === 'Quality'
        ? { maxOutputTokens: 384, temperature: 0.95 }
        : { maxOutputTokens: 160, temperature: 0.7 };

      const instructionFast =
        "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Focus specifically on the artistic style, including art style, technique, color palette, composition, visual effects, and aesthetic approach. Don't invent details not visible.";
      const instructionQuality =
        "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Focus specifically on the artistic style - expand important details (art style, technique, medium, color palette, composition, visual effects, lighting style, texture, aesthetic approach). Return only the improved prompt.";
      const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

      const analyzedStyle = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
      setPrompt(analyzedStyle);
      setEditorSeed(analyzedStyle);
      setLastSource("style");
    } catch (e2) {
      console.error("Style analysis failed", e2);
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  const handleClearGeneral = () => {
    setImages([]);
  };

  const handleClearAll = () => {
    setPrompt("");
    setEditorSeed("");
    setImages([]);
    setSubjectImages([]);
    setSceneImages([]);
    setStyleImages([]);
    setLastSource(undefined);
  };

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (e) {
      console.warn("Copy failed:", e);
    }
  };

  const handleEdit = () => {
    setEditorSeed(prompt);
  };

  const handleClearPrompt = () => {
    setPrompt("");
    setLastSource(undefined);
  };

  const handleRegenerate = async () => {
    if (!prompt) return;
    try {
      setIsGenerating(true);
      const textModel = import.meta.env.VITE_GEMINI_MODEL_TEXT || "gemini-1.5-flash";
      const instruction = "Rewrite the following into a more in-depth, comprehensive, and highly specific prompt. Expand important details (subject, context, style, lighting, composition, lens, mood, constraints). Keep it clear and actionable. Return only the improved prompt.";
      const input = `${instruction}\n\nOriginal Prompt:\n${prompt}`;
      const improved = await generateWithGemini(input, textModel);
      setPrompt(improved);
      setEditorSeed(improved);
      setLastSource("gemini-text");
    } catch (e) {
      console.error("Regenerate failed:", e);
      alert("Could not regenerate a more in-depth prompt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative dark min-h-screen text-dark-text-primary">
      <BackgroundCanvas color="#000000" opacity={1} effect="grain" effectOpacity={0.06} />
      <div className="max-w-6xl mx-auto px-4">
        <BrandHeader logoSrc="Genie.png" />
      </div>
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Left: Image drop zone */}
          <div className="panel-standard-height">
            <ImageDropZone
              images={images}
              onImagesChange={setImages}
              onRunAnalysis={handleRunAnalysis}
              isAnalyzing={isAnalyzing}
              onClearGeneral={handleClearGeneral}
              autoAnalyze={autoAnalyze}
              onAutoAnalyzeChange={setAutoAnalyze}
              subjectImages={subjectImages}
              onSubjectImagesChange={setSubjectImages}
              onRunSubjectAnalysis={runSubjectAnalysis}
              isAnalyzingSubject={isAnalyzingSubject}
              subjectPreview={subjectPreview}
              autoAnalyzeSubject={autoAnalyzeSubject}
              onAutoAnalyzeSubjectChange={setAutoAnalyzeSubject}
              sceneImages={sceneImages}
              onSceneImagesChange={setSceneImages}
              onRunSceneAnalysis={runSceneAnalysis}
              isAnalyzingScene={isAnalyzingScene}
              scenePreview={scenePreview}
              autoAnalyzeScene={autoAnalyzeScene}
              onAutoAnalyzeSceneChange={setAutoAnalyzeScene}
              styleImages={styleImages}
              onStyleImagesChange={setStyleImages}
              onRunStyleAnalysis={runStyleAnalysis}
              isAnalyzingStyle={isAnalyzingStyle}
              stylePreview={stylePreview}
              autoAnalyzeStyle={autoAnalyzeStyle}
              onAutoAnalyzeStyleChange={setAutoAnalyzeStyle}
            />
          </div>

          {/* Second: Prompt editor */}
          <div className={editorExpanded ? "panel-auto-height" : "panel-standard-height"}>
            <DM2PromptEditor
              initialText={editorSeed}
              initialSpeedMode={speedMode}
              onSpeedModeChange={setSpeedMode}
              onSend={handleSend}
              onClear={() => { handleClearAll(); setEditorExpanded(false); }}
              onResizeStart={() => setEditorExpanded(true)}
              onResizeEnd={() => setEditorExpanded(true)}
            />
          </div>

          {/* Third: Current prompt with actions */}
          <div className="panel-standard-height">
            <CurrentPromptPanel
              prompt={prompt}
              source={lastSource}
              onCopy={handleCopy}
              onEdit={handleEdit}
              onClear={handleClearPrompt}
              onRegenerate={handleRegenerate}
            />
          </div>


        </div>
      </div>
    </div>
  );
}

export default App;