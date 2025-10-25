import React, { useEffect, useState } from "react";
import DM2PromptEditor from "./components/DM2PromptEditor";
import CurrentPromptPanel from "./components/CurrentPromptPanel";
import ImageDropZone from "./components/ImageDropZone";
import { analyzeImage, textToPrompt, refinePrompt } from "./services/replicate";
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
  const [lastSource, setLastSource] = useState<"edge" | "gemini-mm" | "gemini-text" | "subject" | "scene" | "style" | undefined>(undefined);
  
  // Debug logging for state changes
  useEffect(() => {
    console.log("🔄 Prompt state changed:", prompt ? `"${prompt.substring(0, 50)}..."` : "EMPTY");
  }, [prompt]);

  useEffect(() => {
    console.log("🔄 LastSource state changed:", lastSource);
  }, [lastSource]);
  const [speedMode, setSpeedMode] = useState<SpeedMode>('Fast');
  
  // State for independent image analysis
  const [subjectImages, setSubjectImages] = useState<File[]>([]);
  const [sceneImages, setSceneImages] = useState<File[]>([]);
  const [styleImages, setStyleImages] = useState<File[]>([]);
  const [isAnalyzingSubject, setIsAnalyzingSubject] = useState(false);
  const [isAnalyzingScene, setIsAnalyzingScene] = useState(false);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [autoAnalyzeSubject, setAutoAnalyzeSubject] = useState(true);
  const [autoAnalyzeScene, setAutoAnalyzeScene] = useState(true);
  const [autoAnalyzeStyle, setAutoAnalyzeStyle] = useState(true);
  
  // Store individual analysis results
  const [subjectAnalysis, setSubjectAnalysis] = useState<string>('');
  const [sceneAnalysis, setSceneAnalysis] = useState<string>('');
  const [styleAnalysis, setStyleAnalysis] = useState<string>('');

  // Debug function to clear subject analysis
  const clearSubjectAnalysis = () => {
    console.log("🧹 Clearing subject analysis state");
    setSubjectAnalysis('');
  };
  
  // Toggle states for using style/scene descriptors
  const [useStyle, setUseStyle] = useState<boolean>(true);
  const [useScene, setUseScene] = useState<boolean>(true);
  const [isSimpleStyleActive, setIsSimpleStyleActive] = useState<boolean>(false);
  const [originalPromptBeforeSimple, setOriginalPromptBeforeSimple] = useState<string>('');
  
  // Preview states for image thumbnails
  const [subjectPreview, setSubjectPreview] = useState<string | undefined>(undefined);
  const [scenePreview, setScenePreview] = useState<string | undefined>(undefined);
  const [stylePreview, setStylePreview] = useState<string | undefined>(undefined);



  const handleImageFiles = async (files: File[]) => {
    if (!files) return;
    setImages(files);
  };

  // New: role handlers wired to ImageDropZone
  const handleStyleFile = (file?: File) => setStyleFile(file);
  const handleSceneFile = (file?: File) => setSceneFile(file);

  const handleSend = async (finalPrompt: string) => {
    console.log("🚀🚀🚀 HANDLE SEND TRIGGERED! 🚀🚀🚀");
    console.log("🚀 handleSend called with prompt:", finalPrompt.substring(0, 100) + (finalPrompt.length > 100 ? "..." : ""));
    console.log("🚀 Current images count:", images.length);
    console.log("🚀 Analysis states:", { subjectAnalysis, styleAnalysis, sceneAnalysis, useStyle, useScene });
    setIsGenerating(true);
    
    try {
      // Compose prompt with optional style/scene descriptors and subject analysis
      const composed = composePrompt({
        userText: finalPrompt,
        contentSummary: subjectAnalysis,
        style: styleAnalysis,
        scene: sceneAnalysis,
        useStyle,
        useScene,
      });
      console.log("🚀 Composed prompt:", composed);
      console.log("🚀 Composed prompt length:", composed.length);

      if (images.length > 0) {
        console.log("🚀 Taking IMAGE path - analyzing with Gemini Vision");
        // For now, just use the first image for analysis and generate a prompt
        const result = await analyzeImage(images[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });
        
        console.log("🔍 Image analysis result:", result);
        
        const promptInput = `${composed}. Based on this image: ${result.description}`;
        console.log("📝 About to call textToPrompt with:", promptInput);
        
        // Generate an enhanced prompt based on the image analysis
        const enhancedPrompt = await textToPrompt(
          promptInput,
          undefined,
          speedMode === 'Quality' ? 'high detail, professional quality' : 'good quality'
        );
        
        console.log("✅ Enhanced prompt generated:", enhancedPrompt);
        setPrompt(enhancedPrompt);
        setEditorSeed(enhancedPrompt);
        setLastSource("gemini-mm");
      } else {
        console.log("🚀 Taking TEXT-ONLY path - generating with Gemini");
        const result = await textToPrompt(composed);
        console.log("🚀 Text generation result:", result.substring(0, 100) + (result.length > 100 ? "..." : ""));
        setPrompt(result);
        setEditorSeed(result);
        setLastSource("gemini-text");
      }
    } catch (err2) {
      console.error("Gemini call failed:", err2);
      console.error("Error details:", {
        message: err2.message,
        stack: err2.stack,
        name: err2.name
      });
      
      // More specific error messages
      let errorMessage = "An error occurred while generating. Please try again.";
      if (err2.message?.includes('API key')) {
        errorMessage = "API key error: Please check your VITE_GOOGLE_API_KEY environment variable.";
      } else if (err2.message?.includes('quota') || err2.message?.includes('429')) {
        errorMessage = "API quota exceeded: You've hit your Gemini API limit. Please wait and try again later.";
      } else if (err2.message?.includes('401') || err2.message?.includes('403')) {
        errorMessage = "Authentication error: Please check your API key permissions.";
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReanalyze = async () => {
    console.log("🔄 Reanalyze triggered");
    
    // Reanalyze main images if they exist
    if (images.length > 0) {
      setIsAnalyzing(true);
      try {
        const result = await analyzeImage(images[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });
        
        // Generate a prompt based on the analysis
        const generatedPrompt = await textToPrompt(
          `Create an image generation prompt based on this analysis: ${result.description}`,
          undefined,
          speedMode === 'Quality' ? 'high detail, professional quality' : 'good quality'
        );
        
        setPrompt(generatedPrompt);
        setEditorSeed(generatedPrompt);
        setLastSource("gemini-mm");
      } catch (e) {
        console.error("Reanalyze main images failed", e);
      } finally {
        setIsAnalyzing(false);
      }
    }

    // Reanalyze subject images if they exist
    if (subjectImages.length > 0) {
      setIsAnalyzingSubject(true);
      try {
        const result = await analyzeImage(subjectImages[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });
        
        console.log("👤 Subject reanalysis result:", result.description);
        setSubjectAnalysis(result.description);
      } catch (e) {
        console.error("Reanalyze subject failed", e);
      } finally {
        setIsAnalyzingSubject(false);
      }
    }

    // Reanalyze scene images if they exist
    if (sceneImages.length > 0) {
      setIsAnalyzingScene(true);
      try {
        const result = await analyzeImage(sceneImages[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });
        
        console.log("🔍 Scene reanalysis result:", result.description);
        setSceneAnalysis(result.description);
      } catch (e) {
        console.error("Reanalyze scene failed", e);
      } finally {
        setIsAnalyzingScene(false);
      }
    }

    // Reanalyze style images if they exist
    if (styleImages.length > 0) {
      setIsAnalyzingStyle(true);
      try {
        const result = await analyzeImage(styleImages[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });
        
        console.log("🎨 Style reanalysis result:", result.description);
        setStyleAnalysis(result.description);
      } catch (e) {
        console.error("Reanalyze style failed", e);
      } finally {
        setIsAnalyzingStyle(false);
      }
    }
  };

  // Auto-analyze images when they are added, honoring Speed Mode (existing behavior)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyze || images.length === 0) return;
      setIsAnalyzing(true);
      try {
        const result = await analyzeImage(images[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });
        
        // Generate a prompt based on the analysis
        const generatedPrompt = await textToPrompt(
          `Create an image generation prompt based on this analysis: ${result.description}`,
          undefined,
          speedMode === 'Quality' ? 'high detail, professional quality' : 'good quality'
        );
        
        if (!cancelled) {
          setPrompt(generatedPrompt);
          setEditorSeed(generatedPrompt);
          setLastSource("gemini-mm");
        }
      } catch (e2) {
        console.error("Auto-analyze call failed", e2);
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
      
      // Clear previous analysis to prevent cached results
      setSubjectAnalysis('');
      setIsAnalyzingSubject(true);
      try {
        const result = await analyzeImage(subjectImages[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });

        console.log("🔍 Auto-Analyze Subject - Response:", result.description);
        if (!cancelled) {
          setSubjectAnalysis(result.description);
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

  // Clear subject analysis when subject images are removed
  useEffect(() => {
    if (subjectImages.length === 0 && subjectAnalysis) {
      setSubjectAnalysis('');
    }
  }, [subjectImages, subjectAnalysis]);

  // Auto-analyze scene images when they are added
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyzeScene || sceneImages.length === 0) return;
      setIsAnalyzingScene(true);
      try {
        const result = await analyzeImage(sceneImages[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });

        console.log("🔍 Auto-Analyze Scene - Response:", result.description);
        if (!cancelled) {
          setSceneAnalysis(result.description);
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

  // Clear scene analysis when scene images are removed
  useEffect(() => {
    if (sceneImages.length === 0 && sceneAnalysis) {
      setSceneAnalysis('');
    }
  }, [sceneImages, sceneAnalysis]);

  // Auto-analyze style images when they are added
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!autoAnalyzeStyle || styleImages.length === 0) return;
      setIsAnalyzingStyle(true);
      try {
        const result = await analyzeImage(styleImages[0], { 
          detail: speedMode === 'Quality' ? 'detailed' : 'medium',
          tags: true 
        });

        console.log("🎨 Auto-Analyze Style - Response:", result.description);
        if (!cancelled) {
          setStyleAnalysis(result.description);
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

  // Clear style analysis when style images are removed
  useEffect(() => {
    if (styleImages.length === 0 && styleAnalysis) {
      setStyleAnalysis('');
    }
  }, [styleImages, styleAnalysis]);

  // Combine subject, scene, and style analysis results into the main prompt
  useEffect(() => {
    if (subjectAnalysis || sceneAnalysis || styleAnalysis) {
      const combinedPrompt = composePrompt({
        userText: '', // Start fresh for combined analysis
        contentSummary: subjectAnalysis,
        scene: sceneAnalysis,
        style: styleAnalysis,
        useScene: !!sceneAnalysis,
        useStyle: !!styleAnalysis
      });
      
      if (combinedPrompt !== prompt) {
        setPrompt(combinedPrompt);
        setEditorSeed(combinedPrompt);
        
        // Determine the appropriate source label based on what's combined
        const hasSubject = !!subjectAnalysis;
        const hasScene = !!sceneAnalysis;
        const hasStyle = !!styleAnalysis;
        
        if (hasSubject && hasScene && hasStyle) {
          setLastSource("subject+scene+style");
        } else if (hasSubject && hasScene) {
          setLastSource("subject+scene");
        } else if (hasSubject && hasStyle) {
          setLastSource("subject+style");
        } else if (hasScene && hasStyle) {
          setLastSource("scene+style");
        } else if (hasSubject) {
          setLastSource("subject");
        } else if (hasScene) {
          setLastSource("scene");
        } else if (hasStyle) {
          setLastSource("style");
        }
      }
    } else {
      // Clear prompt when no analyses are present
      if (prompt && (lastSource === "subject" || lastSource === "scene" || lastSource === "style" || 
                     lastSource?.includes("subject") || lastSource?.includes("scene") || lastSource?.includes("style"))) {
        setPrompt("");
        setEditorSeed("");
        setLastSource(undefined);
      }
    }
  }, [subjectAnalysis, sceneAnalysis, styleAnalysis, prompt, lastSource]);

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
      const result = await analyzeImage(images[0], { 
        detail: speedMode === 'Quality' ? 'detailed' : 'medium',
        tags: true 
      });
      
      // Generate a prompt based on the analysis
      const generatedPrompt = await textToPrompt(
        `Create an image generation prompt based on this analysis: ${result.description}`,
        undefined,
        speedMode === 'Quality' ? 'high detail, professional quality' : 'good quality'
      );
      
      setPrompt(generatedPrompt);
      setEditorSeed(generatedPrompt);
      setLastSource("gemini-mm");
    } catch (e2) {
      console.error("Manual analysis failed", e2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Manual trigger functions for independent analysis
  // Test function to verify server and API key works
  const testApiKey = async (apiKey: string) => {
    try {
      // Test server health first
      const healthEndpoint = `http://localhost:3001/api/health`;
      console.log("🔧 Testing server health:", healthEndpoint);
      
      const healthResponse = await fetch(healthEndpoint);
      if (!healthResponse.ok) {
        throw new Error(`Server not available: ${healthResponse.status}`);
      }
      
      const healthData = await healthResponse.json();
      console.log("🔧 Server health:", healthData);
      
      // Test actual API functionality
      const testEndpoint = `http://localhost:3001/api/test`;
      console.log("🔧 Testing API functionality:", testEndpoint);
      
      const response = await fetch(testEndpoint);
      
      if (response.ok) {
        console.log("✅ API Key test successful");
        return true;
      } else {
        const errorText = await response.text();
        console.error("❌ API Key test failed:", response.status, errorText);
        
        // Provide specific error messages
        if (response.status === 429) {
          alert("API quota exceeded. Please check your Gemini API quota limits or try again later.");
        } else if (response.status === 401) {
          alert("Authentication failed. Please check your Gemini API key.");
        } else if (response.status === 403) {
          alert("Access forbidden. Please verify your API key has the necessary permissions.");
        } else {
          alert(`API test failed with status ${response.status}. Please check your API key and try again.`);
        }
        return false;
      }
    } catch (error) {
      console.error("❌ API Key test error:", error);
      alert("Network error during API test. Please check your internet connection and try again.");
      return false;
    }
  };

  const runSubjectAnalysis = async () => {
    console.log("🔍 runSubjectAnalysis called, subjectImages.length:", subjectImages.length);
    if (subjectImages.length === 0) return;
    setIsAnalyzingSubject(true);
    try {
      const result = await analyzeImage(subjectImages[0], { 
        detail: speedMode === 'Quality' ? 'detailed' : 'medium',
        tags: true 
      });
      
      console.log("🔍 Subject analysis result:", result.description);
      
      setSubjectAnalysis(result.description);
      console.log("🔍 Subject analysis complete");
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
    if (sceneImages.length === 0) return;
    setIsAnalyzingScene(true);
    try {
      const result = await analyzeImage(sceneImages[0], { 
        detail: speedMode === 'Quality' ? 'detailed' : 'medium',
        tags: true 
      });

      console.log("🔍 Scene analysis result:", result.description);
      setSceneAnalysis(result.description);
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
      const result = await analyzeImage(styleImages[0], { 
        detail: speedMode === 'Quality' ? 'detailed' : 'medium',
        tags: true 
      });

      console.log("🎨 Style analysis result:", result.description);
      setStyleAnalysis(result.description);
    } catch (e2) {
      console.error("Style analysis failed", e2);
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  const handleClearGeneral = () => {
    setImages([]);
  };

  const handleSimpleStyle = (style: string) => {
    if (isSimpleStyleActive) {
      // Toggle OFF: Restore original prompt
      setPrompt(originalPromptBeforeSimple);
      setEditorSeed(originalPromptBeforeSimple);
      setIsSimpleStyleActive(false);
      setOriginalPromptBeforeSimple('');
    } else {
      // Toggle ON: Store current prompt and apply simple style
      setOriginalPromptBeforeSimple(prompt);
      setStyleAnalysis(style);
      setPrompt(style);
      setEditorSeed(style);
      setLastSource("style");
      setIsSimpleStyleActive(true);
    }
  };

  const handleClearAll = () => {
    setPrompt("");
    setEditorSeed("");
    setImages([]);
    setSubjectImages([]);
    setSceneImages([]);
    setStyleImages([]);
    setSubjectAnalysis('');
    setSceneAnalysis('');
    setStyleAnalysis('');
    setLastSource(undefined);
    
    // Reset analyzing states to prevent blocking new uploads
    setIsAnalyzing(false);
    setIsAnalyzingSubject(false);
    setIsAnalyzingScene(false);
    setIsAnalyzingStyle(false);
    
    // Reset preview states
    setSubjectPreview(undefined);
    setScenePreview(undefined);
    setStylePreview(undefined);
    
    // Reset simple style states
    setIsSimpleStyleActive(false);
    setOriginalPromptBeforeSimple('');
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
      console.log('🔄 Starting regenerate process...');
      
      const improved = await refinePrompt(prompt, 'refine');
      
      setPrompt(improved);
      setEditorSeed(improved);
      setLastSource("gemini-text");
    } catch (e) {
      console.error("Regenerate failed:", e);
      alert("Could not regenerate prompt. Please check your API key and try again.");
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
              onSimpleStyle={handleSimpleStyle}
              styleAnalysis={styleAnalysis}
              isSimpleStyleActive={isSimpleStyleActive}
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
              onReanalyze={handleReanalyze}
              onResizeStart={() => setEditorExpanded(true)}
              onResizeEnd={() => setEditorExpanded(true)}
              styleDesc={styleAnalysis}
              sceneDesc={sceneAnalysis}
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
