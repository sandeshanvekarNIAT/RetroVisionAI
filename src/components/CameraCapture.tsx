import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTfImageClassifier } from '@/hooks/useTfImageClassifier';

interface CameraCaptureProps {
  onDetection: (detectedItem: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraCapture({ onDetection, isOpen, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { initializeClassifier, classifyImage, isLoading: modelLoading } = useTfImageClassifier();

  // Initialize the model when camera opens
  useEffect(() => {
    if (isOpen) {
      initializeClassifier().catch(error => {
        console.error('Failed to initialize classifier:', error);
        toast({
          title: "Model Loading Failed",
          description: "Could not load image recognition model. Please try again.",
          variant: "destructive"
        });
      });
    }
  }, [isOpen, initializeClassifier, toast]);

  // Start camera stream
  useEffect(() => {
    if (isOpen && !stream) {
      startCamera();
    } else if (!isOpen && stream) {
      stopCamera();
    }

    return () => {
      if (stream) {
        stopCamera();
      }
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsVideoReady(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        const onLoaded = () => {
          setIsVideoReady(true);
          videoRef.current?.play().catch(() => {});
        };
        videoRef.current.onloadedmetadata = onLoaded;
        if (videoRef.current.readyState >= 1) onLoaded();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use this feature.",
        variant: "destructive",
      });
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!isVideoReady || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      toast({
        title: "Camera Not Ready",
        description: "Please wait for the camera to initialize, then try again.",
        variant: "destructive",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(imageDataUrl);
  };

  const processImage = async () => {
    if (!capturedImage) {
      toast({
        title: "Processing Error",
        description: "No image to process.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Processing image with classifier...');
      
      // Convert data URL to image element
      const img = new Image();
      img.onload = async () => {
        try {
          const result = await classifyImage(img);
          
          toast({
            title: "Object Detected!",
            description: `Detected: ${result.label} (${(result.confidence * 100).toFixed(1)}% confidence)`,
          });

          onDetection(result.label);
          handleClose();
        } catch (error) {
          console.error('Error processing image:', error);
          toast({
            title: "Detection Failed",
            description: "Could not identify the object in the image. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      };
      
      img.onerror = () => {
        toast({
          title: "Image Error",
          description: "Failed to load the captured image.",
          variant: "destructive"
        });
        setIsProcessing(false);
      };
      
      img.src = capturedImage;
    } catch (error) {
      console.error('Error in processImage:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    setCapturedImage(null);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Capture Invention</h3>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Camera/Image Display */}
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              {capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => setIsVideoReady(true)}
                />
              )}
            </div>

            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!capturedImage ? (
                <Button 
                  onClick={capturePhoto}
                  className="flex-1"
                  disabled={!isVideoReady}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={retakePhoto}
                    className="flex-1"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                  <Button 
                    onClick={processImage}
                    disabled={isProcessing || modelLoading}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Detect Object
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {modelLoading && (
              <p className="text-sm text-muted-foreground text-center">
                Loading AI model for object detection...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}