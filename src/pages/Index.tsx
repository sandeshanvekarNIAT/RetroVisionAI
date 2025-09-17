import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import InputForm from '@/components/InputForm';
import ResultsView from '@/components/ResultsView';

const Index = () => {
  const [currentView, setCurrentView] = useState('input'); // 'input' | 'results'
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const { toast } = useToast();

  const handleGenerate = async (formData) => {
    setIsLoading(true);
    
    try {
      // Step 1: Deconstruct the invention
      toast({
        title: "Analyzing invention...",
        description: "Breaking down the invention into core components",
      });

      const deconstructResponse = await supabase.functions.invoke('deconstruct', {
        body: { invention: formData.invention }
      });

      if (deconstructResponse.error) {
        throw new Error(deconstructResponse.error.message || 'Failed to analyze invention');
      }

      const { decomposition } = deconstructResponse.data;

      // Step 2: Generate simulations
      toast({
        title: "Generating alternate pathways...",
        description: `Simulating ${formData.invention} in ${formData.era}`,
      });

      const simulateResponse = await supabase.functions.invoke('simulate', {
        body: {
          invention: formData.invention,
          era: formData.era,
          creativity: formData.creativity,
          depth: formData.depth,
          decomposition
        }
      });

      if (simulateResponse.error) {
        throw new Error(simulateResponse.error.message || 'Failed to generate simulations');
      }

      const simulations = simulateResponse.data;

      // Set results and switch to results view
      setResults({
        decomposition,
        simulations,
        invention: formData.invention,
        era: formData.era,
        creativity: formData.creativity,
        depth: formData.depth
      });

      setCurrentView('results');
      
      toast({
        title: "Analysis complete!",
        description: `Generated ${simulations?.pathways?.length || 0} alternate invention pathways`,
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate reverse-invention analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImages = async (pathway, era) => {
    setIsLoadingImages(true);
    
    try {
      toast({
        title: "Generating visualization...",
        description: `Creating visual for ${pathway.title}`,
      });

      const response = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: pathway.visual_description || pathway.prototype_description,
          pathwayData: pathway,
          era: era,
          size: "1024x1024"
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate image');
      }

      const { images } = response.data;

      toast({
        title: "Visualization ready!",
        description: `Generated image for ${pathway.title}`,
      });

      return images;

    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Image generation failed",
        description: error.message || "Could not generate visualization",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleExport = async (exportData) => {
    try {
      toast({
        title: "Preparing export...",
        description: "Generating PowerPoint presentation",
      });

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reverse_invention_${exportData.invention}_${exportData.era}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  const handleBackToInput = () => {
    setCurrentView('input');
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {currentView === 'input' ? (
          <InputForm 
            onGenerate={handleGenerate} 
            isLoading={isLoading}
          />
        ) : (
          <ResultsView
            results={results}
            onGenerateImages={handleGenerateImages}
            onExport={handleExport}
            onBack={handleBackToInput}
            isLoadingImages={isLoadingImages}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
