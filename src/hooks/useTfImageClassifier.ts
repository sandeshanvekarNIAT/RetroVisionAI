import { useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import mobilenet, { MobileNet } from '@tensorflow-models/mobilenet';

export function useTfImageClassifier() {
  const modelRef = useRef<MobileNet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeClassifier = async () => {
    if (modelRef.current) return modelRef.current;

    setIsLoading(true);
    setError(null);

    try {
      // Try to use WebGL for best performance; fall back automatically if unavailable
      if (tf.getBackend() !== 'webgl') {
        try {
          await tf.setBackend('webgl');
        } catch {
          // silently keep whatever backend is available
        }
      }
      await tf.ready();

      // Load a lightweight image classification model that runs reliably in browsers
      const model = await mobilenet.load({ version: 2, alpha: 1.0 });
      modelRef.current = model;
      setIsLoading(false);
      return model;
    } catch (e) {
      console.error('TFJS model load error:', e);
      setError('Failed to load image classification model');
      setIsLoading(false);
      throw e;
    }
  };

  const classifyImage = async (imageElement: HTMLImageElement) => {
    const model = modelRef.current ?? (await initializeClassifier());

    const predictions = await model.classify(imageElement, 5);
    if (!predictions || predictions.length === 0) {
      throw new Error('No predictions returned');
    }

    const top = predictions[0];
    const cleanedLabel = top.className
      .split(',')[0]
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      label: cleanedLabel,
      confidence: top.probability,
      allPredictions: predictions.map((p) => ({ label: p.className, score: p.probability })),
    };
  };

  return {
    classifier: modelRef.current,
    isLoading,
    error,
    initializeClassifier,
    classifyImage,
  };
}

