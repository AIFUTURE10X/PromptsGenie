import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X } from 'lucide-react';
import { Button } from '../ui/button';

interface EnhancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseCombined: () => void;
  onEnhanceFirst: () => void;
}

export function EnhancementModal({ isOpen, onClose, onUseCombined, onEnhanceFirst }: EnhancementModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleUseCombined = () => {
    if (dontAskAgain) {
      localStorage.setItem('promptEnhancementPreference', 'combined');
    }
    onUseCombined();
    onClose();
  };

  const handleEnhanceFirst = () => {
    if (dontAskAgain) {
      localStorage.setItem('promptEnhancementPreference', 'enhanced');
    }
    onEnhanceFirst();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F77000]/10 flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-[#F77000]" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center mb-2">Enhance your prompt?</h2>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-6">
                Gemini Flash 2.5 can enhance your combined prompt with better structure, quality modifiers, and scene preservation for improved image results.
              </p>

              {/* Don't ask again checkbox */}
              <label className="flex items-center gap-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontAskAgain}
                  onChange={(e) => setDontAskAgain(e.target.checked)}
                  className="w-4 h-4 text-[#F77000] border-gray-300 rounded focus:ring-[#F77000]"
                />
                <span className="text-sm text-gray-700">Don't ask again (remember my choice)</span>
              </label>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleUseCombined}
                  variant="secondary"
                  className="flex-1"
                >
                  Use Combined Prompt
                </Button>
                <Button
                  onClick={handleEnhanceFirst}
                  className="flex-1 bg-[#F77000] hover:bg-[#F77000]/90"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Enhance First
                </Button>
              </div>

              {/* Reset preference link */}
              {localStorage.getItem('promptEnhancementPreference') && (
                <button
                  onClick={() => {
                    localStorage.removeItem('promptEnhancementPreference');
                    onClose();
                  }}
                  className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline w-full text-center"
                >
                  Reset saved preference
                </button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
