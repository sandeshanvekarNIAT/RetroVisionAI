import { useState, useEffect } from 'react';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export function useImageClassifier() {
  const [classifier, setClassifier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeClassifier = async () => {
    if (classifier) return classifier;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading image classification model...');
      
      // Use a more reliable model that works well in browsers
      let model;
      try {
        model = await pipeline(
          'image-classification',
          'Xenova/vit-base-patch16-224',
          { device: 'webgpu' }
        );
        console.log('Model loaded with WebGPU acceleration');
      } catch (webgpuError) {
        console.log('WebGPU not available, falling back to CPU');
        model = await pipeline(
          'image-classification',
          'Xenova/vit-base-patch16-224'
        );
        console.log('Model loaded on CPU');
      }

      setClassifier(model);
      setIsLoading(false);
      return model;
    } catch (error) {
      console.error('Error loading model:', error);
      setError('Failed to load image classification model');
      setIsLoading(false);
      throw error;
    }
  };

  const classifyImage = async (imageElement: HTMLImageElement) => {
    try {
      const model = classifier || await initializeClassifier();
      if (!model) throw new Error('Classifier not available');

      const predictions = await model(imageElement);
      console.log('Classification predictions:', predictions);

      if (predictions && predictions.length > 0) {
        // Process and clean up the top prediction
        const topPrediction = predictions[0];
        let detectedItem = topPrediction.label;

        // Clean up the label to make it more user-friendly
        detectedItem = detectedItem
          .replace(/^[A-Z0-9]+[:\s]+/g, '') // Remove technical prefixes
          .replace(/,.*$/, '') // Remove everything after first comma
          .split(/[\s,]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim();

        return {
          label: detectedItem,
          confidence: topPrediction.score,
          allPredictions: predictions
        };
      }

      throw new Error('No predictions returned');
    } catch (error) {
      console.error('Error classifying image:', error);
      throw error;
    }
  };

  return {
    classifier,
    isLoading,
    error,
    initializeClassifier,
    classifyImage
  };
}