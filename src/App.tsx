import React, { useEffect, useState } from "react";
import DM2PromptEditor from "./components/DM2PromptEditor";
import CurrentPromptPanel from "./components/CurrentPromptPanel";
import ImageDropZone from "./components/ImageDropZone";
import { generateWithGemini } from "./services/promptApi";
import { generateWithImagesREST } from "./helpers/gemini";
import BackgroundCanvas from "./components/BackgroundCanvas";
import BrandHeader from "./components/BrandHeader";
import { composePrompt } from "./lib/utils";

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
  // New: style/scene support
  const [styleFile, setStyleFile] = useState<File | undefined>(undefined);
  const [sceneFile, setSceneFile] = useState<File | undefined>(undefined);
  const [styleDesc, setStyleDesc] = useState<string>("");
  const [sceneDesc, setSceneDesc] = useState<string>("");
  const [useStyle, setUseStyle] = useState<boolean>(true);
  const [useScene, setUseScene] = useState<boolean>(true);

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

  // Image upload handler: only store images, let effect do analysis
  const handleImageFiles = async (files: File[]) => {
    if (!files) return;
    setImages(files);
  };

  // New: role handlers wired to ImageDropZone
  const handleStyleFile = (file?: File) => setStyleFile(file);
  const handleSceneFile = (file?: File) => setSceneFile(file);

  const handleSend = async (finalPrompt: string) => {
    setIsGenerating(true);
    try {
      // Compose prompt with optional style/scene descriptors
      const composed = composePrompt({
        userText: finalPrompt,
        style: styleDesc,
        scene: sceneDesc,
        useStyle,
        useScene,
      });

      const imagesDataUrls = await getImageDataUrls(images, speedMode);
      if (imagesDataUrls.length) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const mmModel = envModel || "gemini-2.0-flash"; // ensure 2.0 flash fallback
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 384, temperature: 0.95 }
          : { maxOutputTokens: 160, temperature: 0.7 };
        console.log("Gemini MM model (send):", mmModel, "config:", genCfg);
        const directMm = await generateWithImagesREST({ apiKey, model: mmModel, text: composed, imageDataUrls: imagesDataUrls, generationConfig: genCfg });
        setPrompt(directMm);
        setEditorSeed(directMm);
        setLastSource("gemini-mm");
      } else {
        const textModel = import.meta.env.VITE_GEMINI_MODEL_TEXT || "gemini-1.5-flash";
        const directResult = await generateWithGemini(composed, textModel, false);
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

  // Auto-analyze images when they are added, honoring Speed Mode (existing behavior)
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

  // New: auto-analyze Style
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyze || !styleFile) { setStyleDesc(""); return; }
      setIsAnalyzing(true);
      try {
        const cfg = speedMode === 'Quality'
          ? { maxOutputTokens: 196, temperature: 0.9 }
          : { maxOutputTokens: 120, temperature: 0.7 };
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.0-flash";
        const url = await fileToOptimizedDataUrl(styleFile, speedMode === 'Quality' ? { maxDim: 1600, quality: 0.85 } : { maxDim: 1024, quality: 0.7 });
        const instruction = speedMode === 'Quality'
          ? "Extract detailed style/aesthetic descriptors visible in the image: medium, technique, palette, lighting, composition, mood, lens. Return a concise phrase, comma-separated."
          : "Extract concise style descriptors: medium, technique, palette, lighting, composition, mood. Return a short comma-separated phrase.";
        const out = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls: [url], generationConfig: cfg });
        if (!cancelled) setStyleDesc(out);
      } catch (e) {
        console.error("Style analyze failed", e);
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [styleFile, autoAnalyze, speedMode]);

  // New: auto-analyze Scene
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyze || !sceneFile) { setSceneDesc(""); return; }
      setIsAnalyzing(true);
      try {
        const cfg = speedMode === 'Quality'
          ? { maxOutputTokens: 196, temperature: 0.9 }
          : { maxOutputTokens: 120, temperature: 0.7 };
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.0-flash";
        const url = await fileToOptimizedDataUrl(sceneFile, speedMode === 'Quality' ? { maxDim: 1600, quality: 0.85 } : { maxDim: 1024, quality: 0.7 });
        const instruction = speedMode === 'Quality'
          ? "Extract detailed scene/environment descriptors visible in the image: location, time, atmosphere, weather, lighting, mood, depth cues. Return a concise phrase, comma-separated."
          : "Extract concise scene descriptors: location, time, atmosphere, weather, lighting, mood. Return a short comma-separated phrase.";
        const out = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls: [url], generationConfig: cfg });
        if (!cancelled) setSceneDesc(out);
      } catch (e) {
        console.error("Scene analyze failed", e);
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [sceneFile, autoAnalyze, speedMode]);

  const handleClearAll = () => {
    setPrompt("");
    setEditorSeed("");
    setImages([]);
    setStyleFile(undefined);
    setSceneFile(undefined);
    setStyleDesc("");
    setSceneDesc("");
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
              onFiles={handleImageFiles}
              isAnalyzing={isAnalyzing}
              autoAnalyze={autoAnalyze}
              onToggleAutoAnalyze={setAutoAnalyze}
              onStyleFile={handleStyleFile}
              onSceneFile={handleSceneFile}
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
              // New: chips/toggles
              styleDesc={styleDesc}
              sceneDesc={sceneDesc}
              useStyle={useStyle}
              useScene={useScene}
              onToggleStyle={setUseStyle}
              onToggleScene={setUseScene}
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