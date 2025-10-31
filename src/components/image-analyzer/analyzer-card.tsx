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
    } else if (!imageData) {
      reset();
    }
  }, [imageData, speedMode, type, autoAnalyze, mutate, reset]);

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
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-black/20">
              {icon || <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-black mt-0.5">{description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pt-2">
          <div className="h-full flex items-center justify-center">
            {!imageData ? (
              <div className="text-center text-black">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Upload an image to analyze</p>
              </div>
            ) : isPending ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-white" />
                <p className="text-sm text-black">Analyzing...</p>
              </div>
            ) : isError ? (
              <div className="text-center w-full">
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-3">
                  <p className="text-sm text-destructive font-medium mb-1">Analysis Failed</p>
                  <p className="text-xs text-destructive/80">
                    {error?.message || 'Unknown error occurred'}
                  </p>
                </div>
                {!autoAnalyze && (
                  <Button onClick={handleManualAnalyze} variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Retry Analysis
                  </Button>
                )}
              </div>
            ) : data?.success && data.prompt ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <div className="relative p-2.5 rounded-lg bg-black/20 border border-black/30">
                  <p className="text-sm leading-relaxed text-foreground/90 pr-7">
                    {data.prompt}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7"
                    onClick={handleCopy}
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                {speedMode === 'Quality' && (
                  <p className="text-xs text-black mt-2 text-center">
                    Quality analysis complete
                  </p>
                )}
                {!autoAnalyze && (
                  <div className="mt-3 text-center">
                    <Button onClick={handleManualAnalyze} variant="outline" size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Re-analyze
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : !autoAnalyze && imageData ? (
              <div className="text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-black/70" />
                <p className="text-sm text-black mb-3">Ready to analyze</p>
                <Button onClick={handleManualAnalyze} variant="default" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Now
                </Button>
              </div>
            ) : (
              <div className="text-center text-black">
                <p className="text-sm">No result available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
