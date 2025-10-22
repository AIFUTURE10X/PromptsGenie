import React, { useEffect, useState, useRef } from "react";
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

  // Background canvas controls (Left Dock)
  const [bgEffect, setBgEffect] = useState<'none' | 'grain' | 'particles'>('grain');
  const [bgOpacity, setBgOpacity] = useState<number>(1);
  const [bgEffectOpacity, setBgEffectOpacity] = useState<number>(0.06);
  const [bgGrainScale, setBgGrainScale] = useState<number>(160);

  // Measure blank panel to size the fixed overlay
  const blankPanelRef = useRef<HTMLDivElement | null>(null);
  const [blankPanelTop, setBlankPanelTop] = useState<number>(0);
  const [blankPanelWidth, setBlankPanelWidth] = useState<number>(0);

  // Abort controller for image analyze requests
  const analyzeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const measure = () => {
      if (!blankPanelRef.current) return;
      const rect = blankPanelRef.current.getBoundingClientRect();
      setBlankPanelTop(rect.top);
      setBlankPanelWidth(rect.width);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);

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
    setImages(files);
  };

  // Manual reanalyze handler (uses same instruction as auto-analyze)
  const handleReanalyze = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    const controller = new AbortController();
    analyzeAbortRef.current = controller;
    try {
      const imageDataUrls = await Promise.all(images.map(fileToDataUrl));
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
      const model = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-1.5-pro-latest";
      const instruction =
        "You are a professional prompt engineer. Analyze the input image and produce a single, vivid 1–2 sentence prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Do not explain your reasoning, do not include headings or labels, and avoid extra commentary.";
      const analyzedDirect = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, signal: controller.signal });
      setPrompt(analyzedDirect);
      setEditorSeed(analyzedDirect);
      setLastSource("gemini-mm");
    } catch (e2: any) {
      if (e2?.name === 'AbortError') {
        console.log('Analyze cancelled');
      } else {
        console.error("Reanalyze failed", e2);
      }
    } finally {
      setIsAnalyzing(false);
      analyzeAbortRef.current = null;
    }
  };
  const handleSend = async (finalPrompt: string) => {
    setIsGenerating(true);
    try {
      const imagesDataUrls = await Promise.all(images.map(fileToDataUrl));
      if (imagesDataUrls.length) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const mmModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-1.5-pro-latest";
        const directMm = await generateWithImagesREST({ apiKey, model: mmModel, text: finalPrompt, imageDataUrls: imagesDataUrls });
        const mmOut = (directMm || '').trim();
        if (mmOut) {
          setPrompt(mmOut);
          setEditorSeed(mmOut);
          setLastSource("gemini-mm");
        } else {
          console.warn("Gemini MM returned empty; falling back to text model");
          const textModel = import.meta.env.VITE_GEMINI_MODEL_TEXT || "gemini-1.5-flash";
          const fallbackText = await generateWithGemini(finalPrompt, textModel, true);
          setPrompt(fallbackText);
          setEditorSeed(fallbackText);
          setLastSource("gemini-text");
        }
      } else {
        const textModel = import.meta.env.VITE_GEMINI_MODEL_TEXT || "gemini-1.5-flash";
        const directResult = await generateWithGemini(finalPrompt, textModel, true);
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
      const controller = new AbortController();
      analyzeAbortRef.current = controller;
      try {
        const imageDataUrls = await Promise.all(images.map(fileToDataUrl));
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
        const model = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-1.5-pro-latest";
        const instruction =
          "You are a professional prompt engineer. Analyze the input image and produce a single, vivid 1–2 sentence prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Do not explain your reasoning, do not include headings or labels, and do not add extra commentary. Return only the final prompt text.";
        const analyzedDirect = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, signal: controller.signal });
        if (!cancelled && !controller.signal.aborted) {
          setPrompt(analyzedDirect);
          setEditorSeed(analyzedDirect);
          setLastSource("gemini-mm");
        }
      } catch (e2: any) {
        if (e2?.name === 'AbortError') {
          console.log('Auto analyze cancelled');
        } else {
          console.error("Auto-analyze direct call failed", e2);
        }
      } finally {
        if (!cancelled) setIsAnalyzing(false);
        analyzeAbortRef.current = null;
      }
    };
    run();
    return () => {
      cancelled = true;
      analyzeAbortRef.current?.abort();
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

  const handleCancelAnalyze = () => {
    if (isAnalyzing) {
      analyzeAbortRef.current?.abort();
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative dark min-h-screen text-dark-text-primary">
      <BackgroundCanvas color="#000000" opacity={bgOpacity} effect={bgEffect} effectOpacity={bgEffectOpacity} grainScale={bgGrainScale} />
      <div className="max-w-6xl mx-auto px-4">
        <BrandHeader logoSrc="Genie.png" />
      </div>

      {blankPanelWidth > 0 && (
        <div className="fixed left-0 z-20" style={{ top: blankPanelTop, width: blankPanelWidth }}>
          <div className="panel-standard-height min-w-0">
            <div className="bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border h-full w-full p-0">
              <div className="grid grid-rows-3 gap-1 h-full">
                {/* TOP: upload/analyze moved here */}
                <ImageDropZone
                  onFiles={handleImageFiles}
                  isAnalyzing={isAnalyzing}
                  autoAnalyze={autoAnalyze}
                  onToggleAutoAnalyze={setAutoAnalyze}
                  onReanalyze={handleReanalyze}
                  className="bg-panel-secondary dark:bg-dark-panel-secondary"
                  onCancelAnalyze={handleCancelAnalyze}
                />
                <div className="rounded-md bg-panel-secondary dark:bg-dark-panel-secondary border border-border dark:border-dark-border h-full" />
                <div className="rounded-md bg-panel-secondary dark:bg-dark-panel-secondary border border-border dark:border-dark-border h-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[90rem] mx-auto py-6 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1fr,1fr,1fr,1fr] gap-4">

          {/* Blank Panel placeholder for measurement */}
          <div ref={blankPanelRef} className="panel-standard-height min-w-0 invisible">
            <div className="bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border h-full w-full p-0">
              <div className="grid grid-rows-3 gap-1 h-full">
                <div className="rounded-md bg-panel-secondary dark:bg-dark-panel-secondary border border-border dark:border-dark-border h-full" />
                <div className="rounded-md bg-panel-secondary dark:bg-dark-panel-secondary border border-border dark:border-dark-border h-full" />
                <div className="rounded-md bg-panel-secondary dark:bg-dark-panel-secondary border border-border dark:border-dark-border h-full" />
              </div>
            </div>
          </div>

          {/* Panel 1: now a blank light-blue panel */}
          <div className="panel-standard-height min-w-0">
            <div className="bg-panel-secondary dark:bg-dark-panel-secondary rounded-xl border-2 border-border dark:border-dark-border h-full w-full" />
          </div>

          {/* Second: Prompt editor */}
          <div className="panel-standard-height min-w-0">
            <DM2PromptEditor
              initialText={editorSeed}
              onSend={handleSend}
              onClear={() => { handleClearAll(); setEditorExpanded(false); }}
              onResizeStart={() => setEditorExpanded(true)}
              onResizeEnd={() => setEditorExpanded(true)}
              isGenerating={isGenerating}
            />
          </div>

          {/* Third: Current prompt with actions */}
          <div className="panel-standard-height min-w-0">
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