import React, { useState, useCallback } from 'react';
import { Upload, FileCode, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { ProjectData } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

interface UploadPageProps {
  onUploadComplete: (projectData: ProjectData) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onUploadComplete }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { theme } = useTheme();

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
    } else {
      setErrorMessage('Please upload a .zip file');
      setUploadStatus('error');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      if (files[0].name.endsWith('.zip')) {
        handleUpload(files[0]);
      } else {
        setErrorMessage('Please select a .zip file');
        setUploadStatus('error');
      }
    }
  }, []);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('codebase', file);

      const response = await axios.post('http://localhost:3001/api/upload', formData, {
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
        return `Uploading file... ${uploadProgress}%`;
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
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    } flex items-center justify-center p-4 relative overflow-hidden`}>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-4 -right-4 w-72 h-72 rounded-full opacity-20 ${
          theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
        } animate-pulse`}></div>
        <div className={`absolute -bottom-8 -left-8 w-96 h-96 rounded-full opacity-10 ${
          theme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'
        } animate-pulse`}></div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className={`relative p-6 rounded-full transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-blue-900/30 shadow-2xl shadow-blue-500/20' 
                : 'bg-blue-100 shadow-xl shadow-blue-500/20'
            }`}>
              <FileCode className={`w-16 h-16 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <Sparkles className={`absolute -top-2 -right-2 w-6 h-6 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'
              } animate-bounce`} />
            </div>
          </div>
          <h1 className={`text-5xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <span className={`bg-gradient-to-r ${
              theme === 'dark' 
                ? 'from-blue-400 to-purple-400' 
                : 'from-blue-600 to-purple-600'
            } bg-clip-text text-transparent`}>
              MONOMAX
            </span>
          </h1>
          <p className={`text-xl mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Codebase Navigator & Analyzer
          </p>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Upload your zipped monorepo to explore its structure and analyze your code
          </p>
        </div>

        <div className={`backdrop-blur-xl rounded-3xl p-8 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800/80 border border-gray-700/50 shadow-2xl shadow-gray-900/50' 
            : 'bg-white/80 border border-white/20 shadow-2xl shadow-blue-500/10'
        } animate-slide-in`}>
          <div
            className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
              isDragOver
                ? theme === 'dark'
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-blue-500 bg-blue-50'
                : theme === 'dark'
                  ? 'border-gray-600 hover:border-blue-500'
                  : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!isUploading ? (
              <>
                <div className="mb-8">
                  <div className="relative">
                    <Upload className={`w-20 h-20 mx-auto mb-6 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                    } animate-bounce-gentle`} />
                    {isDragOver && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-24 h-24 rounded-full border-4 border-dashed ${
                          theme === 'dark' ? 'border-blue-400' : 'border-blue-500'
                        } animate-ping`}></div>
                      </div>
                    )}
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {isDragOver ? 'Drop your zip file here!' : 'Upload your codebase'}
                  </h3>
                  <p className={`text-lg mb-6 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Drag & drop your .zip file or click to browse
                  </p>
                </div>
                
                <label className="cursor-pointer group">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className={`inline-flex items-center px-8 py-4 font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    theme === 'dark' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                  }`}>
                    <Upload className="w-5 h-5 mr-3" />
                    Select Zip File
                  </span>
                </label>
              </>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-center space-x-4">
                  {getStatusIcon()}
                  <span className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {getStatusMessage()}
                  </span>
                </div>
                
                {uploadStatus === 'uploading' && (
                  <div className="space-y-2">
                    <div className={`w-full rounded-full h-3 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className={`text-sm text-center ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {uploadProgress}% uploaded
                    </p>
                  </div>
                )}
                
                {uploadStatus === 'processing' && (
                  <div className="space-y-2">
                    <div className={`w-full rounded-full h-3 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full animate-pulse shadow-sm" style={{ width: '100%' }} />
                    </div>
                    <p className={`text-sm text-center ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Analyzing your codebase...
                    </p>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className={`p-4 rounded-xl ${
                    theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {errorMessage}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <div className={`flex flex-wrap justify-center gap-2 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className={`px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                JavaScript/TypeScript
              </span>
              <span className={`px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                React/Vue/Angular
              </span>
              <span className={`px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                Node.js
              </span>
              <span className={`px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                Python
              </span>
              <span className={`px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                And more...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};