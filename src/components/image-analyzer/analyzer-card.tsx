import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useImageAnalysis } from '../../hooks/use-image-analysis';
import type { AnalyzerType, SpeedMode } from '../../lib/schemas';

interface AnalyzerCardProps {
  type: AnalyzerType;
  title: string;
  description: string;
  imageData: string | null;
  speedMode: SpeedMode;
  autoAnalyze: boolean;
  icon?: React.ReactNode;
  onPromptChange?: (prompt: string | null) => void;
}

export function AnalyzerCard({
  type,
  title,
  description,
  imageData,
  speedMode,
  autoAnalyze,
  icon,
  onPromptChange,
}: AnalyzerCardProps) {
  const [copied, setCopied] = useState(false);
  const { mutate, data, isPending, isError, error, reset } = useImageAnalysis({
    analyzerType: type,
    speedMode,
  });

  // Auto-analyze when image or speed mode changes (only if autoAnalyze is true)
  useEffect(() => {
    if (imageData && autoAnalyze) {
      console.log(`🔄 Auto-analyzing ${type} with ${speedMode} mode...`);
      mutate(imageData);
    }
    // Don't reset when imageData is removed - keep the analyzed prompt visible
  }, [imageData, speedMode, type, autoAnalyze, mutate]);

  // Notify parent when prompt changes
  useEffect(() => {
    if (onPromptChange) {
      onPromptChange(data?.success && data.prompt ? data.prompt : null);
    }
  }, [data, onPromptChange]);

  const handleCopy = async () => {
    if (data?.prompt) {
      await navigator.clipboard.writeText(data.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualAnalyze = () => {
    if (imageData) {
      console.log(`🖱️ Manual analyze triggered for ${type} with ${speedMode} mode...`);
      mutate(imageData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col bg-[#F77000] backdrop-blur-sm border-[#F77000]">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-black/20 flex-shrink-0">
              {icon || <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base truncate">{title}</CardTitle>
              <p className="text-xs text-black mt-0.5 line-clamp-2">{description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pt-2 px-3 sm:px-6">
          <div className="h-full flex items-center justify-center">
            {!imageData && (!data?.success || !data?.prompt) ? (
              <div className="text-center text-black">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Upload an image to analyze</p>
              </div>
            ) : isPending ? (
              <div className="text-center">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 animate-spin text-white" />
                <p className="text-xs sm:text-sm text-black">Analyzing...</p>
              </div>
            ) : isError ? (
              <div className="text-center w-full">
                <div className="p-2.5 sm:p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-3">
                  <p className="text-xs sm:text-sm text-destructive font-medium mb-1">Analysis Failed</p>
                  <p className="text-xs text-destructive/80 break-words">
                    {error?.message || 'Unknown error occurred'}
                  </p>
                </div>
                {!autoAnalyze && (
                  <Button
                    onClick={handleManualAnalyze}
                    variant="outline"
                    size="sm"
                    aria-label={`Retry ${type} analysis`}
                    className="text-xs sm:text-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                    Retry
                  </Button>
                )}
              </div>
            ) : data?.success && data.prompt ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <div className="relative p-2 sm:p-2.5 rounded-lg bg-black/20 border border-black/30">
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 pr-7 break-words">
                    {data.prompt}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
                    onClick={handleCopy}
                    aria-label={`Copy ${type} analysis to clipboard`}
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    )}
                  </Button>
                </div>
                {speedMode === 'Quality' && (
                  <p className="text-xs text-black mt-2 text-center">
                    Quality analysis complete
                  </p>
                )}
                {!autoAnalyze && imageData && (
                  <div className="mt-3 text-center">
                    <Button
                      onClick={handleManualAnalyze}
                      variant="outline"
                      size="sm"
                      aria-label={`Re-analyze ${type}`}
                      className="text-xs sm:text-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                      Re-analyze
                    </Button>
                  </div>
                )}
                {!imageData && data?.success && data?.prompt && (
                  <p className="text-xs text-black/60 mt-2 text-center italic">
                    Image removed - prompt preserved
                  </p>
                )}
              </motion.div>
            ) : !autoAnalyze && imageData ? (
              <div className="text-center">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-3 text-black/70" />
                <p className="text-xs sm:text-sm text-black mb-3">Ready to analyze</p>
                <Button
                  onClick={handleManualAnalyze}
                  variant="default"
                  size="lg"
                  aria-label={`Analyze ${type} now`}
                  className="text-xs sm:text-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                  Analyze Now
                </Button>
              </div>
            ) : (
              <div className="text-center text-black">
                <p className="text-xs sm:text-sm">No result available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
