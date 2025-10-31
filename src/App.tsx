import React, { useEffect, useState } from "react";
import DM2PromptEditor, { RewriteStyle } from "./components/DM2PromptEditor";
import CurrentPromptPanel from "./components/CurrentPromptPanel";
import ImageDropZone from "./components/ImageDropZone";
import { generateWithGemini } from "./services/promptApi";
import { generateWithImagesREST } from "./helpers/gemini";
import BackgroundCanvas from "./components/BackgroundCanvas";
import BrandHeader from "./components/BrandHeader";
import { composePrompt, applyRewriteStyle } from "./lib/utils";
import StoryboardPanel from "./components/StoryboardPanel";

// Local type to coordinate speed across components
type SpeedMode = 'Fast' | 'Quality';

function App() {
  const [prompt, setPrompt] = useState("");
  const [editorSeed, setEditorSeed] = useState<string>("");
  const [rawPrompt, setRawPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [lastSource, setLastSource] = useState<"edge" | "gemini-mm" | "gemini-text" | "subject" | "scene" | "style" | undefined>(undefined);

  // New state for UI mode management
  const [currentMode, setCurrentMode] = useState<'prompt' | 'storyboard'>('prompt');

  // Missing state variables that are referenced but not declared
  const [useStyle, setUseStyle] = useState(true);
  const [useScene, setUseScene] = useState(true);
  const [styleDesc, setStyleDesc] = useState("");
  const [sceneDesc, setSceneDesc] = useState("");
  const [isSimpleStyleActive, setIsSimpleStyleActive] = useState(false);
  const [originalPromptBeforeSimple, setOriginalPromptBeforeSimple] = useState("");

  // Placeholder functions for missing handlers (not used in current UI but referenced)
  const setStyleFile = (file?: File) => { /* Reserved for future use */ };
  const setSceneFile = (file?: File) => { /* Reserved for future use */ };
  
  // Debug logging for state changes
  useEffect(() => {
    console.log("🔄 Prompt state changed:", prompt ? `"${prompt.substring(0, 50)}..."` : "EMPTY");
  }, [prompt]);

  useEffect(() => {
    console.log("🔄 LastSource state changed:", lastSource);
  }, [lastSource]);
  const [speedMode, setSpeedMode] = useState<SpeedMode>('Fast');
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>('Descriptive');
  
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
  
  // Store individual analysis results
  const [subjectAnalysis, setSubjectAnalysis] = useState<string>('');
  const [sceneAnalysis, setSceneAnalysis] = useState<string>('');
  const [styleAnalysis, setStyleAnalysis] = useState<string>('');

  useEffect(() => {
    console.log("🔄 rawPrompt changed:", rawPrompt ? `"${rawPrompt.substring(0, 50)}..."` : "EMPTY");
    if (rawPrompt) {
      const transformedPrompt = rewriteStyle && rewriteStyle !== 'Descriptive'
        ? applyRewriteStyle(rawPrompt, rewriteStyle)
        : rawPrompt;
      console.log("✅ Setting prompt from rawPrompt:", transformedPrompt.substring(0, 50) + "...");
      setPrompt(transformedPrompt);
      setEditorSeed(transformedPrompt);
    } else {
      // Clear prompt when rawPrompt is cleared
      console.log("🧹 Clearing prompt because rawPrompt is empty");
      setPrompt("");
      setEditorSeed("");
    }
  }, [rawPrompt, rewriteStyle]);
  
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

  // New: role handlers wired to ImageDropZone
  const handleStyleFile = (file?: File) => setStyleFile(file);
  const handleSceneFile = (file?: File) => setSceneFile(file);

  const handleSend = async (finalPrompt: string, rewriteStyle: 'Descriptive' | 'Concise' | 'Marketing' | 'Technical' = 'Descriptive') => {
    setIsGenerating(true);
    try {
      const composed = composePrompt({
        userText: finalPrompt,
        style: styleDesc,
        scene: sceneDesc,
        useStyle,
        useScene,
        rewriteStyle,
      });

      const imagesDataUrls = await getImageDataUrls(images, speedMode);
      if (imagesDataUrls.length) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-2.5-flash";
        const mmModel = envModel || "gemini-2.5-flash"; // ensure 2.5 flash fallback
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 384, temperature: 0.95 }
          : { maxOutputTokens: 160, temperature: 0.7 };
        console.log("Gemini MM model (send):", mmModel, "config:", genCfg);
        const directMm = await generateWithImagesREST({ apiKey, model: mmModel, text: composed, imageDataUrls: imagesDataUrls, generationConfig: genCfg });
        setPrompt(directMm);
        setEditorSeed(directMm);
        setLastSource("gemini-mm");
      } else {
        const textModel = import.meta.env.VITE_GEMINI_MODEL_TEXT || "gemini-2.5-flash";
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

  // Auto-analyze images when they are added, honoring Speed Mode (existing behavior)
  useEffect(() => {
    console.log("=" .repeat(80));
    console.log("🔍 AUTO-ANALYZE USEEFFECT TRIGGERED");
    console.log("  - Images count:", images.length);
    console.log("  - autoAnalyze:", autoAnalyze);
    console.log("  - speedMode:", speedMode);
    console.log("=" .repeat(80));

    // Early return if auto-analyze is disabled
    if (!autoAnalyze) {
      console.log("⏸️ SKIPPED: Auto-analyze is disabled");
      return;
    }

    // Early return if no images
    if (images.length === 0) {
      console.log("⏸️ SKIPPED: No images to analyze");
      return;
    }

    let cancelled = false;

    const run = async () => {
      console.log("🎬 STARTING AUTO-ANALYZE for", images.length, "image(s)");
      setIsAnalyzing(true);

      try {
        // Step 1: Convert images to data URLs
        console.log("📷 Step 1: Converting images to data URLs...");
        const imageDataUrls = await getImageDataUrls(images, speedMode);
        console.log("✅ Step 1 COMPLETE: Images converted", imageDataUrls.length, "URLs");

        // Step 2: Check API key
        console.log("🔑 Step 2: Checking API key...");
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          console.error("❌ FATAL: No Gemini API key found!");
          alert("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file");
          setIsAnalyzing(false);
          return;
        }
        console.log("✅ Step 2 COMPLETE: API key found");

        // Step 3: Prepare API call
        console.log("⚙️ Step 3: Preparing API call...");
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.0-flash";
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 500, temperature: 0.3 }
          : { maxOutputTokens: 400, temperature: 0.3 };

        const instructionFast =
          "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Don't invent details not visible.";
        const instructionQuality =
          "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Expand important details (subject, context, style, lighting, composition, lens, mood, constraints). Return only the improved prompt.";
        const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

        console.log("✅ Step 3 COMPLETE");
        console.log("  - Model:", model);
        console.log("  - Config:", JSON.stringify(genCfg));
        console.log("  - Instruction length:", instruction.length);

        // Step 4: Call API
        console.log("📡 Step 4: Calling Gemini API...");
        const analyzedDirect = await generateWithImagesREST({
          apiKey,
          model,
          text: instruction,
          imageDataUrls,
          generationConfig: genCfg
        });
        console.log("✅ Step 4 COMPLETE: API call successful");
        console.log("📝 Result length:", analyzedDirect?.length || 0);
        console.log("📝 Result preview:", analyzedDirect?.substring(0, 100));

        // Step 5: Update state
        if (!cancelled) {
          console.log("💾 Step 5: Updating state...");
          if (analyzedDirect && analyzedDirect.trim()) {
            console.log("✅ Setting rawPrompt with result");
            setRawPrompt(analyzedDirect);
            setLastSource("gemini-mm");
            console.log("✅ Step 5 COMPLETE: State updated");
          } else {
            console.error("❌ Step 5 FAILED: Analysis result is empty!");
            alert("Image analysis returned an empty result. Please try again.");
          }
        } else {
          console.log("⏸️ Step 5 CANCELLED: Component unmounted");
        }
      } catch (error) {
        console.error("=" .repeat(80));
        console.error("❌❌❌ AUTO-ANALYZE FAILED ❌❌❌");
        console.error("Error:", error);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        console.error("=" .repeat(80));
        alert(`Image analysis failed: ${error?.message || 'Unknown error'}.\n\nCheck the console for details.`);
      } finally {
        if (!cancelled) {
          console.log("🏁 FINISHED: Setting isAnalyzing to false");
          setIsAnalyzing(false);
        }
      }
    };

    // Run the async function
    run().catch(error => {
      console.error("❌ CRITICAL: run() caught error:", error);
    });

    return () => {
      console.log("🧹 CLEANUP: Auto-analyze useEffect cleanup");
      cancelled = true;
    };
  }, [images, autoAnalyze, speedMode]);

  // Auto-analyze subject images when they are added
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyzeSubject || subjectImages.length === 0) return;

      // CRITICAL: Validate API key before proceeding
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("❌ VITE_GEMINI_API_KEY not found - cannot auto-analyze subject");
        return;
      }

      setIsAnalyzingSubject(true);
      try {
        const imageDataUrls = await getImageDataUrls(subjectImages, speedMode);
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.5-flash";  // Use 2.5-flash as default
        // Use low temperature like the working Style analyzer
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 500, temperature: 0.3 }
          : { maxOutputTokens: 400, temperature: 0.3 };

        // Fast mode: Short and concise (20-40 words)
        const instructionFast =
          "Describe the main subject/character in 20-40 words. Include: appearance, clothing, pose, and key features. Be specific and concise.";

        // Quality mode: Comprehensive and detailed (80-120 words)
        const instructionQuality =
          "Create a comprehensive, detailed description of the main subject/character in 80-120 words. Include: 1) Physical characteristics (hair color/style, eye color, skin tone, facial features, body type, approximate age), 2) Clothing and accessories (style, colors, materials, fit, details), 3) Pose and body language (stance, gesture, positioning), 4) Facial expression and mood, 5) Any distinctive features or details that define this character, 6) Visible context or surroundings. Be thorough and specific about everything you can see.";

        const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

        console.log("🔍 Analyzing subject with simple, focused approach");
        const analyzedSubject = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });

        // Validate the response
        if (!analyzedSubject || analyzedSubject.length === 0) {
          console.error("❌ Subject analysis returned empty response");
          throw new Error("Subject analysis failed - no text generated");
        }

        if (!cancelled) {
          console.log("✅ Subject analysis successful:", analyzedSubject.substring(0, 100) + "...");
          setSubjectAnalysis(analyzedSubject);
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

      // CRITICAL: Validate API key before proceeding
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("❌ VITE_GEMINI_API_KEY not found - cannot auto-analyze scene");
        return;
      }

      setIsAnalyzingScene(true);
      try {
        const imageDataUrls = await getImageDataUrls(sceneImages, speedMode);
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.5-flash";  // Use 2.5-flash as default
        // Use same config as working Subject analyzer
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 500, temperature: 0.3 }
          : { maxOutputTokens: 400, temperature: 0.3 };

        // Fast mode: Short and concise (15-30 words)
        const instructionFast =
          "Describe the scene/environment in 15-30 words. Include: location/setting, lighting, and atmosphere. Examples: 'dark forest with fog and moonlight', 'modern city skyline at golden hour'. Be specific and concise.";

        // Quality mode: Comprehensive and detailed (60-100 words)
        const instructionQuality =
          "Create a comprehensive, detailed description of the scene/environment in 60-100 words. Include: 1) Location and setting (indoor/outdoor, type of place), 2) Architecture or landscape features (buildings, natural elements, structures), 3) Lighting (direction, quality, color temperature, time of day), 4) Atmospheric conditions (weather, fog, clarity, mood), 5) Background elements (objects, vegetation, decorative details), 6) Color palette and overall mood. Be thorough and paint a complete picture of the environment.";

        const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

        console.log("🏞️ Analyzing scene with simple prompt and examples");
        console.log("📝 Scene instruction:", instruction.substring(0, 150) + "...");
        const analyzedScene = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });

        // Validate the response
        if (!analyzedScene || analyzedScene.length === 0) {
          console.error("❌ Scene analysis returned empty response");
          throw new Error("Scene analysis failed - no text generated");
        }

        if (!cancelled) {
          console.log("✅ Scene analysis successful:", analyzedScene.substring(0, 100) + "...");
          setSceneAnalysis(analyzedScene);
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

      // CRITICAL: Validate API key before proceeding
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("❌ VITE_GEMINI_API_KEY not found - cannot auto-analyze style");
        return;
      }

      setIsAnalyzingStyle(true);
      try {
        const imageDataUrls = await getImageDataUrls(styleImages, speedMode);
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.5-flash";  // Use 2.5-flash as default
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 500, temperature: 0.3 }
          : { maxOutputTokens: 400, temperature: 0.3 };

        // Fast mode: Very short style identification (3-8 words)
        const instructionFast =
          "Identify the artistic style in 3-8 words. Examples: 'anime style', 'photorealistic 3D render', 'watercolor painting', 'digital concept art'. Be concise.";

        // Quality mode: Detailed style analysis (30-60 words)
        const instructionQuality =
          "Analyze and describe the artistic style in 30-60 words. Include: 1) Core artistic approach (anime, realistic, abstract, etc.), 2) Medium or technique (digital, oil painting, watercolor, 3D render, pencil), 3) Visual characteristics (color palette, line work, shading style, texture), 4) Art movement or influence if apparent (impressionist, cyberpunk, art nouveau). Be specific and descriptive about the visual style elements.";
        const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

        const analyzedStyle = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });

        // Validate the response
        if (!analyzedStyle || analyzedStyle.length === 0) {
          console.error("❌ Style analysis returned empty response");
          throw new Error("Style analysis failed - no text generated");
        }

        if (!cancelled) {
          console.log("✅ Style analysis successful:", analyzedStyle);
          setStyleAnalysis(analyzedStyle);
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

  // Combine subject, scene, and style analysis results into the main prompt
  useEffect(() => {
    // Only process if we have at least one specialized analysis
    if (subjectAnalysis || sceneAnalysis || styleAnalysis) {
      const combinedPrompt = composePrompt({
        userText: '', // Start fresh for combined analysis
        contentSummary: subjectAnalysis,
        scene: sceneAnalysis,
        style: styleAnalysis,
        useScene: !!sceneAnalysis,
        useStyle: !!styleAnalysis
      });

      console.log("🎨 Combined analysis prompt:", combinedPrompt.substring(0, 100) + "...");
      if (combinedPrompt && combinedPrompt !== rawPrompt) {
        setRawPrompt(combinedPrompt); // This will trigger useEffect to update prompt and editorSeed

        // Determine the appropriate source label based on what's combined
        // Note: lastSource type only supports single sources, so we prioritize
        const hasSubject = !!subjectAnalysis;
        const hasScene = !!sceneAnalysis;
        const hasStyle = !!styleAnalysis;

        // Prioritize subject > scene > style for combined analyses
        if (hasSubject) {
          setLastSource("subject");
        } else if (hasScene) {
          setLastSource("scene");
        } else if (hasStyle) {
          setLastSource("style");
        }
      }
    }
    // Removed the else block that was clearing prompts - this was interfering with main image analysis
  }, [subjectAnalysis, sceneAnalysis, styleAnalysis, rawPrompt]); // Removed prompt and lastSource from dependencies

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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
      const model = envModel || "gemini-2.5-flash";
      const genCfg = speedMode === 'Quality'
        ? { maxOutputTokens: 384, temperature: 0.95 }
        : { maxOutputTokens: 160, temperature: 0.7 };

      const instructionFast =
        "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Don't invent details not visible.";
      const instructionQuality =
        "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Expand important details (subject, context, style, lighting, composition, lens, mood, constraints). Return only the improved prompt.";
      const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

      const analyzedDirect = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
      setRawPrompt(analyzedDirect);
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
    console.log("🔍 runSubjectAnalysis called, subjectImages.length:", subjectImages.length);
    if (subjectImages.length === 0) return;
    setIsAnalyzingSubject(true);
    try {
      const imageDataUrls = await getImageDataUrls(subjectImages, speedMode);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
      const model = envModel || "gemini-2.0-flash";

      console.log("🔍 Environment variables:");
      console.log("  - VITE_GEMINI_API_KEY present:", !!apiKey, "length:", apiKey?.length || 0);
      console.log("  - VITE_GEMINI_MODEL_IMAGES:", import.meta.env.VITE_GEMINI_MODEL_IMAGES);
      console.log("  - VITE_GEMINI_MODEL_IMAGE:", import.meta.env.VITE_GEMINI_MODEL_IMAGE);
      console.log("  - Final model used:", model);
      console.log("🔍 Image data URLs count:", imageDataUrls.length);
      
      const genCfg = speedMode === 'Quality'
        ? { maxOutputTokens: 384, temperature: 0.95 }
        : { maxOutputTokens: 160, temperature: 0.7 };

      // STEP 1: My own style detection logic
      console.log("🎨 Step 1: Running style detection analysis");
      const styleDetectionPrompt = "Analyze this image and identify ONLY the artistic style. Look for these specific indicators: KAWAII (large eyes, rounded features, pastel colors, cute proportions, soft shading), STUDIO GHIBLI ANIME (soft watercolor backgrounds, detailed environments, gentle cel-shading, warm lighting), MODERN ANIME (sharp cel-shading, vibrant colors, clean line art, stylized proportions), CLASSIC ANIME (traditional animation style, hand-drawn quality), 3D RENDER (CGI appearance, smooth surfaces, digital lighting, volumetric effects), REALISTIC (photographic quality, natural lighting, detailed textures), CARTOON (simplified shapes, bold outlines, flat colors), CHIBI (super-deformed proportions, oversized head), PIXEL ART (blocky, low resolution, retro gaming style), DIGITAL ART (digital painting, soft brushstrokes, digital effects), WATERCOLOR (soft washes, bleeding colors, traditional media), OIL PAINTING (thick brushstrokes, rich textures, traditional art). Respond with ONLY the detected style name (e.g., 'Studio Ghibli anime', 'Modern anime', 'Kawaii 3D render', 'Digital art', etc.). Be specific and accurate.";
      
      const styleGenCfg = { maxOutputTokens: 400, temperature: 0.3 };
      const detectedStyle = await generateWithImagesREST({ apiKey, model, text: styleDetectionPrompt, imageDataUrls, generationConfig: styleGenCfg });
      console.log("🎨 Detected style:", detectedStyle);

      // STEP 2: Character analysis with detected style context
      console.log("🔍 Step 2: Running character analysis with detected style context");
      const instructionFast =
        `You are analyzing a character in a ${detectedStyle} artistic style. Create a concise prompt that describes this character specifically within the ${detectedStyle} style context. Include: character design elements typical of ${detectedStyle}, proportions and features characteristic of this style, color palette and materials appropriate to ${detectedStyle}, pose and expression fitting this artistic approach, clothing/accessories in the ${detectedStyle} aesthetic. Format: '${detectedStyle} character with [specific character details]'. Focus on elements that define this character within the ${detectedStyle} style.`;
      
      const instructionQuality =
        `You are analyzing a character in a ${detectedStyle} artistic style. Create a comprehensive prompt that captures this character specifically within the ${detectedStyle} style context. Analyze: 1) Character design elements typical of ${detectedStyle} (proportions, features, styling), 2) Physical characteristics as they appear in ${detectedStyle} (facial features, body type, age appearance), 3) Color scheme and materials characteristic of ${detectedStyle} (surface finish, lighting, textures), 4) Pose and expression fitting the ${detectedStyle} aesthetic (body language, facial expression, gesture), 5) Clothing and accessories in the ${detectedStyle} style (design, fit, details, materials), 6) Distinctive features that define this character's identity within ${detectedStyle}. Format: '${detectedStyle} featuring [comprehensive character description]'. Be specific about how each element reflects the ${detectedStyle} artistic approach.`;
      
      const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

      console.log("🔍 About to call generateWithImagesREST for character analysis with style:", detectedStyle);
      const analyzedSubject = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
      console.log("🔍 Character analysis result:", analyzedSubject);
      console.log("🔍 Setting prompt to:", analyzedSubject);
      setPrompt(analyzedSubject);
      setEditorSeed(analyzedSubject);
      setLastSource("subject");
      console.log("🔍 Subject analysis complete, prompt and source set");
    } catch (e2) {
      console.error("🚨 Subject analysis failed:", e2);
      
      // More specific error handling
      if (e2.message && e2.message.includes('429')) {
        alert(`API Rate Limit Exceeded: You've hit your Gemini API quota. Even with paid tier, you may have daily/hourly limits. Please wait a few minutes and try again, or check your Google AI Studio usage dashboard.`);
      } else if (e2.message && e2.message.includes('401')) {
        alert(`API Authentication Error: Please check your VITE_GEMINI_API_KEY in the .env file.`);
      } else if (e2.message && e2.message.includes('403')) {
        alert(`API Access Forbidden: Your API key may not have access to the Gemini model. Check your Google AI Studio permissions.`);
      } else {
        alert(`Subject analysis failed: ${e2.message || e2}`);
      }
    } finally {
      setIsAnalyzingSubject(false);
    }
  };

  const runSceneAnalysis = async () => {
    console.log("🌍 runSceneAnalysis called, sceneImages.length:", sceneImages.length);
    if (sceneImages.length === 0) return;
    setIsAnalyzingScene(true);
    try {
      const imageDataUrls = await getImageDataUrls(sceneImages, speedMode);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
      const model = envModel || "gemini-2.0-flash";

      console.log("🌍 Environment variables:");
      console.log("  - VITE_GEMINI_API_KEY present:", !!apiKey, "length:", apiKey?.length || 0);
      console.log("  - VITE_GEMINI_MODEL_IMAGES:", import.meta.env.VITE_GEMINI_MODEL_IMAGES);
      console.log("  - VITE_GEMINI_MODEL_IMAGE:", import.meta.env.VITE_GEMINI_MODEL_IMAGE);
      console.log("  - Final model used:", model);
      console.log("🌍 Image data URLs count:", imageDataUrls.length);
      
      const genCfg = speedMode === 'Quality'
        ? { maxOutputTokens: 384, temperature: 0.95 }
        : { maxOutputTokens: 160, temperature: 0.7 };

      const instructionFast =
        "You are a professional prompt engineer specializing in environmental analysis. Analyze the scene/environment and create a concise prompt focusing on: setting type (indoor/outdoor, studio, natural, urban), background elements, lighting setup (natural, artificial, directional), composition style (minimalist, busy, centered), and overall atmosphere. Be specific about environmental design choices.";
      const instructionQuality =
        "You are an expert environmental design analyst. Examine the scene/environment in detail and create a comprehensive prompt that captures: 1) Setting and location type (studio, natural environment, architectural space, etc.), 2) Background composition (elements, depth, negative space, framing), 3) Lighting analysis (source, direction, quality, mood, shadows), 4) Spatial relationships (foreground, midground, background hierarchy), 5) Atmospheric qualities (mood, tone, weather, time of day), 6) Environmental style (minimalist, detailed, realistic, stylized). Focus on how the environment supports and frames the overall composition.";
      const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

      console.log("🌍 About to call generateWithImagesREST for scene analysis");
      const analyzedScene = await generateWithImagesREST({ apiKey, model, text: instruction, imageDataUrls, generationConfig: genCfg });
      console.log("🌍 Scene analysis result:", analyzedScene);
      console.log("🌍 Setting scene analysis to:", analyzedScene);
      setSceneAnalysis(analyzedScene);
      console.log("🌍 Scene analysis complete, scene analysis set");
    } catch (e2) {
      console.error("🚨 Scene analysis failed:", e2);
      
      // More specific error handling
      if (e2.message && e2.message.includes('429')) {
        alert(`API Rate Limit Exceeded: You've hit your Gemini API quota. Even with paid tier, you may have daily/hourly limits. Please wait a few minutes and try again, or check your Google AI Studio usage dashboard.`);
      } else if (e2.message && e2.message.includes('401')) {
        alert(`API Authentication Error: Please check your VITE_GEMINI_API_KEY in the .env file.`);
      } else if (e2.message && e2.message.includes('403')) {
        alert(`API Access Forbidden: Your API key may not have access to the Gemini model. Check your Google AI Studio permissions.`);
      } else {
        alert(`Scene analysis failed: ${e2.message || e2}`);
      }
    } finally {
      setIsAnalyzingScene(false);
    }
  };

  const runStyleAnalysis = async () => {
    console.log("🎨 runStyleAnalysis called, styleImages.length:", styleImages.length);
    if (styleImages.length === 0) return;
    setIsAnalyzingStyle(true);
    try {
      const imageDataUrls = await getImageDataUrls(styleImages, speedMode);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-2.5-flash";
      const mmModel = envModel || "gemini-2.5-flash"; // ensure 2.5 flash fallback
      const genCfg = speedMode === 'Quality'
        ? { maxOutputTokens: 384, temperature: 0.95 }
        : { maxOutputTokens: 160, temperature: 0.7 };

      const instructionFast =
        "You are a professional prompt engineer specializing in artistic style analysis. Analyze the artistic style and create a concise prompt focusing on: rendering technique (3D, 2D, mixed media), art movement/style (kawaii, realistic, anime, etc.), color theory (palette, harmony, contrast), cultural influences, and aesthetic approach. Identify the core artistic essence in 2-6 descriptive words.";
      const instructionQuality =
        "You are an expert artistic style analyst. Examine the artistic style in detail and create a comprehensive prompt that captures: 1) Rendering technique and medium (3D CGI, traditional art, digital painting, etc.), 2) Art movement and cultural influences (kawaii, western animation, fine art, etc.), 3) Color theory and palette (harmony, contrast, temperature, saturation), 4) Technical execution (surface finish, lighting style, texture quality), 5) Aesthetic philosophy (minimalist, maximalist, cute, dramatic, etc.), 6) Historical or contemporary context (modern, retro, futuristic). Focus on identifying the core artistic DNA that defines the visual style and could be replicated in other works.";
      const instruction = speedMode === 'Quality' ? instructionQuality : instructionFast;

      console.log("🎨 About to call generateWithImagesREST for style analysis");
      const analyzedStyle = await generateWithImagesREST({ apiKey, model: mmModel, text: instruction, imageDataUrls, generationConfig: genCfg });
      console.log("🎨 Style analysis result:", analyzedStyle);
      console.log("🎨 Setting style analysis to:", analyzedStyle);
      setStyleAnalysis(analyzedStyle);
      console.log("🎨 Style analysis complete, style analysis set");
    } catch (e2) {
      console.error("🚨 Style analysis failed:", e2);
      
      // More specific error handling
      if (e2.message && e2.message.includes('429')) {
        alert(`API Rate Limit Exceeded: You've hit your Gemini API quota. Even with paid tier, you may have daily/hourly limits. Please wait a few minutes and try again, or check your Google AI Studio usage dashboard.`);
      } else if (e2.message && e2.message.includes('401')) {
        alert(`API Authentication Error: Please check your VITE_GEMINI_API_KEY in the .env file.`);
      } else if (e2.message && e2.message.includes('403')) {
        alert(`API Access Forbidden: Your API key may not have access to the Gemini model. Check your Google AI Studio permissions.`);
      } else {
        alert(`Style analysis failed: ${e2.message || e2}`);
      }
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  const analyzeAllStyles = async () => {
    console.log("🚀 analyzeAllStyles called - running all image analyses simultaneously");
    
    const promises = [];
    
    // Run subject analysis if images exist
    if (subjectImages.length > 0) {
      console.log("🔍 Adding subject analysis to batch");
      promises.push(runSubjectAnalysis());
    }
    
    // Run scene analysis if images exist
    if (sceneImages.length > 0) {
      console.log("🌍 Adding scene analysis to batch");
      promises.push(runSceneAnalysis());
    }
    
    // Run style analysis if images exist
    if (styleImages.length > 0) {
      console.log("🎨 Adding style analysis to batch");
      promises.push(runStyleAnalysis());
    }
    
    if (promises.length === 0) {
      console.log("⚠️ No images to analyze");
      return;
    }
    
    try {
      console.log(`🚀 Running ${promises.length} analyses simultaneously...`);
      await Promise.all(promises);
      console.log("✅ All style analyses completed successfully");
    } catch (error) {
      console.error("🚨 Error in batch analysis:", error);
      alert(`Batch analysis failed: ${error.message || error}`);
    }
  };

  const handleClearGeneral = () => {
    setImages([]);
  };

  const handleClearAll = () => {
    console.log("🧹 Clearing all application state...");
    // Clear all prompts and text
    setPrompt("");
    setEditorSeed("");
    setRawPrompt(""); // <-- Ensure rawPrompt is also cleared
    setImages([]);
    setSubjectImages([]);
    setSceneImages([]);
    setStyleImages([]);
    
    // Clear all analysis results
    setSubjectAnalysis('');
    setSceneAnalysis('');
    setStyleAnalysis('');
    setLastSource(undefined);
    
    // Reset all analyzing states to prevent blocking new uploads
    setIsAnalyzing(false);
    setIsAnalyzingSubject(false);
    setIsAnalyzingScene(false);
    setIsAnalyzingStyle(false);
    setIsGenerating(false);
    
    // Clear all preview states and revoke object URLs to prevent memory leaks
    if (subjectPreview) {
      URL.revokeObjectURL(subjectPreview);
      setSubjectPreview(undefined);
    }
    if (scenePreview) {
      URL.revokeObjectURL(scenePreview);
      setScenePreview(undefined);
    }
    if (stylePreview) {
      URL.revokeObjectURL(stylePreview);
      setStylePreview(undefined);
    }
    
    // Reset simple style states
    setIsSimpleStyleActive(false);
    setOriginalPromptBeforeSimple('');
    
    // Reset toggle states
    setUseStyle(true);
    setUseScene(true);
    
    console.log("✅ All application state cleared successfully");
    
    // Optional: Refresh the page to ensure complete browser state reset
    // This helps with any lingering file input states or browser caching issues
    setTimeout(() => {
      if (confirm("Clear All completed. Would you like to refresh the page to ensure all browser states are reset? This can help with image upload issues.")) {
        window.location.reload();
      }
    }, 100);
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
    console.log("🔄 REGENERATE BUTTON CLICKED - Starting image re-analysis");
    
    // Check if we have any images to re-analyze
    const hasMainImages = images.length > 0;
    const hasSubjectImages = subjectImages.length > 0;
    const hasSceneImages = sceneImages.length > 0;
    const hasStyleImages = styleImages.length > 0;
    const hasAnyImages = hasMainImages || hasSubjectImages || hasSceneImages || hasStyleImages;
    
    if (!hasAnyImages && !prompt) {
      alert("No images or prompt to regenerate. Please add images or generate a prompt first.");
      return;
    }

    setIsGenerating(true);
    try {
      // If we have images, re-analyze them with variation prompts
      if (hasAnyImages) {
        console.log("🖼️ Re-analyzing images with variation prompts");
        
        // Create variation instruction prompts
        const variationInstructions = [
          "with a different artistic perspective and creative interpretation",
          "focusing on alternative visual elements and atmospheric details", 
          "emphasizing different lighting conditions and mood variations",
          "highlighting unique compositional angles and stylistic approaches",
          "exploring alternative color schemes and visual techniques"
        ];
        
        const randomVariation = variationInstructions[Math.floor(Math.random() * variationInstructions.length)];
        
        // Use the same logic as auto-analysis but with variation
        const imageDataUrls = await getImageDataUrls(images, speedMode);
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("VITE_GEMINI_API_KEY not configured");
        }
        const envModel = import.meta.env.VITE_GEMINI_MODEL_IMAGES || import.meta.env.VITE_GEMINI_MODEL_IMAGE;
        const model = envModel || "gemini-2.0-flash";
        const genCfg = speedMode === 'Quality'
          ? { maxOutputTokens: 500, temperature: 0.8 } // Higher temperature for more variation
          : { maxOutputTokens: 400, temperature: 0.7 };
        
        const baseInstructionFast = "You are a professional prompt engineer. Analyze the input image and produce a single, vivid, 1–2 sentence prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Don't invent details not visible.";
        const baseInstructionQuality = "Analyze these images in detail and create a comprehensive, descriptive prompt based on what you see. Expand important details (subject, context, style, lighting, composition, lens, mood, constraints). Return only the improved prompt.";
        
        const baseInstruction = speedMode === 'Quality' ? baseInstructionQuality : baseInstructionFast;
        const instruction = `${baseInstruction} Create this analysis ${randomVariation}.`;
        
        console.log("🎯 Using variation:", randomVariation);
        console.log("🔧 Using model:", model, "config:", genCfg);
        
        const regeneratedPrompt = await generateWithImagesREST({ 
          apiKey, 
          model, 
          text: instruction, 
          imageDataUrls, 
          generationConfig: genCfg 
        });
        
        console.log("🔍 Regenerated prompt result:", regeneratedPrompt);
        console.log("🔍 Regenerated prompt type:", typeof regeneratedPrompt);
        console.log("🔍 Regenerated prompt length:", regeneratedPrompt?.length);
        console.log("🔍 Current prompt before update:", prompt);
        
        setPrompt(regeneratedPrompt);
        setEditorSeed(regeneratedPrompt);
        setLastSource("gemini-mm");
        
        console.log("🔍 Prompt state after update:", regeneratedPrompt);
        console.log("✅ Image re-analysis regeneration completed successfully");
      } else {
        // Fallback to text-based regeneration if no images
        console.log("📝 No images found, using text-based regeneration");
        
        const variationPrompts = [
          "Create a variation of this prompt with different artistic style and mood:",
          "Rewrite this prompt with more vivid details and enhanced atmosphere:",
          "Transform this prompt with a different lighting approach and composition:",
          "Enhance this prompt with more specific camera details and visual effects:",
          "Reimagine this prompt with alternative color palette and artistic techniques:"
        ];

        const randomVariation = variationPrompts[Math.floor(Math.random() * variationPrompts.length)];
        const regenerationPrompt = `${randomVariation}\n\nOriginal prompt: ${prompt}`;
        const textModel = import.meta.env.VITE_GEMINI_MODEL_TEXT || "gemini-2.5-flash";
        
        const regeneratedPrompt = await generateWithGemini(regenerationPrompt, textModel, true);
        
        setPrompt(regeneratedPrompt);
        setEditorSeed(regeneratedPrompt);
        setLastSource("regenerated");
        
        console.log("✅ Text-based regeneration completed successfully");
      }
    } catch (error) {
      console.error("❌ Regeneration failed:", error);
      alert("Failed to regenerate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="relative dark min-h-screen text-dark-text-primary">
      <BackgroundCanvas color="#000000" opacity={1} effect="grain" effectOpacity={0.06} />
      
      {/* Header with Navigation */}
      <div className="max-w-7xl mx-auto px-4">
        <BrandHeader logoSrc="Genie.png" />
        
        {/* Mode Toggle Navigation */}
        <div className="flex justify-center mt-4 mb-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setCurrentMode('prompt')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                currentMode === 'prompt'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Prompt Generator
            </button>
            <button
              onClick={() => setCurrentMode('storyboard')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                currentMode === 'storyboard'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Storyboard Creator
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {currentMode === 'prompt' ? (
          /* Prompt Generation Mode */
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
                onAnalyzeAllStyles={analyzeAllStyles}
              />
            </div>

            {/* Second: Prompt editor */}
            <div className={editorExpanded ? "panel-auto-height" : "panel-standard-height"}>
              <DM2PromptEditor
                initialText={editorSeed}
                initialSpeedMode={speedMode}
                onSpeedModeChange={setSpeedMode}
                rewriteStyle={rewriteStyle}
                onRewriteStyleChange={setRewriteStyle}
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
                onCopy={handleCopy}
                onEdit={handleEdit}
                onClear={handleClearPrompt}
                onRegenerate={handleRegenerate}
                hasImages={subjectImages.length > 0 || sceneImages.length > 0 || styleImages.length > 0}
                isGenerating={isGenerating}
              />
              
              {/* Quick Switch to Storyboard */}
              {prompt && (
                <div className="mt-4 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Ready to create a storyboard?</h4>
                  <button
                    onClick={() => setCurrentMode('storyboard')}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    Create Storyboard →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Storyboard Mode */
          <div className="min-h-[600px] bg-gray-900/50 border border-gray-700 rounded-xl">
            <StoryboardPanel 
              initialPrompt={prompt}
              onBackToPrompts={() => setCurrentMode('prompt')}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
