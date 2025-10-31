import { useState } from 'react';
import { User, MapPin, Palette } from 'lucide-react';
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
      {/* Three Upload Cards */}
      <div className="space-y-3">
        {cardSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card key={section.id} className="bg-[#F77000] border-2 border-dashed border-black">
              <CardContent className="p-4">
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-black/10">
                    <Icon className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-black">
                    {section.title}
                  </h3>
                </div>

                {/* Card Content */}
                <ImageUpload
                  onImageSelect={section.onUpload}
                  selectedImage={section.image}
                  onClear={section.onClear}
                  label={section.label}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
