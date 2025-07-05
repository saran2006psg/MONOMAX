import React, { useState, useCallback } from 'react';
import { Upload, FileCode, Loader2, Check } from 'lucide-react';
import axios from 'axios';
import { ProjectData } from '../types';

interface UploadPageProps {
  onUploadComplete: (projectData: ProjectData) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onUploadComplete }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find(file => file.name.endsWith('.zip'));
    
    if (zipFile) {
      handleUpload(zipFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  }, []);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('zipFile', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        },
      });

      setUploadStatus('processing');
      setUploadProgress(100);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadStatus('complete');
      onUploadComplete(response.data);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing codebase...';
      case 'complete':
        return 'Upload complete!';
      case 'error':
        return errorMessage;
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'complete':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <Upload className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <FileCode className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Codebase Navigator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Upload your zipped monorepo to explore its structure and analyze your code
          </p>
        </div>

        <div className="glass rounded-2xl p-8 card-shadow animate-slide-in">
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!isUploading ? (
              <>
                <div className="mb-6">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce-gentle" />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Drop your zip file here
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Or click to browse and select a file
                  </p>
                </div>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                    <Upload className="w-5 h-5 mr-2" />
                    Select Zip File
                  </span>
                </label>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3">
                  {getStatusIcon()}
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {getStatusMessage()}
                  </span>
                </div>
                
                {uploadStatus === 'uploading' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                
                {uploadStatus === 'processing' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supported formats: .zip files containing JavaScript/TypeScript projects
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};