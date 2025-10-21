import React, { useEffect, useState } from "react";
import DM2PromptEditor from "./components/DM2PromptEditor";
import CurrentPromptPanel from "./components/CurrentPromptPanel";
import ImageDropZone from "./components/ImageDropZone";
import { generateWithGemini } from "./services/promptApi";
import { generateWithImagesREST } from "./helpers/gemini";
import BackgroundCanvas from "./components/BackgroundCanvas";
import BrandHeader from "./components/BrandHeader";

function App() {
  const [prompt, setPrompt] = useState("");
  const [editorSeed, setEditorSeed] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [lastSource, setLastSource] = useState<"edge" | "gemini-mm" | "gemini-text" | undefined>(undefined);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ADD: Instrumented image upload handler for timing/error logs
  const handleImageFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    console.log('Starting analysis...');
    setIsAnalyzing(true);

    try {
      console.log('Converting files to data URLs...');
      const imageDataUrls = await Promise.all(files.map(fileToDataUrl));
      console.log('Data URLs created:', imageDataUrls.length);

      console.log('Calling Gemini directly (no edge)...');
      const startTime = Date.now();

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
      const mmModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-1.5-pro-latest";
      const enhancedPrompt = await generateWithImagesREST({
        apiKey,
        model: mmModel,
        text: "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see.",
        imageDataUrls,
      });

      const endTime = Date.now();
      console.log(`Analysis took ${endTime - startTime}ms`);
      console.log('Enhanced prompt:', enhancedPrompt);

      setPrompt(enhancedPrompt);
      setEditorSeed(enhancedPrompt);
      setLastSource('gemini-mm');
    } catch (error: any) {
      console.error('FULL ERROR:', error);
      alert(`Error: ${error?.message || String(error)}`);
    } finally {
      console.log('Analysis complete');
      setIsAnalyzing(false);
    }

    // Keep images in state for subsequent operations (e.g., manual Send)
    setImages(files);
  };

  const handleSend = async (finalPrompt: string) => {
    setIsGenerating(true);
    try {
      const imagesDataUrls = await Promise.all(images.map(fileToDataUrl));
      if (imagesDataUrls.length) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const mmModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-1.5-pro-latest";
        const directMm = await generateWithImagesREST({ apiKey, model: mmModel, text: finalPrompt, imageDataUrls: imagesDataUrls });
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

  // Auto-analyze images when they are added
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyze || images.length === 0) return;
      setIsAnalyzing(true);
      try {
        const imageDataUrls = await Promise.all(images.map(fileToDataUrl));
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const model = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-1.5-pro-latest";
        const instruction =
          "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Don't invent details not visible.";
        const analyzedDirect = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls });
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
  }, [images, autoAnalyze]);

  const handleClearAll = () => {
    setPrompt("");
    setEditorSeed("");
    setImages([]);
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
            />
          </div>

          {/* Second: Prompt editor */}
          <div className={editorExpanded ? "panel-auto-height" : "panel-standard-height"}>
            <DM2PromptEditor
              initialText={editorSeed}
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