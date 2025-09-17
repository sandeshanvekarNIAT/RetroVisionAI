import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  Clock, 
  Lightbulb,
  Cog,
  Star,
  Zap,
  BookOpen,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import ImageCard from './ImageCard';
import TimelineSlider from './TimelineSlider';

export default function ResultsView({ 
  results, 
  onGenerateImages, 
  onExport,
  onBack,
  isLoadingImages = false 
}) {
  const [selectedPathway, setSelectedPathway] = useState(0);
  const [narratives, setNarratives] = useState({});
  const [loadingNarratives, setLoadingNarratives] = useState({});
  const [generatedImages, setGeneratedImages] = useState({});
  
  const { toast } = useToast();

  const { decomposition, simulations, invention, era } = results || {};
  const pathways = simulations?.pathways || [];

  useEffect(() => {
    if (pathways.length > 0) {
      setSelectedPathway(0);
    }
  }, [pathways]);

  const generateNarrative = async (pathway) => {
    if (narratives[pathway.id] || loadingNarratives[pathway.id]) {
      return;
    }

    setLoadingNarratives(prev => ({ ...prev, [pathway.id]: true }));

    try {
      const response = await fetch('/api/narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pathwayData: pathway,
          era: era
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate narrative');
      }

      const data = await response.json();
      setNarratives(prev => ({
        ...prev,
        [pathway.id]: data.narrative
      }));

      toast({
        title: "Narrative generated",
        description: `Historical entry for "${pathway.title}" is ready`,
      });

    } catch (error) {
      console.error('Narrative generation error:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate historical narrative. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingNarratives(prev => ({ ...prev, [pathway.id]: false }));
    }
  };

  const handleGenerateImages = async (pathway) => {
    if (generatedImages[pathway.id] || isLoadingImages) {
      return;
    }

    try {
      const images = await onGenerateImages(pathway, era);
      setGeneratedImages(prev => ({
        ...prev,
        [pathway.id]: images
      }));
    } catch (error) {
      console.error('Image generation failed:', error);
    }
  };

  const handleExport = async () => {
    try {
      await onExport({
        title: `${invention} in ${era}`,
        invention,
        era,
        decomposition,
        simulations,
        narratives,
        images: generatedImages
      });

      toast({
        title: "Export successful",
        description: "Your presentation has been downloaded",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "Could not export presentation. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!results) {
    return null;
  }

  const currentPathway = pathways[selectedPathway];
  const feasibilityColor = (score) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400'; 
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-primary" />
            Alternate History Results
          </h2>
          <p className="text-muted-foreground mt-2">
            {invention} reimagined in {era}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            ← New Analysis
          </Button>
          <Button onClick={handleExport} className="bg-gradient-accent">
            <Download className="mr-2 h-4 w-4" />
            Export PPTX
          </Button>
        </div>
      </div>

      <Tabs defaultValue="decomposition" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="decomposition" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="simulations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pathways
          </TabsTrigger>
          <TabsTrigger value="visuals" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Visuals
          </TabsTrigger>
          <TabsTrigger value="narrative" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Decomposition Tab */}
        <TabsContent value="decomposition" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5" />
                Invention Deconstruction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {decomposition && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Core Functions</h4>
                      <div className="flex flex-wrap gap-2">
                        {decomposition.core_functions?.map((func, i) => (
                          <Badge key={i} variant="secondary">{func}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-2">Key Materials</h4>
                      <div className="flex flex-wrap gap-2">
                        {decomposition.materials?.map((material, i) => (
                          <Badge key={i} variant="outline">{material}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-2">Enabling Sciences</h4>
                      <div className="flex flex-wrap gap-2">
                        {decomposition.enabling_sciences?.map((science, i) => (
                          <Badge key={i} className="bg-accent/20 text-accent-foreground">{science}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Subsystems</h4>
                      <div className="space-y-2">
                        {decomposition.subsystems?.map((subsystem, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50">
                            <div className="font-medium">{subsystem.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {subsystem.dependencies?.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-2">Cultural Drivers</h4>
                      <div className="space-y-1">
                        {decomposition.cultural_drivers?.map((driver, i) => (
                          <div key={i} className="text-sm">• {driver}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulations Tab */}
        <TabsContent value="simulations" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pathway Selection */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Alternate Pathways
              </h3>
              <div className="space-y-3">
                {pathways.map((pathway, index) => (
                  <Card 
                    key={pathway.id} 
                    className={`cursor-pointer transition-all glass hover:shadow-primary ${
                      selectedPathway === index ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedPathway(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{pathway.title}</h4>
                        <Badge className={feasibilityColor(pathway.feasibility_score)}>
                          {pathway.feasibility_score}/10
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {pathway.narrative}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Selected Pathway Details */}
            <div className="lg:col-span-2">
              {currentPathway && (
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{currentPathway.title}</span>
                      <div className="flex items-center gap-2">
                        <Star className={`h-5 w-5 ${feasibilityColor(currentPathway.feasibility_score)}`} />
                        <span className={`font-bold ${feasibilityColor(currentPathway.feasibility_score)}`}>
                          {currentPathway.feasibility_score}/10
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Narrative */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Historical Context
                      </h4>
                      <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {currentPathway.narrative}
                      </p>
                    </div>

                    {/* Technical Steps */}
                    {currentPathway.technical_steps && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Technical Implementation
                        </h4>
                        <div className="space-y-2">
                          {currentPathway.technical_steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                                {i + 1}
                              </div>
                              <p className="text-sm flex-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prototype Description */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Prototype Design
                      </h4>
                      <p className="text-sm bg-muted/30 p-4 rounded-lg">
                        {currentPathway.prototype_description}
                      </p>
                    </div>

                    {/* Required Breakthroughs */}
                    {currentPathway.required_breakthroughs && (
                      <div>
                        <h4 className="font-semibold mb-2">Key Innovations Required</h4>
                        <div className="flex flex-wrap gap-2">
                          {currentPathway.required_breakthroughs.map((breakthrough, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {breakthrough}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cultural Impact */}
                    {currentPathway.cultural_impact && (
                      <div>
                        <h4 className="font-semibold mb-2">Cultural Impact</h4>
                        <p className="text-sm text-muted-foreground">
                          {currentPathway.cultural_impact}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Visuals Tab */}
        <TabsContent value="visuals" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pathways.map((pathway) => (
              <ImageCard
                key={pathway.id}
                pathway={pathway}
                era={era}
                onGenerate={() => handleGenerateImages(pathway)}
                isLoading={isLoadingImages}
                generatedImage={generatedImages[pathway.id]}
              />
            ))}
          </div>
        </TabsContent>

        {/* Narrative Tab */}
        <TabsContent value="narrative" className="space-y-6">
          <div className="grid gap-6">
            {pathways.map((pathway) => (
              <Card key={pathway.id} className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Historical Entry: {pathway.title}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateNarrative(pathway)}
                      disabled={loadingNarratives[pathway.id]}
                    >
                      {loadingNarratives[pathway.id] ? (
                        <>
                          <Cog className="mr-2 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : narratives[pathway.id] ? (
                        'Regenerate'
                      ) : (
                        <>
                          <FileText className="mr-2 h-3 w-3" />
                          Generate Entry
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {narratives[pathway.id] ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                        {narratives[pathway.id]}
                      </p>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-8">
                      <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Click "Generate Entry" to create a detailed historical narrative</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}