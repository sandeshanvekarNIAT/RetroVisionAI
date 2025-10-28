import { useRef, useState, useCallback } from 'react';
import * as ort from 'onnxruntime-web';

// COCO dataset class names (80 classes)
const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
  'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
  'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
  'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
  'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
  'hair drier', 'toothbrush'
];

interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export function useYoloDetector() {
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const initializeDetector = useCallback(async () => {
    if (sessionRef.current) return;
    
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      // Configure ONNX Runtime to use WebGL/WASM
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
      
      setLoadingProgress(20);
      
      // Load YOLOv8n model from Hugging Face
      const modelUrl = 'https://huggingface.co/onnx-community/yolov8n/resolve/main/model.onnx';
      
      setLoadingProgress(40);
      
      const session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['webgl', 'wasm'],
      });
      
      sessionRef.current = session;
      setLoadingProgress(100);
      console.log('YOLOv8 model loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load YOLO model';
      setError(errorMessage);
      console.error('Error loading YOLO model:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const preprocessImage = useCallback((imageElement: HTMLImageElement): Float32Array => {
    const canvas = document.createElement('canvas');
    const size = 640; // YOLOv8 input size
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Draw and resize image
    ctx.drawImage(imageElement, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    
    // Convert to Float32Array in CHW format (channels, height, width)
    // Normalize to [0, 1] range
    const float32Data = new Float32Array(3 * size * size);
    const pixels = imageData.data;
    
    for (let i = 0; i < size * size; i++) {
      float32Data[i] = pixels[i * 4] / 255.0; // R
      float32Data[i + size * size] = pixels[i * 4 + 1] / 255.0; // G
      float32Data[i + size * size * 2] = pixels[i * 4 + 2] / 255.0; // B
    }
    
    return float32Data;
  }, []);

  const detectObjects = useCallback(async (imageElement: HTMLImageElement): Promise<Detection[]> => {
    if (!sessionRef.current) {
      throw new Error('Model not initialized. Call initializeDetector first.');
    }

    try {
      // Preprocess image
      const inputData = preprocessImage(imageElement);
      const inputTensor = new ort.Tensor('float32', inputData, [1, 3, 640, 640]);
      
      // Run inference
      const feeds = { images: inputTensor };
      const results = await sessionRef.current.run(feeds);
      
      // Parse output - YOLOv8 output format: [1, 84, 8400]
      // 84 = 4 bbox coords + 80 class scores
      const output = results.output0.data as Float32Array;
      const detections: Detection[] = [];
      
      const confidenceThreshold = 0.45;
      const numDetections = 8400;
      
      for (let i = 0; i < numDetections; i++) {
        // Get bbox coordinates (center_x, center_y, width, height)
        const cx = output[i];
        const cy = output[i + numDetections];
        const w = output[i + numDetections * 2];
        const h = output[i + numDetections * 3];
        
        // Find max class score
        let maxScore = 0;
        let maxClassId = 0;
        for (let j = 0; j < 80; j++) {
          const score = output[i + numDetections * (4 + j)];
          if (score > maxScore) {
            maxScore = score;
            maxClassId = j;
          }
        }
        
        if (maxScore > confidenceThreshold) {
          // Convert to corner coordinates
          const x1 = cx - w / 2;
          const y1 = cy - h / 2;
          const x2 = cx + w / 2;
          const y2 = cy + h / 2;
          
          detections.push({
            class: COCO_CLASSES[maxClassId],
            confidence: maxScore,
            bbox: [x1, y1, x2, y2]
          });
        }
      }
      
      // Sort by confidence and return top results
      return detections
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10); // Return top 10 detections
      
    } catch (err) {
      console.error('Error during object detection:', err);
      throw err;
    }
  }, [preprocessImage]);

  return {
    initializeDetector,
    detectObjects,
    isLoading,
    error,
    loadingProgress
  };
}
