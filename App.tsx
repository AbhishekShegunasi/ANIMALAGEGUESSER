
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { analyzeAnimalImage, fileToBase64 } from './services/geminiService';
import { AnimalAnalysisResult } from './types';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnimalAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setAnalysisResult(null); // Clear previous results
    setError(null); // Clear previous errors

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);
  
  const clearImagePreview = useCallback(() => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
    // The ImageUploader component will clear its input field via useEffect observing imagePreviewUrl
  }, []);


  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const base64ImageData = await fileToBase64(selectedFile);
      const result = await analyzeAnimalImage(base64ImageData, selectedFile.type);
      setAnalysisResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during analysis.");
      }
      console.error("Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  useEffect(() => {
    // Cleanup object URL if one was created (not directly used here now with FileReader for preview, but good practice if it were)
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-8">
      {isLoading && <LoadingSpinner />}
      
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            AI Animal Identifier
          </span>
        </h1>
        <p className="mt-3 text-lg text-slate-400 max-w-xl mx-auto">
          Upload an image of an animal, and our AI will try to identify its name, kingdom, and guess its age.
        </p>
      </header>

      <ImageUploader 
        onImageSelect={handleImageSelect} 
        clearPreview={clearImagePreview}
        currentImagePreviewUrl={imagePreviewUrl}
      />

      {imagePreviewUrl && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !selectedFile}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L18 14.25l-.25-2.25a3.375 3.375 0 00-2.455-2.455L13 9.25l2.25-.25a3.375 3.375 0 002.455-2.455L18 4.25l.25 2.25a3.375 3.375 0 002.455 2.455L22.75 9.5l-2.25.25a3.375 3.375 0 00-2.455 2.455zM12 12a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 0112 5.25v1.506A.75.75 0 0112.75 7.5v3.75a.75.75 0 01-.75.75z" />
                </svg>
                <span>Analyze Animal</span>
              </>
            )}
          </button>
        </div>
      )}
      
      <ResultDisplay result={analysisResult} error={error} isLoading={isLoading} />

      <footer className="text-center mt-12 py-4 border-t border-slate-700">
        <p className="text-sm text-slate-500">
          Powered by Gemini API. For entertainment and educational purposes only.
        </p>
      </footer>
    </div>
  );
};

export default App;
