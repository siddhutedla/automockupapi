'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  currentImage?: string;
  className?: string;
}

export default function ImageUpload({ 
  onImageUpload, 
  onImageRemove, 
  currentImage,
  className = '' 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);

    try {
      onImageUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  // Prevent hydration issues by not rendering until mounted
  if (!isMounted) {
    return (
      <div className={`w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <ImageIcon className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt="Uploaded logo"
            className="w-full h-48 object-contain border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
          />
          <button
            onClick={onImageRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              {isDragActive ? (
                <Upload className="h-8 w-8 text-blue-500" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              )}
              <p className="text-sm text-gray-600">
                {isDragActive 
                  ? 'Drop your logo here' 
                  : 'Drag & drop your logo here, or click to select'
                }
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 