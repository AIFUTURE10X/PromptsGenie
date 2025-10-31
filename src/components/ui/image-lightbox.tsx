import { useEffect, memo } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageLightboxComponent = ({ src, alt = 'Image', isOpen, onClose }: ImageLightboxProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={onClose}
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Image container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-[90vw] max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              loading="eager"
              decoding="async"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </motion.div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm">
            Press <kbd className="px-2 py-1 bg-white/20 rounded">Esc</kbd> or click outside to close
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const ImageLightbox = memo(ImageLightboxComponent);
