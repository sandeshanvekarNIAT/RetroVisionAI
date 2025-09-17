import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';

const ERA_TIMELINE = [
  { name: 'Ancient Egypt', start: -3100, end: -30, key: 'ancient_egypt' },
  { name: 'Ancient Greece', start: -800, end: -146, key: 'ancient_greece' },
  { name: 'Ancient Rome', start: -753, end: 476, key: 'ancient_rome' },
  { name: 'Medieval', start: 500, end: 1500, key: 'medieval' },
  { name: 'Renaissance', start: 1400, end: 1600, key: 'renaissance' },
  { name: '17th Century', start: 1600, end: 1699, key: '1600s' },
  { name: '18th Century', start: 1700, end: 1799, key: '1700s' },
  { name: '19th Century', start: 1800, end: 1899, key: '1800s' },
  { name: 'Early 20th Century', start: 1900, end: 1950, key: 'early_1900s' }
];

export default function TimelineSlider({ 
  selectedEra, 
  onEraChange, 
  pathways = [],
  className = ""
}) {
  const [sliderValue, setSliderValue] = useState([1800]);
  const [currentEra, setCurrentEra] = useState(null);

  // Convert year to era
  const getEraFromYear = (year) => {
    return ERA_TIMELINE.find(era => year >= era.start && year <= era.end) || ERA_TIMELINE[7]; // Default to 1800s
  };

  // Convert era name to approximate year
  const getYearFromEra = (eraName) => {
    const era = ERA_TIMELINE.find(e => 
      e.name.toLowerCase().includes(eraName.toLowerCase()) ||
      e.key === eraName.toLowerCase()
    );
    return era ? Math.floor((era.start + era.end) / 2) : 1800;
  };

  // Update slider when selectedEra prop changes
  useEffect(() => {
    if (selectedEra) {
      const year = getYearFromEra(selectedEra);
      setSliderValue([year]);
      setCurrentEra(getEraFromYear(year));
    }
  }, [selectedEra]);

  const handleSliderChange = (value) => {
    const year = value[0];
    setSliderValue(value);
    const era = getEraFromYear(year);
    setCurrentEra(era);
    
    if (onEraChange) {
      onEraChange(era.name, year);
    }
  };

  // Get feasibility statistics for current era
  const getFeasibilityStats = () => {
    if (!pathways.length) return null;
    
    const scores = pathways.map(p => p.feasibility_score || 0);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    
    return { average, max, min, count: scores.length };
  };

  const stats = getFeasibilityStats();

  const formatYear = (year) => {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    return `${year} CE`;
  };

  return (
    <Card className={`glass ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Historical Timeline
        </CardTitle>
        {currentEra && (
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-sm">
              {currentEra.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatYear(sliderValue[0])}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Era Slider */}
        <div className="space-y-4">
          <div className="px-2">
            <Slider
              value={sliderValue}
              onValueChange={handleSliderChange}
              min={-3100}
              max={1950}
              step={50}
              className="w-full"
            />
          </div>

          {/* Era Markers */}
          <div className="relative">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3100 BCE</span>
              <span>0</span>
              <span>1000</span>
              <span>1950</span>
            </div>
            
            {/* Era Labels */}
            <div className="mt-2 space-y-1">
              {ERA_TIMELINE.map((era) => {
                const isActive = currentEra?.key === era.key;
                return (
                  <div
                    key={era.key}
                    className={`text-xs p-1 rounded transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-primary/20 text-primary font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      const midYear = Math.floor((era.start + era.end) / 2);
                      handleSliderChange([midYear]);
                    }}
                  >
                    {era.name} ({formatYear(era.start)} - {formatYear(era.end)})
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feasibility Statistics */}
        {stats && (
          <div className="border-t border-border/50 pt-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Feasibility in {currentEra?.name}
            </h4>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <div className="text-lg font-bold text-green-400">
                  {stats.max}/10
                </div>
                <div className="text-xs text-muted-foreground">Highest</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-400">
                  {stats.average.toFixed(1)}/10
                </div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-lg font-bold text-orange-400">
                  {stats.min}/10
                </div>
                <div className="text-xs text-muted-foreground">Lowest</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {stats.count} alternate pathway{stats.count !== 1 ? 's' : ''} analyzed
            </div>
          </div>
        )}

        {/* Current Era Description */}
        {currentEra && (
          <div className="border-t border-border/50 pt-4">
            <h4 className="font-medium text-sm mb-2">Era Context</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getEraDescription(currentEra.key)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getEraDescription(eraKey) {
  const descriptions = {
    ancient_egypt: "Advanced civilization with sophisticated engineering, mathematics, and craftsmanship. Known for monumental architecture and early metallurgy.",
    ancient_greece: "Golden age of philosophy, mathematics, and engineering. Advanced understanding of mechanics, optics, and natural sciences.",
    ancient_rome: "Engineering excellence with concrete, aqueducts, and complex machinery. Extensive trade networks and technological innovation.",
    medieval: "Guild-based craftsmanship, water and wind power, early mechanical clocks. Limited but growing scientific knowledge.",
    renaissance: "Revival of learning, precision instruments, printing press. Intersection of art, science, and engineering innovation.",
    "1600s": "Scientific revolution, early industrial processes, improved metallurgy. Growing understanding of physics and mechanics.",
    "1700s": "Age of Enlightenment, steam power emergence, precision manufacturing. Industrial revolution beginning.",
    "1800s": "Full industrial revolution, electricity discovery, mass production. Rapid technological and scientific advancement.",
    early_1900s: "Electronics, assembly lines, powered flight. Foundation of modern industrial and technological capabilities."
  };
  
  return descriptions[eraKey] || "A significant period in human technological development.";
}