import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Wand2,
  Eye,
  Download,
  Sparkles,
  X,
  Maximize2,
  Edit,
  RotateCw,
  GripVertical,
  Trash2,
  MoreVertical,
  Check,
} from "lucide-react";

// Type definitions for storyboard and plan
type ImageModel = "imagen3" | "nano-banana" | "auto";

interface StoryboardFrame {
  id: string;
  image_url: string;
  title: string;
  description: string;
  status?: string;
  model?: ImageModel;
  isCharacterFocused?: boolean;
}

interface Storyboard {
  storyboardId: string;
  frames: StoryboardFrame[];
}

interface StoryboardPlan {
  storyboardId: string;
  frames: { description: string; isCharacterFocused?: boolean }[];
}

interface StoryboardPanelProps {
  initialPrompt?: string;
  onBackToPrompts?: () => void;
}

function StoryboardPanel({ initialPrompt = "", onBackToPrompts }: StoryboardPanelProps) {
  const [intent, setIntent] = React.useState<string>("");
  const [plan, setPlan] = React.useState<StoryboardPlan | null>(null);
  const [storyboard, setStoryboard] = React.useState<Storyboard | null>(null);
  const [selectedFrame, setSelectedFrame] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultsCount, setResultsCount] = React.useState<number>(7);
  const [aspectRatio, setAspectRatio] = React.useState<string>("16:9");
  const [generationMode, setGenerationMode] = React.useState<string>("auto");
  const [isPlanExpanded, setIsPlanExpanded] = React.useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState<boolean>(false);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = React.useState<boolean>(false);
  const [lightboxImageIndex, setLightboxImageIndex] = React.useState<number>(0);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [selectedFrames, setSelectedFrames] = React.useState<Set<number>>(new Set());
  const [editingFrameTitle, setEditingFrameTitle] = React.useState<number | null>(null);
  const [menuOpenForFrame, setMenuOpenForFrame] = React.useState<number | null>(null);
  const [defaultModel, setDefaultModel] = React.useState<ImageModel>("auto");
  const [frameModels, setFrameModels] = React.useState<Map<number, ImageModel>>(new Map());
  const API_BASE = "/api/storyboards";

  // IndexedDB helper for large image storage
  const openDB = async () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('StoryboardDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('storyboards')) {
          db.createObjectStore('storyboards', { keyPath: 'id' });
        }
      };
    });
  };

  const saveStoryboardToDB = async (sb: Storyboard) => {
    try {
      const db = await openDB();
      const tx = db.transaction('storyboards', 'readwrite');
      const store = tx.objectStore('storyboards');
      await store.put({ id: 'lastStoryboard', data: sb });
    } catch (e) {
      console.error('Failed to save storyboard to IndexedDB:', e);
    }
  };

  const loadStoryboardFromDB = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction('storyboards', 'readonly');
      const store = tx.objectStore('storyboards');
      return new Promise<any>((resolve, reject) => {
        const request = store.get('lastStoryboard');
        request.onsuccess = () => resolve(request.result?.data);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to load storyboard from IndexedDB:', e);
      return null;
    }
  };

  const savePlanToDB = async (p: StoryboardPlan) => {
    try {
      const db = await openDB();
      const tx = db.transaction('storyboards', 'readwrite');
      const store = tx.objectStore('storyboards');
      await store.put({ id: 'lastPlan', data: p });
    } catch (e) {
      console.error('Failed to save plan to IndexedDB:', e);
    }
  };

  const loadPlanFromDB = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction('storyboards', 'readonly');
      const store = tx.objectStore('storyboards');
      return new Promise<any>((resolve, reject) => {
        const request = store.get('lastPlan');
        request.onsuccess = () => resolve(request.result?.data);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to load plan from IndexedDB:', e);
      return null;
    }
  };

  // Auto-populate with initial prompt
  React.useEffect(() => {
    if (initialPrompt && !intent) {
      setIntent(initialPrompt);
    }
  }, [initialPrompt, intent]);

  // Load saved storyboard from IndexedDB on mount
  React.useEffect(() => {
    const loadSaved = async () => {
      const savedStoryboard = await loadStoryboardFromDB();
      const savedPlan = await loadPlanFromDB();
      if (savedStoryboard) {
        setStoryboard(savedStoryboard);
      }
      if (savedPlan) {
        setPlan(savedPlan);
      }
    };
    loadSaved();
  }, []);

  // Save storyboard to IndexedDB whenever it changes
  React.useEffect(() => {
    if (storyboard) {
      saveStoryboardToDB(storyboard);
    }
  }, [storyboard]);

  // Save plan to IndexedDB whenever it changes
  React.useEffect(() => {
    if (plan) {
      savePlanToDB(plan);
    }
  }, [plan]);

  function generateStoryboardId(intent: string) {
    // Simple deterministic hash for storyboardId
    let hash = 0;
    for (let i = 0; i < intent.length; i++) {
      hash = (hash << 5) - hash + intent.charCodeAt(i);
      hash |= 0;
    }
    return "sb_" + Math.abs(hash);
  }

  // Image lightbox functions
  const openImageLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setIsImageLightboxOpen(true);
  };

  const closeImageLightbox = () => {
    setIsImageLightboxOpen(false);
  };

  const goToPreviousImage = () => {
    if (storyboard && storyboard.frames.length > 0) {
      setLightboxImageIndex((prev) => (prev === 0 ? storyboard.frames.length - 1 : prev - 1));
    }
  };

  const goToNextImage = () => {
    if (storyboard && storyboard.frames.length > 0) {
      setLightboxImageIndex((prev) => (prev === storyboard.frames.length - 1 ? 0 : prev + 1));
    }
  };

  // Keyboard support for image lightbox
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageLightboxOpen) return;

      if (e.key === 'Escape') {
        closeImageLightbox();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageLightboxOpen, storyboard]);

  // Frame selection handlers
  const toggleFrameSelection = (idx: number) => {
    const newSelection = new Set(selectedFrames);
    if (newSelection.has(idx)) {
      newSelection.delete(idx);
    } else {
      newSelection.add(idx);
    }
    setSelectedFrames(newSelection);
  };

  // Download frame handler
  const downloadFrame = async (frame: StoryboardFrame, idx: number) => {
    try {
      const response = await fetch(frame.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storyboard-frame-${idx + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download frame:', error);
      setError('Failed to download frame');
    }
  };

  // Delete frame handler
  const deleteFrame = (idx: number) => {
    if (!storyboard) return;
    if (confirm(`Are you sure you want to delete Scene ${idx + 1}?`)) {
      const newFrames = storyboard.frames.filter((_, i) => i !== idx);
      setStoryboard({ ...storyboard, frames: newFrames });
      if (selectedFrame >= newFrames.length) {
        setSelectedFrame(Math.max(0, newFrames.length - 1));
      }
      // Remove from selection if selected
      const newSelection = new Set(selectedFrames);
      newSelection.delete(idx);
      setSelectedFrames(newSelection);
    }
  };

  // Edit frame title handler
  const updateFrameTitle = (idx: number, newTitle: string) => {
    if (!storyboard) return;
    const newFrames = [...storyboard.frames];
    newFrames[idx] = { ...newFrames[idx], title: newTitle };
    setStoryboard({ ...storyboard, frames: newFrames });
    setEditingFrameTitle(null);
  };

  // Determine which model to use for a frame
  const getModelForFrame = (frameIndex: number, frame?: StoryboardFrame): ImageModel => {
    // Check if frame has explicit model selection
    if (frameModels.has(frameIndex)) {
      return frameModels.get(frameIndex)!;
    }

    // Check if frame is marked as character-focused
    if (frame?.isCharacterFocused) {
      return "nano-banana";
    }

    // Use default model setting
    if (defaultModel === "auto") {
      // Auto mode: analyze frame description for character focus
      const description = frame?.description || "";
      const characterKeywords = ["character", "person", "face", "portrait", "close-up", "expression", "emotion"];
      const hasCharacterFocus = characterKeywords.some(keyword =>
        description.toLowerCase().includes(keyword)
      );
      return hasCharacterFocus ? "nano-banana" : "imagen3";
    }

    return defaultModel;
  };

  // Toggle frame model
  const toggleFrameModel = (idx: number) => {
    const newModels = new Map(frameModels);
    // Get the ACTUAL current model using getModelForFrame, not just the stored value
    const currentModel = getModelForFrame(idx, storyboard?.frames[idx]);
    const nextModel: ImageModel = currentModel === "imagen3" ? "nano-banana" :
                                   currentModel === "nano-banana" ? "auto" : "imagen3";
    newModels.set(idx, nextModel);
    setFrameModels(newModels);
  };

  // Fetch storyboard plan
  const fetchStoryboardPlan = async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching storyboard plan for intent:", intent);
    try {
      const storyboardId = generateStoryboardId(intent);
      console.log("Generated storyboardId:", storyboardId);
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboardId,
          intent,
          frameCount: resultsCount, // Send the selected frame count
        }),
      };
      console.log("Sending request with options:", requestOptions);
      const response = await fetch(`${API_BASE}/plan`, requestOptions);
      console.log("Received response:", response);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch error:", errorText);
        throw new Error(errorText);
      }
      const data: StoryboardPlan = await response.json();
      setPlan(data);
    } catch (e: any) {
      console.error("Caught exception:", e);
      setError(e.message || "Failed to fetch storyboard plan.");
    } finally {
      setLoading(false);
    }
  };

  // Generate storyboard with parallel frame generation (3 at a time)
  const generateStoryboard = async () => {
    setLoading(true);
    setError(null);
    try {
      // First, create the storyboard metadata
      const response = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyboardId: plan?.storyboardId, plan }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data: Storyboard = await response.json();

      // Set initial storyboard with pending frames
      setStoryboard(data);

      // Generate frames in parallel (2 at a time to avoid rate limits)
      const frames = [...data.frames];
      const PARALLEL_COUNT = 2; // Reduced from 3 to avoid API rate limiting

      for (let i = 0; i < frames.length; i += PARALLEL_COUNT) {
        const batch = frames.slice(i, i + PARALLEL_COUNT);
        const batchPromises = batch.map((frame, batchIndex) => {
          const frameIndex = i + batchIndex;
          const selectedModel = getModelForFrame(frameIndex, frames[frameIndex]);

          console.log(`🎬 Starting frame ${frameIndex + 1}/${frames.length} with model: ${selectedModel}`);

          return fetch(`${API_BASE}/generate-frame`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyboardId: data.storyboardId,
              frameIndex: frameIndex,
              description: frames[frameIndex].description,
              aspectRatio: aspectRatio,
              model: selectedModel,
            }),
          })
            .then(async (frameResponse) => {
              if (frameResponse.ok) {
                const frameData = await frameResponse.json();
                console.log(`✅ Frame ${frameIndex + 1} generated successfully`);
                return { frameIndex, frame: frameData.frame };
              } else {
                const errorText = await frameResponse.text();
                console.error(`❌ Failed to generate frame ${frameIndex + 1}:`, {
                  status: frameResponse.status,
                  statusText: frameResponse.statusText,
                  error: errorText
                });
                return {
                  frameIndex,
                  frame: {
                    ...frames[frameIndex],
                    status: "error",
                    image_url: ""
                  }
                };
              }
            })
            .catch((frameError) => {
              console.error(`💥 Network error generating frame ${frameIndex + 1}:`, {
                message: frameError.message,
                stack: frameError.stack
              });
              return {
                frameIndex,
                frame: {
                  ...frames[frameIndex],
                  status: "error",
                  image_url: ""
                }
              };
            });
        });

        // Wait for current batch to complete
        const results = await Promise.all(batchPromises);

        // Update frames with results
        results.forEach((result) => {
          if (result) {
            frames[result.frameIndex] = result.frame;
          }
        });

        // Update storyboard with latest frames
        setStoryboard({ ...data, frames: [...frames] });
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate storyboard.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch storyboard details from backend
  const fetchStoryboardDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/details/${id}`);
      if (!response.ok) throw new Error(await response.text());
      const data: Storyboard = await response.json();
      setStoryboard(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch storyboard details.");
    } finally {
      setLoading(false);
    }
  };

  // Regenerate a single frame
  const regenerateFrame = async (frameIndex: number) => {
    if (!storyboard || !plan) return;

    setError(null);
    const frames = [...storyboard.frames];

    // Set frame status to pending
    frames[frameIndex] = {
      ...frames[frameIndex],
      status: "pending",
      image_url: ""
    };
    setStoryboard({ ...storyboard, frames: [...frames] });

    try {
      const selectedModel = getModelForFrame(frameIndex, frames[frameIndex]);
      const frameResponse = await fetch(`${API_BASE}/generate-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboardId: storyboard.storyboardId,
          frameIndex: frameIndex,
          description: frames[frameIndex].description,
          aspectRatio: aspectRatio,
          model: selectedModel,
        }),
      });

      if (frameResponse.ok) {
        const frameData = await frameResponse.json();
        frames[frameIndex] = frameData.frame;
        setStoryboard({ ...storyboard, frames: [...frames] });
      } else {
        const errorText = await frameResponse.text();
        console.error(`Failed to regenerate frame ${frameIndex + 1}:`, errorText);
        setError(`Failed to regenerate frame ${frameIndex + 1}`);
        // Set frame to error state
        frames[frameIndex] = {
          ...frames[frameIndex],
          status: "error",
          image_url: ""
        };
        setStoryboard({ ...storyboard, frames: [...frames] });
      }
    } catch (frameError) {
      console.error(`Error regenerating frame ${frameIndex + 1}:`, frameError);
      setError(`Error regenerating frame ${frameIndex + 1}`);
      // Set frame to error state
      frames[frameIndex] = {
        ...frames[frameIndex],
        status: "error",
        image_url: ""
      };
      setStoryboard({ ...storyboard, frames: [...frames] });
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 p-6 min-h-[600px]">
      {/* Left Column - Storyboard Gallery (responsive width) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 lg:flex-[3] flex flex-col min-w-0"
      >
        <AnimatePresence mode="wait">
          {storyboard && storyboard.frames && storyboard.frames.length > 0 ? (
            <motion.div
              key="storyboard-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                  Generated Storyboard
                </h3>
                <p className="text-gray-400 mt-1">
                  {storyboard.frames.length} scene
                  {storyboard.frames.length !== 1 ? "s" : ""} generated
                </p>
              </div>

              {/* Scrollable Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {storyboard.frames.map((frame, idx) => (
                    <motion.div
                      key={frame?.id || `frame-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: idx * 0.1,
                        type: "spring",
                        stiffness: 100,
                      }}
                      whileHover={{
                        scale: 1.03,
                        transition: { duration: 0.2 },
                      }}
                      className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl hover:shadow-purple-500/40 transition-all"
                    >
                      {/* Top Controls Bar */}
                      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3">
                        {/* Left: Checkbox and Frame Number */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFrameSelection(idx);
                            }}
                            className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all ${
                              selectedFrames.has(idx)
                                ? 'bg-purple-500 border-purple-500'
                                : 'bg-gray-800/80 border-gray-600 hover:border-purple-400'
                            }`}
                          >
                            {selectedFrames.has(idx) && (
                              <Check className="w-5 h-5 text-white" />
                            )}
                          </button>
                        </div>

                        {/* Right: Edit and More buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFrameTitle(idx);
                            }}
                            className="bg-gray-800/80 hover:bg-gray-700 text-white p-2 rounded-md transition-all flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="text-xs">Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenForFrame(menuOpenForFrame === idx ? null : idx);
                            }}
                            className="bg-gray-800/80 hover:bg-gray-700 text-white p-2 rounded-md transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Frame Number Badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 + 0.2, type: "spring" }}
                        className="absolute top-14 left-4 z-20 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg ring-4 ring-gray-900/50"
                      >
                        {idx + 1}
                      </motion.div>

                      {/* Image Container */}
                      <div
                        className="aspect-video bg-gray-950 relative overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (frame?.image_url) {
                            openImageLightbox(idx);
                          }
                        }}
                      >
                        {/* Model Badge - Bottom Left of Image */}
                        {frame?.image_url && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFrameModel(idx);
                            }}
                            className={`absolute bottom-4 left-4 z-30 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-110 shadow-xl ring-2 ring-black/50 ${
                              getModelForFrame(idx, frame) === "imagen3"
                                ? "bg-green-600 text-white"
                                : getModelForFrame(idx, frame) === "nano-banana"
                                ? "bg-orange-600 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                            title="Click to toggle model"
                          >
                            {getModelForFrame(idx, frame) === "imagen3"
                              ? "Imagen 3"
                              : getModelForFrame(idx, frame) === "nano-banana"
                              ? "Nano 🍌"
                              : "Auto"}
                          </motion.div>
                        )}
                        {frame?.status === "error" ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-red-950/20">
                            <div className="text-red-400 text-center px-4">
                              <X className="w-12 h-12 mx-auto mb-2" />
                              <p className="font-semibold">Failed to generate</p>
                              <p className="text-xs text-red-300 mt-1">Click regenerate to try again</p>
                            </div>
                          </div>
                        ) : frame?.image_url ? (
                          <motion.img
                            src={frame.image_url}
                            alt={frame?.title || `Frame ${idx + 1}`}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Loader2 className="w-12 h-12 text-purple-400" />
                            </motion.div>
                          </div>
                        )}

                        {/* Gradient Overlay on Hover */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end p-6 pointer-events-none"
                        >
                          <div className="text-white w-full">
                            <motion.h4
                              initial={{ y: 20, opacity: 0 }}
                              whileHover={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="font-bold text-xl mb-2"
                            >
                              {frame?.title || `Scene ${idx + 1}`}
                            </motion.h4>
                            <motion.p
                              initial={{ y: 20, opacity: 0 }}
                              whileHover={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.15 }}
                              className="text-sm text-gray-300 line-clamp-2"
                            >
                              {frame?.description}
                            </motion.p>
                          </div>
                        </motion.div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-5 bg-gray-800/80 backdrop-blur-sm">
                        {editingFrameTitle === idx ? (
                          <input
                            type="text"
                            defaultValue={frame?.title || `Scene ${idx + 1}`}
                            onBlur={(e) => updateFrameTitle(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateFrameTitle(idx, e.currentTarget.value);
                              } else if (e.key === 'Escape') {
                                setEditingFrameTitle(null);
                              }
                            }}
                            autoFocus
                            className="w-full bg-gray-700 text-white px-2 py-1 rounded mb-2 font-semibold text-lg"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h4 className="font-semibold text-white mb-2 text-lg truncate">
                            {frame?.title || `Scene ${idx + 1}`}
                          </h4>
                        )}
                        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-3">
                          {frame?.description || "Generating scene..."}
                        </p>

                        {/* Download and Delete Buttons */}
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFrame(frame, idx);
                            }}
                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFrame(idx);
                            }}
                            className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      {frame?.status === "pending" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 right-4 z-20 bg-yellow-500/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
                        >
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </motion.div>
                      )}

                      {/* More Options Menu */}
                      {menuOpenForFrame === idx && (
                        <div
                          className="absolute top-16 right-3 z-40 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[160px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageLightbox(idx);
                              setMenuOpenForFrame(null);
                            }}
                            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Fullscreen
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFrameTitle(idx);
                              setMenuOpenForFrame(null);
                            }}
                            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Title
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFrameModel(idx);
                              setMenuOpenForFrame(null);
                            }}
                            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2 text-sm"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>
                              Model: <strong>{getModelForFrame(idx, frame) === "imagen3" ? "Imagen 3" : getModelForFrame(idx, frame) === "nano-banana" ? "Nano 🍌" : "Auto"}</strong>
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFrame(frame, idx);
                              setMenuOpenForFrame(null);
                            }}
                            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <div className="border-t border-gray-700 my-1"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFrame(idx);
                              setMenuOpenForFrame(null);
                            }}
                            className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {frame?.image_url && (
                        <div className="absolute bottom-5 right-5 flex gap-2">
                          {/* Regenerate Button */}
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ opacity: 1, scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              regenerateFrame(idx);
                            }}
                            className="p-3 bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg transition-all"
                            title="Regenerate this frame"
                          >
                            <RotateCw className="w-5 h-5 text-white" />
                          </motion.button>

                          {/* Download Button */}
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ opacity: 1, scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Download logic
                              const link = document.createElement('a');
                              link.href = frame.image_url;
                              link.download = `${frame.title || `scene-${idx + 1}`}.png`;
                              link.click();
                            }}
                            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg transition-all"
                            title="Download this frame"
                          >
                            <Download className="w-5 h-5 text-white" />
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-md">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-20 h-20 mx-auto mb-6 text-purple-400/50" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-300 mb-3">
                  Your Storyboard Awaits
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Enter your story idea in the panel to the right, generate a
                  plan, and watch your vision come to life as stunning visual
                  scenes.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right Column - Controls (responsive width) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 lg:flex-[2] flex flex-col min-w-0 lg:min-w-[400px] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-purple-400" />
              AI Storyboard Generator
            </h2>
            {onBackToPrompts && (
              <button
                onClick={onBackToPrompts}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                ← Back to Prompts
              </button>
            )}
          </div>
          <p className="text-gray-400 text-sm">
            Transform your ideas into visual narratives
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6 space-y-4"
        >
          <div className="relative">
            <textarea
              className="w-full h-24 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              placeholder="Describe your story... (e.g., 'A superhero discovers their powers and saves the city')"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
            <Wand2 className="absolute top-4 right-4 w-5 h-5 text-gray-500" />
            {initialPrompt && intent === initialPrompt && (
              <div className="absolute top-2 left-2 bg-blue-600/20 border border-blue-500/50 rounded px-2 py-1">
                <span className="text-xs text-blue-400">From Prompt Generator</span>
              </div>
            )}
          </div>

          {/* Number of Frames Selector */}
          <div className="flex items-center gap-4 px-4 py-3 bg-gray-800/30 border border-gray-700 rounded-lg">
            <label className="text-gray-300 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Number of Frames:
            </label>
            <select
              value={resultsCount}
              onChange={(e) => setResultsCount(Number(e.target.value))}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value={3}>3 frames (Quick)</option>
              <option value={5}>5 frames (Balanced)</option>
              <option value={7}>7 frames (Detailed)</option>
              <option value={10}>10 frames (Extended)</option>
            </select>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-4 px-4 py-3 bg-gray-800/30 border border-gray-700 rounded-lg">
            <label className="text-gray-300 font-medium flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-purple-400" />
              Aspect Ratio:
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="4:3">4:3 (Classic)</option>
              <option value="21:9">21:9 (Ultrawide)</option>
            </select>
          </div>

          {/* Image Model Selector */}
          <div className="flex items-center gap-4 px-4 py-3 bg-gray-800/30 border border-gray-700 rounded-lg">
            <label className="text-gray-300 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Image Model:
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value as ImageModel)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="auto">Auto (Smart Selection)</option>
              <option value="imagen3">Imagen 3 (General Scenes)</option>
              <option value="nano-banana">Nano Banana (Characters)</option>
            </select>
          </div>
          <div className="px-4 py-2 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-xs text-blue-300">
              <strong>Auto mode:</strong> Uses Imagen 3 for most frames and Nano Banana for character-focused sequences automatically.
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={fetchStoryboardPlan}
              disabled={loading || !intent}
            >
              {loading && !plan ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Generate Plan
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={generateStoryboard}
              disabled={loading || !plan}
            >
              {loading && plan ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Images
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan Display - Compact Card with Lightbox */}
        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              {/* Compact Plan Card */}
              <motion.div
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setIsLightboxOpen(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Eye className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          Storyboard Plan Generated
                        </h3>
                        <p className="text-sm text-gray-400">
                          {plan.frames.length} scenes • Click to view full plan
                        </p>
                      </div>
                    </div>
                    <Maximize2 className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </motion.div>

              {/* Lightbox Modal */}
              <AnimatePresence>
                {isLightboxOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setIsLightboxOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                      }}
                      className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Eye className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              Storyboard Plan
                            </h2>
                            <p className="text-sm text-gray-400">
                              {plan.frames.length} scene
                              {plan.frames.length !== 1 ? "s" : ""} ready to
                              generate
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsLightboxOpen(false)}
                          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          <X className="w-6 h-6 text-gray-400 hover:text-white" />
                        </button>
                      </div>

                      {/* Modal Content - Editable Descriptions */}
                      <div
                        className="p-6 overflow-y-auto custom-scrollbar"
                        style={{ maxHeight: "calc(90vh - 200px)" }}
                      >
                        <div className="mb-4 px-2">
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <Edit className="w-4 h-4 text-purple-400" />
                            Edit frame descriptions below before generating images
                          </p>
                        </div>
                        <div className="space-y-4">
                          {plan.frames.map((frame, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 focus-within:border-purple-500 transition-all group"
                            >
                              <div className="flex-shrink-0 pt-1">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg group-hover:scale-110 transition-transform">
                                  {idx + 1}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                                  Scene {idx + 1}
                                </h4>
                                <textarea
                                  value={frame.description}
                                  onChange={(e) => {
                                    const updatedFrames = [...plan.frames];
                                    updatedFrames[idx] = { description: e.target.value };
                                    setPlan({ ...plan, frames: updatedFrames });
                                  }}
                                  className="w-full min-h-[80px] p-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
                                  placeholder="Enter frame description..."
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3">
                        <button
                          onClick={() => setIsLightboxOpen(false)}
                          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            setIsLightboxOpen(false);
                            // Trigger generate storyboard
                            setTimeout(() => generateStoryboard(), 100);
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-green-500/50 transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Generate Images
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {/* End Right Column */}

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {isImageLightboxOpen && storyboard && storyboard.frames.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
            onClick={closeImageLightbox}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 z-[10001] text-white/80 hover:text-white transition-colors"
              onClick={closeImageLightbox}
              aria-label="Close lightbox"
            >
              <X className="w-10 h-10" />
            </button>

            {/* Previous Button */}
            {storyboard.frames.length > 1 && (
              <button
                className="absolute left-6 z-[10001] bg-white/20 hover:bg-white/30 text-white p-4 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousImage();
                }}
                aria-label="Previous image"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  &#8249;
                </motion.div>
              </button>
            )}

            {/* Image Container */}
            <div
              className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={lightboxImageIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={storyboard.frames[lightboxImageIndex]?.image_url || ''}
                alt={`Scene ${lightboxImageIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-white max-w-2xl"
              >
                <h3 className="text-3xl font-bold mb-3">
                  {storyboard.frames[lightboxImageIndex]?.title || `Scene ${lightboxImageIndex + 1}`}
                </h3>
                <p className="text-gray-300 text-lg mb-2">
                  {storyboard.frames[lightboxImageIndex]?.description}
                </p>
                <p className="text-gray-500 text-sm">
                  {lightboxImageIndex + 1} / {storyboard.frames.length}
                </p>
              </motion.div>
            </div>

            {/* Next Button */}
            {storyboard.frames.length > 1 && (
              <button
                className="absolute right-6 z-[10001] bg-white/20 hover:bg-white/30 text-white p-4 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextImage();
                }}
                aria-label="Next image"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  &#8250;
                </motion.div>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StoryboardPanel;
