import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';

interface ImageCardProps {
  imageData?: string;
  mimeType?: string;
  aspectRatio: string;
  isGenerating: boolean;
  index: number;
  prompt?: string;
  onDelete?: () => void;
}

export function ImageCard({ imageData, mimeType, aspectRatio, isGenerating, index, prompt, onDelete }: ImageCardProps) {
  const [copied, setCopied] = useState(false);
  const lightboxRef = useRef<any>(null);

  // Map aspect ratio strings to Tailwind aspect ratio classes (only Imagen-supported ratios)
  const getAspectRatioClass = (ratio: string) => {
    const aspectMap: Record<string, string> = {
      '1:1': 'aspect-square',
      '16:9': 'aspect-video',
      '9:16': 'aspect-[9/16]',
      '4:3': 'aspect-[4/3]',
      '3:4': 'aspect-[3/4]',
    };
    return aspectMap[ratio] || 'aspect-square';
  };

  const handleDownload = () => {
    if (!imageData) return;

    const link = document.createElement('a');
    link.href = `data:${mimeType || 'image/png'};base64,${imageData}`;
    link.download = `generated-image-${index + 1}-${aspectRatio.replace(':', 'x')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadWithPrompt = async () => {
    if (!imageData || !prompt) return;

    try {
      // Create an image element
      const img = new Image();
      img.src = `data:${mimeType || 'image/png'};base64,${imageData}`;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Create canvas with extra height for prompt
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const maxPromptHeight = 200;
      const padding = 20;
      const lineHeight = 20;

      canvas.width = img.width;
      canvas.height = img.height + maxPromptHeight;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Draw prompt background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, img.height, canvas.width, maxPromptHeight);

      // Draw prompt text
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial, sans-serif';

      // Word wrap the prompt
      const words = prompt.split(' ');
      let line = '';
      let y = img.height + padding + lineHeight;
      const maxWidth = canvas.width - (padding * 2);

      words.forEach((word) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, padding, y);
          line = word + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, padding, y);

      // Download the canvas
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-image-${index + 1}-${aspectRatio.replace(':', 'x')}-with-prompt.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Failed to download image with prompt:', error);
    }
  };

  const handleCopy = async () => {
    if (!imageData) return;

    try {
      const response = await fetch(`data:${mimeType || 'image/png'};base64,${imageData}`);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // Initialize GLightbox when image data is available
  useEffect(() => {
    if (imageData && !isGenerating) {
      // Clean up previous instance if it exists
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
      }

      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Initialize new GLightbox instance with correct selector
        lightboxRef.current = GLightbox({
          selector: '.glightbox-image',
          touchNavigation: true,
          loop: false,
          autoplayVideos: false,
          zoomable: true,
          draggable: true,
          closeButton: true,
          closeOnOutsideClick: true,
          svg: {
            close: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
          },
        });
      }, 50);

      return () => clearTimeout(timer);
    }

    // Cleanup on unmount
    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
        lightboxRef.current = null;
      }
    };
  }, [imageData, isGenerating]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative bg-black/20 rounded-lg overflow-hidden border-2 border-black/30 aspect-square flex items-center justify-center w-full"
    >
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
          <p className="text-sm text-white">Generating...</p>
        </div>
      ) : imageData ? (
        <>
          {/* Wrap image in anchor tag for GLightbox */}
          <a
            href={`data:${mimeType || 'image/png'};base64,${imageData}`}
            className="glightbox-image w-full h-full flex items-center justify-center p-2"
            data-type="image"
            data-title={`Generated Image ${index + 1}`}
            data-description={prompt ? `<div style="max-height: 200px; overflow-y: auto; padding: 10px; background: rgba(0,0,0,0.7); border-radius: 8px;"><strong>Aspect Ratio:</strong> ${aspectRatio}<br/><br/><strong>Prompt:</strong><br/>${prompt.replace(/\n/g, '<br/>')}</div>` : `${aspectRatio} aspect ratio`}
            data-gallery="generated-images"
          >
            <img
              src={`data:${mimeType || 'image/png'};base64,${imageData}`}
              alt={`Generated image ${index + 1}`}
              className="max-w-full max-h-full object-contain cursor-pointer"
              loading="lazy"
              style={{ aspectRatio: aspectRatio.replace(':', '/') }}
            />
          </a>

          {/* Hover overlay with buttons */}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
            <div className="pointer-events-auto flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white text-xs"
                  title="Download image only"
                >
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                  <span className="hidden sm:inline">Image</span>
                </Button>
                {prompt && (
                  <Button
                    onClick={handleDownloadWithPrompt}
                    size="sm"
                    variant="secondary"
                    className="bg-blue-500/90 hover:bg-blue-500 text-white text-xs"
                    title="Download image with prompt"
                  >
                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                    <span className="hidden sm:inline">+ Prompt</span>
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  size="icon"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </Button>
                <Button
                  onClick={handleDelete}
                  size="icon"
                  variant="destructive"
                  className="bg-red-600/90 hover:bg-red-600"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Aspect ratio badge */}
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded pointer-events-none">
            {aspectRatio}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-white/50">
          <div className="w-16 h-16 rounded-lg bg-black/20 flex items-center justify-center">
            <span className="text-2xl">🖼️</span>
          </div>
          <p className="text-sm">Empty slot {index + 1}</p>
        </div>
      )}
    </motion.div>
  );
}
