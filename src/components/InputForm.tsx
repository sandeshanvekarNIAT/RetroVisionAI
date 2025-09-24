import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Camera, Lightbulb, Clock, Cog, Sparkles } from 'lucide-react';
import CameraCapture from './CameraCapture';
import { useToast } from '@/hooks/use-toast';

const EXAMPLE_INVENTIONS = [
  { name: 'Smartphone', era: '1800s', description: 'Mobile communication device' },
  { name: 'Steam Engine', era: 'Ancient Rome', description: 'Mechanical power generation' },
  { name: 'Printing Press', era: 'Medieval', description: 'Mass text reproduction' },
  { name: 'Airplane', era: '1600s', description: 'Powered flight machine' },
  { name: 'Computer', era: 'Victorian Era', description: 'Automated calculation device' },
  { name: 'Telescope', era: 'Ancient Greece', description: 'Distant object magnification' }
];

const PREDEFINED_ERAS = [
  'Ancient Egypt (3100-30 BCE)',
  'Ancient Greece (800-146 BCE)', 
  'Ancient Rome (753 BCE-476 CE)',
  'Medieval Period (500-1500 CE)',
  'Renaissance (1400-1600)',
  '1600s (17th Century)',
  '1700s (18th Century)', 
  '1800s (19th Century)',
  'Victorian Era (1837-1901)',
  'Early 1900s (1900-1950)'
];

export default function InputForm({ onGenerate, isLoading }) {
  const [invention, setInvention] = useState('');
  const [era, setEra] = useState('1800s');
  const [creativity, setCreativity] = useState([0.7]);
  const [depth, setDepth] = useState([3]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioInput, setAudioInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const handleQuickFill = (example) => {
    setInvention(example.name);
    setEra(example.era);
    toast({
      title: "Example Loaded",
      description: `Filled with: ${example.name} in ${example.era}`,
    });
  };

  const handleVoiceInput = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice recording.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          
          const audioChunks = [];
          mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            transcribeAudio(audioBlob);
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          
          toast({
            title: "Recording started",
            description: "Speak your invention idea...",
          });
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access to use voice input.",
            variant: "destructive"
          });
        });
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setInvention(data.text);
      setAudioInput(data.text);
      
      toast({
        title: "Voice transcribed",
        description: data.cached ? "Used cached transcription" : "Successfully transcribed your voice",
      });
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Could not process your voice input. Please try typing instead.",
        variant: "destructive"
      });
    }
  };

  const handleCameraDetection = (detectedItem: string) => {
    setInvention(detectedItem);
    toast({
      title: "Object Detected!",
      description: `Auto-filled invention: ${detectedItem}`,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!invention.trim()) {
      toast({
        title: "Invention required",
        description: "Please enter an invention name.",
        variant: "destructive"
      });
      return;
    }

    if (!era.trim()) {
      toast({
        title: "Era required", 
        description: "Please specify a historical era.",
        variant: "destructive"
      });
      return;
    }

    onGenerate({
      invention: invention.trim(),
      era: era.trim(),
      creativity: creativity[0],
      depth: depth[0]
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Lightbulb className="h-8 w-8 text-primary animate-pulse-glow" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Reverse-Invention Generator
          </h1>
          <Sparkles className="h-8 w-8 text-accent animate-float" />
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Reimagine how inventions could have emerged in different eras. 
          Enter any invention and discover alternate historical pathways powered by AI.
        </p>
      </div>

      {/* Quick Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Quick Examples
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EXAMPLE_INVENTIONS.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-3 text-left justify-start glass hover:bg-primary/10"
              onClick={() => handleQuickFill(example)}
              disabled={isLoading}
            >
              <div>
                <div className="font-medium">{example.name}</div>
                <div className="text-xs text-muted-foreground">{example.era}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cog className="h-5 w-5" />
            Configure Your Reverse-Invention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invention Input */}
            <div className="space-y-2">
              <Label htmlFor="invention" className="text-base font-medium">
                Invention to Reverse-Engineer
              </Label>
                <div className="flex gap-2">
                <Input
                  id="invention"
                  placeholder="e.g., Smartphone, Steam Engine, Printing Press..."
                  value={invention}
                  onChange={(e) => setInvention(e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isLoading}
                  className="shrink-0"
                  title="Capture photo to detect invention"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                  className="shrink-0"
                  title="Voice input"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              {audioInput && (
                <Badge variant="secondary" className="mt-2">
                  Voice input: "{audioInput}"
                </Badge>
              )}
            </div>

            {/* Era Selection */}
            <div className="space-y-2">
              <Label htmlFor="era" className="text-base font-medium">
                Target Historical Era
              </Label>
              <Select value={era} onValueChange={setEra} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose or type an era..." />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_ERAS.map((eraOption) => (
                    <SelectItem key={eraOption} value={eraOption}>
                      {eraOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type a custom era..."
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="mt-2"
                disabled={isLoading}
              />
            </div>

            {/* Configuration Sliders */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Creativity Level: {(creativity[0] * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={creativity}
                  onValueChange={setCreativity}
                  max={1}
                  min={0}
                  step={0.1}
                  disabled={isLoading}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Higher creativity generates more speculative alternate pathways
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Analysis Depth: {depth[0]} levels
                </Label>
                <Slider
                  value={depth}
                  onValueChange={setDepth}
                  max={5}
                  min={1}
                  step={1}
                  disabled={isLoading}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Deeper analysis provides more detailed technological pathways
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-primary hover:shadow-primary transition-all duration-300"
              disabled={isLoading || !invention.trim() || !era.trim()}
            >
              {isLoading ? (
                <>
                  <Cog className="mr-2 h-4 w-4 animate-spin" />
                  Generating Reverse-Inventions...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Alternate History
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Camera Capture Component */}
      <CameraCapture 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetection={handleCameraDetection}
      />
    </div>
  );
}