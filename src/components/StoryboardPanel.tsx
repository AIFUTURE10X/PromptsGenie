import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Wand2, Eye, Download, Sparkles } from "lucide-react";

// Type definitions for storyboard and plan
interface StoryboardFrame {
  id: string;
  image_url: string;
  title: string;
  description: string;
  status?: string;
}

interface Storyboard {
  frames: StoryboardFrame[];
}

interface StoryboardPlan {
  storyboardId: string;
  frames: { description: string }[];
}

function StoryboardPanel() {
  const [intent, setIntent] = React.useState<string>("");
  const [plan, setPlan] = React.useState<StoryboardPlan | null>(null);
  const [storyboard, setStoryboard] = React.useState<Storyboard | null>(null);
  const [selectedFrame, setSelectedFrame] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultsCount, setResultsCount] = React.useState<number>(7);
  const [aspectRatio, setAspectRatio] = React.useState<string>("16:9");
  const [generationMode, setGenerationMode] = React.useState<string>("auto");
  const API_BASE = "/api/storyboards";

  function generateStoryboardId(intent: string) {
    // Simple deterministic hash for storyboardId
    let hash = 0;
    for (let i = 0; i < intent.length; i++) {
      hash = (hash << 5) - hash + intent.charCodeAt(i);
      hash |= 0;
    }
    return "sb_" + Math.abs(hash);
  }

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
        body: JSON.stringify({ storyboardId, intent }),
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

  // Generate storyboard
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

      // Now generate each frame individually to avoid 6MB response limit
      const frames = [...data.frames];
      for (let i = 0; i < frames.length; i++) {
        try {
          const frameResponse = await fetch(`${API_BASE}/generate-frame`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyboardId: data.storyboardId,
              frameIndex: i,
              description: frames[i].description,
            }),
          });

          if (frameResponse.ok) {
            const frameData = await frameResponse.json();
            frames[i] = frameData.frame;
            // Update storyboard with new frame
            setStoryboard({ ...data, frames: [...frames] });
          } else {
            console.error(`Failed to generate frame ${i + 1}`);
          }
        } catch (frameError) {
          console.error(`Error generating frame ${i + 1}:`, frameError);
        }
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

  return (
    <div className="panel-standard-height p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-400" />
          AI Storyboard Generator
        </h2>
        <p className="text-gray-400 mt-2">
          Transform your ideas into visual narratives
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
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

      {/* Plan Display */}
      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-6 bg-gray-800/50 border border-gray-700 rounded-lg"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Storyboard Plan
            </h3>
            <ul className="space-y-3">
              {plan.frames.map((frame, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-3 text-gray-300"
                >
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    {idx + 1}
                  </span>
                  <span className="flex-1 pt-1">{frame.description}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Storyboard Results */}
      <AnimatePresence>
        {storyboard && storyboard.frames && storyboard.frames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Generated Storyboard
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {storyboard.frames.map((frame, idx) => (
                <motion.div
                  key={frame?.id || `frame-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="group relative bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-purple-500/30 transition-all cursor-pointer"
                  onClick={() => setSelectedFrame(idx)}
                >
                  {/* Frame Number Badge */}
                  <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg">
                    {idx + 1}
                  </div>

                  {/* Image */}
                  <div className="aspect-video bg-gray-900 relative overflow-hidden">
                    {frame?.image_url ? (
                      <img
                        src={frame.image_url}
                        alt={frame?.title || `Frame ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="text-white">
                        <h4 className="font-bold text-sm">{frame?.title || `Scene ${idx + 1}`}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4">
                    <h4 className="font-semibold text-white mb-2">{frame?.title || `Scene ${idx + 1}`}</h4>
                    <p className="text-sm text-gray-400 line-clamp-2">{frame?.description || 'Generating...'}</p>
                  </div>

                  {/* Status indicator */}
                  {frame?.status === 'pending' && (
                    <div className="absolute top-2 right-2 z-10">
                      <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StoryboardPanel;
