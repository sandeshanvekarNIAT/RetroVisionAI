import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, 
  Loader2, 
  Download,
  Eye,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function ImageCard({ 
  pathway, 
  era, 
  onGenerate, 
  isLoading, 
  generatedImage 
}) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${pathway.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="truncate">{pathway.title}</span>
          <Badge className="ml-2">
            {pathway.feasibility_score}/10
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {pathway.visual_description || pathway.prototype_description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image Display Area */}
        <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden relative">
          {generatedImage && generatedImage.length > 0 && !imageError ? (
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer relative group">
                  <img
                    src={generatedImage[0].url}
                    alt={`Generated visualization of ${pathway.title}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{pathway.title}</h3>
                    <p className="text-muted-foreground">{era} Era</p>
                  </div>
                  <img
                    src={generatedImage[0].url}
                    alt={`Generated visualization of ${pathway.title}`}
                    className="w-full h-auto rounded-lg"
                    onError={handleImageError}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => downloadImage(
                        generatedImage[0].url, 
                        `${pathway.title}_${era}.png`
                      )}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {isLoading ? (
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-sm">Generating image...</p>
                </div>
              ) : imageError ? (
                <div className="text-center space-y-2">
                  <ImageIcon className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm">Failed to load image</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm">No image generated</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isLoading || (generatedImage && generatedImage.length > 0)}
          className="w-full"
          variant={generatedImage && generatedImage.length > 0 ? "outline" : "default"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : generatedImage && generatedImage.length > 0 ? (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate Image
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Generate Visualization
            </>
          )}
        </Button>

        {/* Download Button for Generated Images */}
        {generatedImage && generatedImage.length > 0 && !imageError && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => downloadImage(
              generatedImage[0].url, 
              `${pathway.title}_${era}.png`
            )}
          >
            <Download className="mr-2 h-3 w-3" />
            Download Image
          </Button>
        )}

        {/* Pathway Info */}
        <div className="pt-2 border-t border-border/50">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Era:</strong> {era}</p>
            <p><strong>Feasibility:</strong> {pathway.feasibility_score}/10</p>
            {pathway.required_breakthroughs && pathway.required_breakthroughs.length > 0 && (
              <p><strong>Key Innovation:</strong> {pathway.required_breakthroughs[0]}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}