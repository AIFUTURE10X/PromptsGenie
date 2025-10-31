import { useState } from 'react';
import { Upload, User, MapPin, Palette, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from '../image-analyzer/image-upload';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export interface UploadedFile {
  imageData: string;
  file: File;
}

export interface CollapsibleUploadCardsProps {
  onSubjectUpload?: (data: UploadedFile | null) => void;
  onSceneUpload?: (data: UploadedFile | null) => void;
  onStyleUpload?: (data: UploadedFile | null) => void;
  className?: string;
}

export function CollapsibleUploadCards({
  onSubjectUpload,
  onSceneUpload,
  onStyleUpload,
  className,
}: CollapsibleUploadCardsProps) {
  // Master collapse state - controls all three cards
  const [isExpanded, setIsExpanded] = useState(true);

  // Individual upload states
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneFile, setSceneFile] = useState<File | null>(null);
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [styleFile, setStyleFile] = useState<File | null>(null);

  // Upload handlers
  const handleSubjectUpload = (imageData: string, file: File) => {
    setSubjectImage(imageData);
    setSubjectFile(file);
    onSubjectUpload?.({ imageData, file });
  };

  const handleSubjectClear = () => {
    setSubjectImage(null);
    setSubjectFile(null);
    onSubjectUpload?.(null);
  };

  const handleSceneUpload = (imageData: string, file: File) => {
    setSceneImage(imageData);
    setSceneFile(file);
    onSceneUpload?.({ imageData, file });
  };

  const handleSceneClear = () => {
    setSceneImage(null);
    setSceneFile(null);
    onSceneUpload?.(null);
  };

  const handleStyleUpload = (imageData: string, file: File) => {
    setStyleImage(imageData);
    setStyleFile(file);
    onStyleUpload?.({ imageData, file });
  };

  const handleStyleClear = () => {
    setStyleImage(null);
    setStyleFile(null);
    onStyleUpload?.(null);
  };

  const cardSections = [
    {
      id: 'subject',
      title: 'SUBJECT',
      icon: User,
      image: subjectImage,
      onUpload: handleSubjectUpload,
      onClear: handleSubjectClear,
      label: 'Upload Subject',
    },
    {
      id: 'scene',
      title: 'SCENE',
      icon: MapPin,
      image: sceneImage,
      onUpload: handleSceneUpload,
      onClear: handleSceneClear,
      label: 'Upload Scene',
    },
    {
      id: 'style',
      title: 'STYLE',
      icon: Palette,
      image: styleImage,
      onUpload: handleStyleUpload,
      onClear: handleStyleClear,
      label: 'Upload Style',
    },
  ];

  return (
    <div className={cn('w-full', className)}>
      {/* Master Collapse Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Upload Images</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={isExpanded ? 'Collapse all cards' : 'Expand all cards'}
          aria-expanded={isExpanded}
        >
          <span className="text-sm font-medium">
            {isExpanded ? 'Collapse All' : 'Expand All'}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </motion.div>
        </button>
      </div>

      {/* Three Upload Cards - Synchronized Collapse */}
      <div className="space-y-3">
        {cardSections.map((section) => {
          const Icon = section.icon;

          return (
            <motion.div
              key={section.id}
              initial={false}
              animate={{
                height: isExpanded ? 'auto' : '60px',
                scaleX: isExpanded ? 1 : 0.98,
              }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              style={{ originX: 1 }} // Right side origin for right-to-left effect
              className="overflow-hidden"
            >
              <Card className="bg-[#F77000] border-2 border-dashed border-black">
                <CardContent className="p-4">
                  {/* Card Header - Always Visible */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full p-2 bg-black/10">
                        <Icon className="w-5 h-5 text-black" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-black">
                        {section.title}
                      </h3>
                    </div>

                    {/* Plus button - only visible when collapsed */}
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: isExpanded ? 0 : 1,
                        scale: isExpanded ? 0.8 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'rounded-full p-1.5 bg-black/10 hover:bg-black/20 transition-colors cursor-pointer',
                        isExpanded && 'pointer-events-none'
                      )}
                      onClick={() => !isExpanded && setIsExpanded(true)}
                      role="button"
                      tabIndex={isExpanded ? -1 : 0}
                      aria-label={`Add ${section.title.toLowerCase()}`}
                    >
                      <Plus className="w-4 h-4 text-black" />
                    </motion.div>
                  </div>

                  {/* Card Content - Only Visible When Expanded */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="mt-4"
                      >
                        <ImageUpload
                          onImageSelect={section.onUpload}
                          selectedImage={section.image}
                          onClear={section.onClear}
                          label={section.label}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
