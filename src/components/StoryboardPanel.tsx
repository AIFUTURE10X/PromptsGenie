import React from "react";

// Type definitions for storyboard and plan
interface StoryboardFrame {
  id: string;
  image_url: string;
  title: string;
  description: string;
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
      hash = ((hash << 5) - hash) + intent.charCodeAt(i);
      hash |= 0;
    }
    return 'sb_' + Math.abs(hash);
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
      const response = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyboardId: plan?.storyboardId, plan }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data: Storyboard = await response.json();
      setStoryboard(data);
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
    <>
      <div className="panel-standard-height p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">Storyboard</h2>
        <div className="mb-2">
          <textarea
            className="border rounded px-2 py-1 mr-2 bg-gray-900 text-white placeholder-gray-400 w-full h-20 resize-y"
            placeholder="Storyboard intent (e.g. 'A hero's journey')"
            value={intent}
            onChange={e => setIntent(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded mr-2"
            onClick={fetchStoryboardPlan}
            disabled={loading || !intent}
          >Plan</button>
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={generateStoryboard}
            disabled={loading || !plan}
          >Generate</button>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {plan && (
          <div className="mb-2 text-gray-700 dark:text-gray-300">
            <strong>Storyboard Plan:</strong>
            <ul className="list-disc ml-6">
              {plan.frames.map((frame, idx) => (
                <li key={idx}>{frame.description}</li>
              ))}
            </ul>
          </div>
        )}
        {storyboard && (
          <div className="storyboard-panel">
            <h2>Storyboard</h2>
            {/* Controls for results, aspect ratio, generation mode */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ color: '#fff' }}>
                Results:
                <input type="number" min={1} max={20} value={resultsCount} onChange={e => setResultsCount(Number(e.target.value))} style={{ width: '60px', marginLeft: '8px', background: '#222', color: '#fff', borderRadius: '4px', border: '1px solid #444' }} />
              </label>
              <label style={{ color: '#fff' }}>
                Aspect Ratio:
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={{ marginLeft: '8px', background: '#222', color: '#fff', borderRadius: '4px', border: '1px solid #444' }}>
                  <option value="16:9">16:9</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1</option>
                </select>
              </label>
              <label style={{ color: '#fff' }}>
                Mode:
                <select value={generationMode} onChange={e => setGenerationMode(e.target.value)} style={{ marginLeft: '8px', background: '#222', color: '#fff', borderRadius: '4px', border: '1px solid #444' }}>
                  <option value="auto">Auto</option>
                  <option value="manual">Manual</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '16px' }}>
              {/* Sidebar Navigation */}
              <div style={{ width: '120px', minWidth: '120px', background: '#222', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '1em' }}>Scenes</h4>
                {storyboard.frames.length > 0 ? (
                  storyboard.frames.map((frame, idx) => (
                    <button
                      key={idx}
                      style={{
                        background: idx === selectedFrame ? '#3af' : '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        fontWeight: idx === selectedFrame ? 'bold' : 'normal',
                      }}
                      onClick={() => setSelectedFrame(idx)}
                    >
                      Scene {idx + 1}
                    </button>
                  ))
                ) : (
                  <span style={{ color: '#aaa', fontSize: '0.9em' }}>No scenes yet</span>
                )}
              </div>
              {/* Main Frame Viewer */}
              <div style={{ flex: 1, minHeight: '220px', background: '#222', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Horizontal Thumbnail Viewer */}
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto', marginBottom: '12px' }}>
                  {storyboard.frames.map((frame, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${selectedFrame === idx ? "selected" : ""}`}
                      onClick={() => setSelectedFrame(idx)}
                    >
                      <img
                        src={frame.image_url}
                        alt={`Thumbnail ${idx + 1}`}
                        style={{ width: "80px", height: "45px", objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
                {/* Main Frame Viewer (optional for future stages) */}
                {storyboard.frames.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
                      <img
                        src={storyboard.frames[selectedFrame]?.image_url || ''}
                        alt={`Scene ${selectedFrame + 1}`}
                        style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '8px', background: '#111' }}
                      />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: '#fff', marginBottom: '6px' }}>{storyboard.frames[selectedFrame]?.title || `Scene ${selectedFrame + 1}`}</h3>
                        <p style={{ color: '#ccc', fontSize: '1em' }}>{storyboard.frames[selectedFrame]?.description}</p>
                        {/* Image Upload */}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          id={`upload-image-${selectedFrame}`}
                          onChange={e => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              // TODO: Implement upload logic here
                              alert(`Selected image for frame ${selectedFrame + 1}: ${file.name}`);
                            }
                          }}
                        />
                        <label htmlFor={`upload-image-${selectedFrame}`} style={{ background: '#3af', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', marginTop: '8px', display: 'inline-block' }}>
                          Upload Image
                        </label>
                      </div>
                    </div>
                    {/* Frame Actions */}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button style={{ background: '#444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>Edit</button>
                      <button style={{ background: '#444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>Delete</button>
                      <button style={{ background: '#444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>Reorder</button>
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#aaa', fontSize: '1em' }}>No storyboard generated yet.</span>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Controls for generation, intent, etc. */}
      </div>
    </>
  );
}

export default StoryboardPanel;