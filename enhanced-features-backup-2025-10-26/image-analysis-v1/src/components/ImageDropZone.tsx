import React, { useRef, useState } from 'react';

interface ImageDropZoneProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  onClearGeneral?: () => void;
  autoAnalyze: boolean;
  onAutoAnalyzeChange: (enabled: boolean) => void;
  subjectImages: File[];
  onSubjectImagesChange: (images: File[]) => void;
  onRunSubjectAnalysis: () => void;
  isAnalyzingSubject: boolean;
  subjectPreview?: string;
  autoAnalyzeSubject: boolean;
  onAutoAnalyzeSubjectChange: (enabled: boolean) => void;
  sceneImages: File[];
  onSceneImagesChange: (images: File[]) => void;
  onRunSceneAnalysis: () => void;
  isAnalyzingScene: boolean;
  scenePreview?: string;
  autoAnalyzeScene: boolean;
  onAutoAnalyzeSceneChange: (enabled: boolean) => void;
  styleImages: File[];
  onStyleImagesChange: (images: File[]) => void;
  onRunStyleAnalysis: () => void;
  isAnalyzingStyle: boolean;
  stylePreview?: string;
  autoAnalyzeStyle: boolean;
  onAutoAnalyzeStyleChange: (enabled: boolean) => void;
  onSimpleStyle: (style: string) => void;
  styleAnalysis?: string;
  isSimpleStyleActive?: boolean;
}

export default function ImageDropZone({
  images: _images,
  onImagesChange: _onImagesChange,
  onRunAnalysis: _onRunAnalysis,
  isAnalyzing: _isAnalyzing,
  onClearGeneral: _onClearGeneral,
  autoAnalyze: _autoAnalyze,
  onAutoAnalyzeChange: _onAutoAnalyzeChange,
  subjectImages,
  onSubjectImagesChange,
  onRunSubjectAnalysis,
  isAnalyzingSubject,
  subjectPreview,
  autoAnalyzeSubject,
  onAutoAnalyzeSubjectChange,
  sceneImages,
  onSceneImagesChange,
  onRunSceneAnalysis,
  isAnalyzingScene,
  scenePreview,
  autoAnalyzeScene,
  onAutoAnalyzeSceneChange,
  styleImages,
  onStyleImagesChange,
  onRunStyleAnalysis,
  isAnalyzingStyle,
  stylePreview,
  autoAnalyzeStyle,
  onAutoAnalyzeStyleChange,
  onSimpleStyle,
  styleAnalysis,
  isSimpleStyleActive,
}: ImageDropZoneProps) {
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const sceneInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const [isSubjectDragOver, setIsSubjectDragOver] = useState(false);
  const [isSceneDragOver, setIsSceneDragOver] = useState(false);
  const [isStyleDragOver, setIsStyleDragOver] = useState(false);

  // Extract brief style from current analysis
  const extractBriefStyle = (analysis: string): string => {
    if (!analysis) return 'style';
    
    // Common style keywords to look for
    const styleKeywords = [
      'anime', 'manga', 'cartoon', 'photorealistic', 'photo-real', 'realistic',
      'oil painting', 'watercolor', 'digital art', 'sketch', 'pencil',
      'impressionist', 'abstract', 'minimalist', 'vintage', 'retro',
      'cyberpunk', 'steampunk', 'gothic', 'baroque', 'renaissance',
      'art nouveau', 'pop art', 'surreal', 'fantasy', 'sci-fi'
    ];
    
    const lowerAnalysis = analysis.toLowerCase();
    
    // Find the first matching style keyword
    for (const keyword of styleKeywords) {
      if (lowerAnalysis.includes(keyword)) {
        return keyword;
      }
    }
    
    // If no specific style found, try to extract the first descriptive word
    const words = analysis.split(' ').filter(word => word.length > 3);
    if (words.length > 0) {
      return words[0].toLowerCase().replace(/[^a-z]/g, '');
    }
    
    return 'style';
  };

  const handleSimpleStyle = () => {
    if (!styleAnalysis) return;
    const briefStyle = extractBriefStyle(styleAnalysis);
    onSimpleStyle(`style: ${briefStyle}`);
  };

  const handleSubjectFiles = (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onSubjectImagesChange?.(imageFiles);
    }
  };

  const handleSceneFiles = (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onSceneImagesChange?.(imageFiles);
    }
  };

  const handleStyleFiles = (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onStyleImagesChange?.(imageFiles);
    }
  };

  // Subject Analysis handlers
  const handleSubjectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSubjectDragOver(false);
    handleSubjectFiles(e.dataTransfer.files);
  };

  const handleSubjectDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSubjectDragOver(true);
  };

  const handleSubjectDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSubjectDragOver(false);
  };

  // Scene Analysis handlers
  const handleSceneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSceneDragOver(false);
    handleSceneFiles(e.dataTransfer.files);
  };

  const handleSceneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSceneDragOver(true);
  };

  const handleSceneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSceneDragOver(false);
  };

  // Style Analysis handlers
  const handleStyleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsStyleDragOver(false);
    handleStyleFiles(e.dataTransfer.files);
  };

  const handleStyleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsStyleDragOver(true);
  };

  const handleStyleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsStyleDragOver(false);
  };

  return (
    <div className="bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border h-full flex flex-col p-2">
      {/* Three Cards Container */}
      <div className="grid grid-cols-1 gap-2 flex-1">
          
          {/* Subject Analysis Card */}
          <div className="group relative">
            {/* Neon Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            
            {/* Card Content */}
            <div className="relative bg-panel-secondary dark:bg-dark-panel-secondary border border-purple-500/30 rounded-xl p-2.5 h-44 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">Subject Analysis</h3>
              </div>

              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-2.5 text-center transition-all duration-300 cursor-pointer flex-1 flex flex-col justify-center overflow-hidden ${
                  isSubjectDragOver
                    ? 'border-purple-400 bg-purple-500/10'
                    : 'border-purple-500/40 hover:border-purple-400 hover:bg-purple-500/5'
                }`}
                onDrop={handleSubjectDrop}
                onDragOver={handleSubjectDragOver}
                onDragLeave={handleSubjectDragLeave}
                onClick={() => subjectInputRef.current?.click()}
              >
                {isAnalyzingSubject && subjectPreview ? (
                  <div className="flex items-center justify-between p-2 space-x-3">
                    <p className="text-xs text-purple-300 flex-shrink-0">
                      Analyzing {subjectImages.length} image{subjectImages.length !== 1 ? 's' : ''}...
                    </p>
                    <div className="relative flex justify-center flex-1">
                      <img 
                        src={subjectPreview} 
                        alt="Subject Preview" 
                        className="max-w-full max-h-12 object-contain rounded image-analysis-spin"
                      />
                    </div>
                  </div>
                ) : isAnalyzingSubject ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    <span className="text-xs text-purple-300">Analyzing…</span>
                  </div>
                ) : (
                  subjectPreview ? (
                    <div className="flex items-center justify-between p-2 space-x-3">
                      <p className="text-xs text-purple-300 flex-shrink-0">
                        {subjectImages.length} image{subjectImages.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="relative flex justify-center flex-1">
                        <img 
                          src={subjectPreview} 
                          alt="Subject Preview" 
                          className="max-w-full max-h-12 object-contain rounded"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubjectImagesChange([]);
                        }}
                        className="flex-shrink-0 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                        title="Delete subject images"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs text-purple-300 font-medium">Drop subject images here</p>
                    </div>
                  )
                )}
                
                <input
                  ref={subjectInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleSubjectFiles(e.target.files)}
                />
              </div>

              {/* Helper Text */}
              <p className="text-xs text-gray-400 text-center mt-1 mb-2">Focus on people, objects, characters</p>

              {/* Action Row */}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center space-x-1 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={autoAnalyzeSubject}
                    onChange={(e) => onAutoAnalyzeSubjectChange(e.target.checked)}
                    className="w-3 h-3 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-1"
                  />
                  <span>Auto-analyze</span>
                </label>
                
                <button
                  onClick={onRunSubjectAnalysis}
                  disabled={subjectImages.length === 0 || isAnalyzingSubject}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 ${
                    isAnalyzingSubject || subjectImages.length === 0
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-purple-500/25'
                  }`}
                >
                  {isAnalyzingSubject ? 'Analyzing...' : 'Analyze Subject'}
                </button>
              </div>
            </div>
          </div>

          {/* Scene Analysis Card */}
          <div className="group relative">
            {/* Neon Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-green-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            
            {/* Card Content */}
            <div className="relative bg-panel-secondary dark:bg-dark-panel-secondary border border-teal-500/30 rounded-xl p-2.5 h-44 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-teal-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">Scene Analysis</h3>
              </div>

              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-2.5 text-center transition-all duration-300 cursor-pointer flex-1 flex flex-col justify-center overflow-hidden ${
                  isSceneDragOver
                    ? 'border-teal-400 bg-teal-500/10'
                    : 'border-teal-500/40 hover:border-teal-400 hover:bg-teal-500/5'
                }`}
                onDrop={handleSceneDrop}
                onDragOver={handleSceneDragOver}
                onDragLeave={handleSceneDragLeave}
                onClick={() => sceneInputRef.current?.click()}
              >
                {isAnalyzingScene && scenePreview ? (
                  <div className="flex items-center justify-between p-2 space-x-3">
                    <p className="text-xs text-teal-300 flex-shrink-0">
                      Analyzing {sceneImages.length} image{sceneImages.length !== 1 ? 's' : ''}...
                    </p>
                    <div className="relative flex justify-center flex-1">
                      <img 
                        src={scenePreview} 
                        alt="Scene Preview" 
                        className="max-w-full max-h-12 object-contain rounded image-analysis-spin"
                      />
                    </div>
                  </div>
                ) : isAnalyzingScene ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                    <span className="text-xs text-teal-300">Analyzing…</span>
                  </div>
                ) : (
                  scenePreview ? (
                    <div className="flex items-center justify-between p-2 space-x-3">
                      <p className="text-xs text-teal-300 flex-shrink-0">
                        {sceneImages.length} image{sceneImages.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="relative flex justify-center flex-1">
                        <img 
                          src={scenePreview} 
                          alt="Scene Preview" 
                          className="max-w-full max-h-12 object-contain rounded"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSceneImagesChange([]);
                        }}
                        className="flex-shrink-0 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                        title="Delete scene images"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1">
                      <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs text-teal-300 font-medium">Drop scene images here</p>
                    </div>
                  )
                )}
                
                <input
                  ref={sceneInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleSceneFiles(e.target.files)}
                />
              </div>

              {/* Helper Text */}
              <p className="text-xs text-gray-400 text-center mt-1 mb-2">Focus on environments, backgrounds, settings</p>

              {/* Action Row */}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center space-x-1 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={autoAnalyzeScene}
                    onChange={(e) => onAutoAnalyzeSceneChange(e.target.checked)}
                    className="w-3 h-3 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500 focus:ring-1"
                  />
                  <span>Auto-analyze</span>
                </label>
                
                <button
                  onClick={onRunSceneAnalysis}
                  disabled={sceneImages.length === 0 || isAnalyzingScene}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 ${
                    isAnalyzingScene || sceneImages.length === 0
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg hover:shadow-teal-500/25'
                  }`}
                >
                  {isAnalyzingScene ? 'Analyzing...' : 'Analyze Scene'}
                </button>
              </div>
            </div>
          </div>

          {/* Style Analysis Card */}
          <div className="group relative">
            {/* Neon Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            
            {/* Card Content */}
            <div className="relative bg-panel-secondary dark:bg-dark-panel-secondary border border-orange-500/30 rounded-xl p-2.5 h-44 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-500/20 rounded-lg">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">Style Analysis</h3>
                </div>
                
                {/* Simple Style Button */}
                <button
                  onClick={handleSimpleStyle}
                  disabled={!styleAnalysis}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 flex items-center gap-1 ${
                    !styleAnalysis
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : isSimpleStyleActive
                      ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/25 ring-2 ring-green-400/50'
                      : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg hover:shadow-orange-500/25'
                  }`}
                  title={isSimpleStyleActive ? "Click to remove simple style" : "Generate simple style prompt from current analysis"}
                >
                  {isSimpleStyleActive ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {isSimpleStyleActive ? 'Remove' : 'Simple'}
                </button>
              </div>

              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-2.5 text-center transition-all duration-300 cursor-pointer flex-1 flex flex-col justify-center overflow-hidden ${
                  isStyleDragOver
                    ? 'border-orange-400 bg-orange-500/10'
                    : 'border-orange-500/40 hover:border-orange-400 hover:bg-orange-500/5'
                }`}
                onDrop={handleStyleDrop}
                onDragOver={handleStyleDragOver}
                onDragLeave={handleStyleDragLeave}
                onClick={() => styleInputRef.current?.click()}
              >
                {isAnalyzingStyle && stylePreview ? (
                  <div className="flex items-center justify-between p-2 space-x-3">
                    <p className="text-xs text-orange-300 flex-shrink-0">
                      Analyzing {styleImages.length} image{styleImages.length !== 1 ? 's' : ''}...
                    </p>
                    <div className="relative flex justify-center flex-1">
                      <img 
                        src={stylePreview} 
                        alt="Style Preview" 
                        className="max-w-full max-h-12 object-contain rounded image-analysis-spin"
                      />
                    </div>
                  </div>
                ) : isAnalyzingStyle ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="text-xs text-orange-300">Analyzing…</span>
                  </div>
                ) : (
                  stylePreview ? (
                    <div className="flex items-center justify-between p-2 space-x-3">
                      <p className="text-xs text-orange-300 flex-shrink-0">
                        {styleImages.length} image{styleImages.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="relative flex justify-center flex-1">
                        <img 
                          src={stylePreview} 
                          alt="Style Preview" 
                          className="max-w-full max-h-12 object-contain rounded"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStyleImagesChange([]);
                        }}
                        className="flex-shrink-0 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                        title="Delete style images"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1">
                      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs text-orange-300 font-medium">Drop style images here</p>
                    </div>
                  )
                )}
                
                <input
                  ref={styleInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleStyleFiles(e.target.files)}
                />
              </div>

              {/* Helper Text */}
              <p className="text-xs text-gray-400 text-center mt-1 mb-2">Focus on artistic styles, aesthetics, moods</p>

              {/* Action Row */}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center space-x-1 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={autoAnalyzeStyle}
                    onChange={(e) => onAutoAnalyzeStyleChange(e.target.checked)}
                    className="w-3 h-3 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-1"
                  />
                  <span>Auto-analyze</span>
                </label>
                
                <button
                  onClick={onRunStyleAnalysis}
                  disabled={styleImages.length === 0 || isAnalyzingStyle}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 ${
                    isAnalyzingStyle || styleImages.length === 0
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg hover:shadow-orange-500/25'
                  }`}
                >
                  {isAnalyzingStyle ? 'Analyzing...' : 'Analyze Style'}
                </button>
              </div>
            </div>
          </div>

        </div>
    </div>
  );
}